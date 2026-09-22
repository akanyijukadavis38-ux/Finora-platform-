const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Admin = require("./Admin");
const User = require("./user");
const Investment = require("./investment");
const Deposit = require("./Deposit");
const requireAdmin = require("./adminAuth");
const {
    getEffectiveUserStatus
} = require("./userStatus");

const router = express.Router();

/* =========================================================
FINORA ADMIN SECURITY SETTINGS
========================================================= */

const RECOVERY_SESSION_MINUTES = 10;


/* =========================================================
GENERATE SECURE RECOVERY KEY
========================================================= */

function generateRecoveryKey() {

    return (
        crypto.randomBytes(24).toString("base64url")
    );

}


/* =========================================================
ONE-TIME PERMANENT ADMIN ACCOUNT SETUP
========================================================= */

router.post(
    "/setup",
    async (req, res) => {

        try {

            const {
                setupKey,
                username,
                email,
                password,
                confirmPassword
            } = req.body;


            if (
                !setupKey ||
                !process.env.ADMIN_SETUP_KEY ||
                setupKey !==
                    process.env.ADMIN_SETUP_KEY
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Admin setup authorization failed."
                });
            }


            const existingAdmin =
                await Admin.findOne({});


            if (existingAdmin) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Admin setup has already been completed."
                });
            }


            const cleanUsername =
                String(
                    username || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                cleanUsername.length < 3
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Admin username must be at least 3 characters."
                });
            }


            const cleanEmail =
                String(
                    email || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                !cleanEmail ||
                !cleanEmail.includes("@")
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A valid Admin email address is required."
                });
            }


            const cleanPassword =
                String(
                    password || ""
                );


            const cleanConfirmPassword =
                String(
                    confirmPassword || ""
                );


            if (
                cleanPassword.length < 6
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Admin password must be at least 6 characters."
                });
            }


            if (
                cleanPassword !==
                cleanConfirmPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Passwords do not match."
                });
            }


            const passwordHash =
                await bcrypt.hash(
                    cleanPassword,
                    12
                );


            const recoveryKey =
                generateRecoveryKey();


            const recoveryKeyHash =
                await bcrypt.hash(
                    recoveryKey,
                    12
                );


            const admin =
                new Admin({

                    username:
                        cleanUsername,

                    email:
                        cleanEmail,

                    passwordHash,

                    recoveryKeyHash,

                    recoveryKeyVersion:
                        1,

                    status:
                        "active"
                });


            await admin.save();


            return res.status(201).json({

                success: true,

                message:
                    "FINORA permanent Admin account created successfully.",

                admin: {

                    username:
                        admin.username,

                    email:
                        admin.email
                },

                recoveryKey

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN SETUP ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not create the Admin account."
            });
        }
    }
);


/* =========================================================
LOGIN
========================================================= */

router.post(
    "/login",
    async (req, res) => {

        try {

            const identifier =
                String(
                    req.body.identifier || ""
                )
                    .trim()
                    .toLowerCase();

            const password =
                String(
                    req.body.password || ""
                );


            if (
                !identifier ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Admin username/email and password are required."
                });
            }


            const admin =
                await Admin.findOne({

                    $or: [
                        {
                            username:
                                identifier
                        },
                        {
                            email:
                                identifier
                        }
                    ]

                }).select(
                    "+passwordHash"
                );


            if (!admin) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Admin credentials."
                });
            }


            if (
                admin.status !==
                "active"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "This Admin account is disabled."
                });
            }


            const passwordMatches =
                await bcrypt.compare(
                    password,
                    admin.passwordHash
                );


            if (!passwordMatches) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Admin credentials."
                });
            }


            req.session.adminId =
                admin._id.toString();


            delete req.session.adminRecoveryId;
            delete req.session.adminRecoveryExpires;


            admin.lastLogin =
                new Date();

            await admin.save();


            await new Promise(
                (resolve, reject) => {

                    req.session.save(
                        error => {

                            if (error) {

                                return reject(
                                    error
                                );
                            }

                            resolve();
                        }
                    );
                }
            );


            return res.status(200).json({

                success: true,

                message:
                    "Admin login successful.",

                admin: {

                    id:
                        admin._id,

                    username:
                        admin.username,

                    email:
                        admin.email,

                    status:
                        admin.status,

                    lastLogin:
                        admin.lastLogin
                }
            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN LOGIN ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA Admin login failed."
            });
        }
    }
);


/* =========================================================
CURRENT ADMIN
========================================================= */

router.get(
    "/me",
    requireAdmin,
    async (req, res) => {

        return res.status(200).json({

            success: true,

            admin: {

                id:
                    req.admin._id,

                username:
                    req.admin.username,

                email:
                    req.admin.email,

                status:
                    req.admin.status,

                lastLogin:
                    req.admin.lastLogin
            }
        });
    }
);


/* =========================================================
ADMIN — GET ALL USERS

Account lifecycle:

REGISTERED
    ↓
INACTIVE
    ↓
APPROVED DEPOSIT >= UGX 10,000
    +
INVESTMENT
    ↓
ACTIVE

Frozen users remain frozen regardless of investment status.

Investment information comes from the REAL Investment
collection.

Deposit qualification comes from the REAL Deposit
collection.
========================================================= */

router.get(
    "/users",
    requireAdmin,
    async (req, res) => {

        try {

            const users =
                await User.find({})
                    .select(
                        "_id fullName phone email balance totalIncome totalDeposit totalWithdrawal referralCode referredByCode status createdAt updatedAt"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            const userIds =
                users.map(
                    user => user._id
                );


            /* =============================================
               GET ALL INVESTMENTS ONCE
            ============================================= */

            const investments =
                userIds.length > 0
                    ? await Investment.find({
                        user: {
                            $in: userIds
                        }
                    })
                        .select(
                            "user amount status startDate endDate"
                        )
                        .sort({
                            createdAt: -1
                        })
                        .lean()
                    : [];


            /* =============================================
               GET QUALIFYING APPROVED DEPOSITS ONCE
            ============================================= */

            const approvedDeposits =
                userIds.length > 0
                    ? await Deposit.find({
                        user: {
                            $in: userIds
                        },

                        status:
                            "approved",

                        amount: {
                            $gte:
                                10000
                        }
                    })
                        .select(
                            "user amount"
                        )
                        .lean()
                    : [];


            /* =============================================
               BUILD INVESTMENT MAP

               Latest investment for each user.
            ============================================= */

            const investmentMap =
                new Map();


            for (
                const investment
                of investments
            ) {

                const key =
                    investment.user.toString();


                if (
                    !investmentMap.has(key)
                ) {

                    investmentMap.set(
                        key,
                        investment
                    );

                }

            }


            /* =============================================
               BUILD QUALIFYING DEPOSIT SET
            ============================================= */

            const qualifyingDepositUsers =
                new Set();


            for (
                const deposit
                of approvedDeposits
            ) {

                qualifyingDepositUsers.add(
                    deposit.user.toString()
                );

            }


            /* =============================================
               CALCULATE EFFECTIVE USER STATUS

               This uses the same lifecycle as userRoutes.
            ============================================= */

            const usersWithStatus =
                users.map(
                    user => {

                        const userKey =
                            user._id.toString();


                        const investment =
                            investmentMap.get(
                                userKey
                            );


                        let effectiveStatus;


                        if (
                            user.status ===
                            "frozen"
                        ) {

                            effectiveStatus =
                                "frozen";

                        } else {

                            const hasApprovedDeposit =
                                qualifyingDepositUsers.has(
                                    userKey
                                );

                            const hasInvestment =
                                Boolean(
                                    investment
                                );


                            effectiveStatus =
                                hasApprovedDeposit &&
                                hasInvestment
                                    ? "active"
                                    : "inactive";

                        }


                        return {

                            ...user,

                            status:
                                effectiveStatus,

                            investmentStatus:
                                investment
                                    ? "invested"
                                    : "not-invested",

                            investment:
                                investment
                                    ? {
                                        amount:
                                            investment.amount,

                                        status:
                                            investment.status,

                                        startDate:
                                            investment.startDate,

                                        endDate:
                                            investment.endDate
                                    }
                                    : null

                        };

                    }
                );


            /* =============================================
               REAL COUNTS

               Counts are based on effective status,
               not old User.status values.
            ============================================= */

            const totalUsers =
                usersWithStatus.length;


            const activeUsers =
                usersWithStatus.filter(
                    user =>
                        user.status ===
                        "active"
                ).length;


            const frozenUsers =
                usersWithStatus.filter(
                    user =>
                        user.status ===
                        "frozen"
                ).length;


            const inactiveUsers =
                usersWithStatus.filter(
                    user =>
                        user.status ===
                        "inactive"
                ).length;


            return res.status(200).json({

                success: true,

                users:
                    usersWithStatus,

                counts: {

                    total:
                        totalUsers,

                    active:
                        activeUsers,

                    inactive:
                        inactiveUsers,

                    frozen:
                        frozenUsers

                }

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN USERS FETCH ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load users."
            });
        }
    }
);


/* =========================================================
ADMIN — GET ONE USER

Used for the User Details view.

Returns:

- account information
- effective account status
- wallet balance
- total deposit
- total invested
- total withdrawal
- total income
- investment details
========================================================= */

router.get(
    "/users/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const userId =
                String(
                    req.params.id || ""
                ).trim();


            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid user ID."
                });
            }


            const user =
                await User.findById(
                    userId
                )
                    .select(
                        "_id fullName phone email balance totalIncome totalDeposit totalWithdrawal referralCode referredByCode status createdAt updatedAt"
                    )
                    .lean();


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."
                });
            }


            /* =============================================
               GET THIS USER'S INVESTMENTS
            ============================================= */

            const investments =
                await Investment.find({
                    user: userId
                })
                    .select(
                        "user amount dailyRate dailyEarnings duration earned daysCompleted daysRemaining startDate endDate nextEarningAt status createdAt updatedAt"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            const latestInvestment =
                investments.length > 0
                    ? investments[0]
                    : null;


            /* =============================================
               CALCULATE EFFECTIVE STATUS
            ============================================= */

            const effectiveStatus =
                await getEffectiveUserStatus(
                    user
                );


            /* =============================================
               TOTAL INVESTED

               Always comes from actual Investment records.
            ============================================= */

            const totalInvested =
                investments.reduce(
                    (
                        total,
                        investment
                    ) => {

                        return (
                            total +
                            (
                                Number(
                                    investment.amount
                                ) || 0
                            )
                        );

                    },
                    0
                );


            return res.status(200).json({

                success: true,

                user: {

                    ...user,

                    status:
                        effectiveStatus,

                    totalInvested:
                        totalInvested,

                    total_invested:
                        totalInvested,

                    investmentStatus:
                        latestInvestment
                            ? "invested"
                            : "not-invested",

                    investments,

                    latestInvestment

                }

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN USER DETAILS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load this user."
            });
        }
    }
);


/* =========================================================
ADMIN — FREEZE / UNFREEZE USER

Admin can:

active
frozen

When an account is changed back to active, the effective
status system still determines whether the account actually
qualifies as active.

Therefore:

- frozen + no qualification → inactive after unfreeze
- frozen + qualification → active after unfreeze
========================================================= */

router.patch(
    "/users/:id/status",
    requireAdmin,
    async (req, res) => {

        try {

            const userId =
                String(
                    req.params.id || ""
                ).trim();


            const requestedStatus =
                String(
                    req.body.status || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid user ID."
                });
            }


            if (
                ![
                    "active",
                    "frozen"
                ].includes(
                    requestedStatus
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "User status must be active or frozen."
                });
            }


            const user =
                await User.findById(
                    userId
                );


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."
                });
            }


            user.status =
                requestedStatus;


            await user.save();


            const effectiveStatus =
                await getEffectiveUserStatus(
                    user
                );


            return res.status(200).json({

                success: true,

                message:
                    requestedStatus === "frozen"
                        ? "User account frozen successfully."
                        : "User account status updated successfully.",

                user: {

                    _id:
                        user._id,

                    fullName:
                        user.fullName,

                    phone:
                        user.phone,

                    email:
                        user.email,

                    balance:
                        user.balance,

                    totalIncome:
                        user.totalIncome,

                    totalDeposit:
                        user.totalDeposit,

                    totalWithdrawal:
                        user.totalWithdrawal,

                    referralCode:
                        user.referralCode,

                    referredByCode:
                        user.referredByCode,

                    status:
                        effectiveStatus,

                    createdAt:
                        user.createdAt,

                    updatedAt:
                        user.updatedAt

                }

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN USER STATUS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not update the user status."
            });
        }
    }
);


/* =========================================================
FORGOT PASSWORD — VERIFY RECOVERY KEY
========================================================= */

router.post(
    "/forgot-password/verify",
    async (req, res) => {

        try {

            const identifier =
                String(
                    req.body.identifier || ""
                )
                    .trim()
                    .toLowerCase();

            const recoveryKey =
                String(
                    req.body.recoveryKey || ""
                )
                    .trim();


            if (
                !identifier ||
                !recoveryKey
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Admin username/email and recovery key are required."
                });
            }


            const admin =
                await Admin.findOne({

                    $or: [
                        {
                            username:
                                identifier
                        },
                        {
                            email:
                                identifier
                        }
                    ]

                }).select(
                    "+recoveryKeyHash"
                );


            if (
                !admin ||
                admin.status !==
                    "active" ||
                !admin.recoveryKeyHash
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "The recovery information could not be verified."
                });
            }


            const recoveryMatches =
                await bcrypt.compare(
                    recoveryKey,
                    admin.recoveryKeyHash
                );


            if (
                !recoveryMatches
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "The recovery information could not be verified."
                });
            }


            req.session.adminRecoveryId =
                admin._id.toString();

            req.session.adminRecoveryExpires =
                Date.now() +
                (
                    RECOVERY_SESSION_MINUTES *
                    60 *
                    1000
                );


            await new Promise(
                (resolve, reject) => {

                    req.session.save(
                        error => {

                            if (error) {

                                return reject(
                                    error
                                );
                            }

                            resolve();
                        }
                    );
                }
            );


            return res.status(200).json({

                success: true,

                message:
                    "Recovery key verified. You may now create a new Admin password."
            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN RECOVERY VERIFICATION ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not verify the recovery information."
            });
        }
    }
);


/* =========================================================
FORGOT PASSWORD — RESET PASSWORD
========================================================= */

router.post(
    "/forgot-password/reset",
    async (req, res) => {

        try {

            if (
                !req.session ||
                !req.session.adminRecoveryId ||
                !req.session.adminRecoveryExpires
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Admin password recovery session is missing or expired."
                });
            }


            if (
                Date.now() >
                Number(
                    req.session.adminRecoveryExpires
                )
            ) {

                delete req.session.adminRecoveryId;
                delete req.session.adminRecoveryExpires;


                return res.status(401).json({

                    success: false,

                    message:
                        "Admin password recovery session has expired. Please start again."
                });
            }


            const newPassword =
                String(
                    req.body.newPassword || ""
                );

            const confirmPassword =
                String(
                    req.body.confirmPassword || ""
                );


            if (
                !newPassword ||
                !confirmPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "New password and confirmation are required."
                });
            }


            if (
                newPassword.length <
                6
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Admin password must be at least 6 characters."
                });
            }


            if (
                newPassword !==
                confirmPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Passwords do not match."
                });
            }


            const admin =
                await Admin.findById(
                    req.session.adminRecoveryId
                ).select(
                    "+passwordHash +recoveryKeyHash"
                );


            if (!admin) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Admin account could not be found."
                });
            }


            if (
                admin.status !==
                "active"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "This Admin account is disabled."
                });
            }


            const newRecoveryKey =
                generateRecoveryKey();


            const newPasswordHash =
                await bcrypt.hash(
                    newPassword,
                    12
                );


            const newRecoveryKeyHash =
                await bcrypt.hash(
                    newRecoveryKey,
                    12
                );


            admin.passwordHash =
                newPasswordHash;

            admin.recoveryKeyHash =
                newRecoveryKeyHash;

            admin.recoveryKeyVersion =
                Number(
                    admin.recoveryKeyVersion || 1
                ) + 1;


            await admin.save();


            await new Promise(
                (resolve, reject) => {

                    req.session.destroy(
                        error => {

                            if (error) {

                                return reject(
                                    error
                                );
                            }

                            resolve();
                        }
                    );
                }
            );


            return res.status(200).json({

                success: true,

                message:
                    "Admin password has been reset successfully.",

                recoveryKey:
                    newRecoveryKey
            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN PASSWORD RESET ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not reset the Admin password."
            });
        }
    }
);


/* =========================================================
LOGOUT
========================================================= */

router.post(
    "/logout",
    requireAdmin,
    async (req, res) => {

        try {

            req.session.destroy(
                error => {

                    if (error) {

                        console.error(
                            "❌ FINORA ADMIN LOGOUT ERROR:",
                            error
                        );


                        return res.status(500).json({

                            success: false,

                            message:
                                "Admin logout failed."
                        });
                    }


                    return res.status(200).json({

                        success: true,

                        message:
                            "Admin logged out successfully."
                    });
                }
            );

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN LOGOUT ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Admin logout failed."
            });
        }
    }
);


/* =========================================================
EXPORT ADMIN ROUTER
========================================================= */

module.exports =
    router;


/* =========================================================
EXPORT RECOVERY-KEY GENERATOR
========================================================= */

module.exports.generateRecoveryKey =
    generateRecoveryKey;
