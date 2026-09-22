const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Admin = require("./Admin");
const User = require("./user");
const Investment = require("./investment");
const Deposit = require("./Deposit");
const Withdrawal = require("./Withdrawal");
const Transaction = require("./Transaction");
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
ADMIN — OVERVIEW
========================================================= */

router.get(
    "/overview",
    requireAdmin,
    async (req, res) => {

        try {

            /* =============================================
               BASIC DATABASE STATUS
            ============================================= */

            const databaseReady =
                mongoose.connection.readyState === 1;


            /* =============================================
               LOAD USERS
            ============================================= */

            const users =
                await User.find({})
                    .select(
                        "_id status"
                    )
                    .lean();


            const userIds =
                users.map(
                    user => user._id
                );


            /* =============================================
               LOAD QUALIFYING APPROVED DEPOSITS
            ============================================= */

            const qualifyingDeposits =
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
                            "user"
                        )
                        .lean()
                    : [];


            /* =============================================
               LOAD INVESTMENT USERS
            ============================================= */

            const investmentUsers =
                userIds.length > 0
                    ? await Investment.find({

                        user: {
                            $in: userIds
                        }

                    })
                        .select(
                            "user"
                        )
                        .lean()
                    : [];


            /* =============================================
               BUILD USER STATUS SETS
            ============================================= */

            const qualifyingDepositUsers =
                new Set();


            for (
                const deposit
                of qualifyingDeposits
            ) {

                qualifyingDepositUsers.add(
                    deposit.user.toString()
                );

            }


            const investmentUserSet =
                new Set();


            for (
                const investment
                of investmentUsers
            ) {

                investmentUserSet.add(
                    investment.user.toString()
                );

            }


            /* =============================================
               CALCULATE EFFECTIVE USER COUNTS

               REGISTERED
                    ↓
               INACTIVE
                    ↓
               APPROVED DEPOSIT >= 10,000
                    +
               INVESTMENT
                    ↓
               ACTIVE

               Frozen always remains frozen.
            ============================================= */

            let activeUsers = 0;
            let frozenUsers = 0;
            let inactiveUsers = 0;


            for (
                const user
                of users
            ) {

                const userId =
                    user._id.toString();


                if (
                    user.status ===
                    "frozen"
                ) {

                    frozenUsers++;

                    continue;
                }


                const hasQualifyingDeposit =
                    qualifyingDepositUsers.has(
                        userId
                    );


                const hasInvestment =
                    investmentUserSet.has(
                        userId
                    );


                if (
                    hasQualifyingDeposit &&
                    hasInvestment
                ) {

                    activeUsers++;

                } else {

                    inactiveUsers++;

                }

            }


            /* =============================================
               FINANCIAL TOTALS

               These are calculated from real records,
               not User.totalDeposit or other cached
               summary fields.
            ============================================= */

            const [
                totalDepositedResult,
                totalWithdrawnResult,
                totalInvestedResult,
                totalEarningsResult,
                pendingDeposits,
                pendingWithdrawals,
                recentTransactions
            ] = await Promise.all([

                Deposit.aggregate([

                    {
                        $match: {
                            status:
                                "approved"
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            total: {
                                $sum:
                                    "$amount"
                            }
                        }
                    }

                ]),

                Withdrawal.aggregate([

                    {
                        $match: {

                            status: {
                                $in: [
                                    "approved",
                                    "completed"
                                ]
                            }

                        }
                    },

                    {
                        $group: {

                            _id: null,

                            total: {
                                $sum:
                                    "$amount"
                            }

                        }

                    }

                ]),

                Investment.aggregate([

                    {
                        $group: {

                            _id: null,

                            total: {
                                $sum:
                                    "$amount"
                            }

                        }

                    }

                ]),

                Transaction.aggregate([

                    {
                        $match: {

                            type:
                                "earning",

                            direction:
                                "credit",

                            status:
                                "completed"

                        }
                    },

                    {
                        $group: {

                            _id: null,

                            total: {
                                $sum:
                                    "$amount"
                            }

                        }

                    }

                ]),

                Deposit.countDocuments({
                    status:
                        "pending"
                }),

                Withdrawal.countDocuments({
                    status:
                        "pending"
                }),

                Transaction.find({})
                    .select(
                        "user type amount direction status description reference createdAt"
                    )
                    .populate(
                        "user",
                        "fullName phone"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .limit(10)
                    .lean()

            ]);


            /* =============================================
               EXTRACT TOTALS
            ============================================= */

            const totalDeposited =
                Number(
                    totalDepositedResult[0]?.total
                ) || 0;


            const totalWithdrawn =
                Number(
                    totalWithdrawnResult[0]?.total
                ) || 0;


            const totalInvested =
                Number(
                    totalInvestedResult[0]?.total
                ) || 0;


            const totalEarningsCredited =
                Number(
                    totalEarningsResult[0]?.total
                ) || 0;


            /* =============================================
               FORMAT RECENT ACTIVITY

               Keep the response compact for the
               Admin Overview frontend.
            ============================================= */

            const recentActivity =
                recentTransactions.map(
                    transaction => {

                        return {

                            id:
                                transaction._id,

                            user:
                                transaction.user
                                    ? {
                                        id:
                                            transaction.user._id,

                                        fullName:
                                            transaction.user.fullName,

                                        phone:
                                            transaction.user.phone
                                    }
                                    : null,

                            type:
                                transaction.type,

                            amount:
                                Number(
                                    transaction.amount
                                ) || 0,

                            direction:
                                transaction.direction,

                            status:
                                transaction.status,

                            description:
                                transaction.description,

                            reference:
                                transaction.reference,

                            createdAt:
                                transaction.createdAt

                        };

                    }
                );


            /* =============================================
               SYSTEM STATUS
            ============================================= */

            const system = {

                server: {

                    status:
                        "online",

                    label:
                        "Online"

                },

                database: {

                    status:
                        databaseReady
                            ? "connected"
                            : "disconnected",

                    label:
                        databaseReady
                            ? "Connected"
                            : "Disconnected"

                },

                authentication: {

                    status:
                        "authenticated",

                    label:
                        "Authenticated"

                },

                maintenance: {

                    status:
                        "operational",

                    label:
                        "Operational"

                }

            };


            /* =============================================
               FINAL OVERVIEW RESPONSE
            ============================================= */

            return res.status(200).json({

                success: true,

                overview: {

                    users: {

                        total:
                            users.length,

                        active:
                            activeUsers,

                        inactive:
                            inactiveUsers,

                        frozen:
                            frozenUsers

                    },

                    finance: {

                        totalDeposited:
                            totalDeposited,

                        totalWithdrawn:
                            totalWithdrawn,

                        totalInvested:
                            totalInvested,

                        totalEarningsCredited:
                            totalEarningsCredited

                    },

                    pending: {

                        deposits:
                            pendingDeposits,

                        withdrawals:
                            pendingWithdrawals

                    },

                    recentActivity,

                    system

                },

                users: {

                    total:
                        users.length,

                    active:
                        activeUsers,

                    inactive:
                        inactiveUsers,

                    frozen:
                        frozenUsers

                },

                finance: {

                    totalDeposited:
                        totalDeposited,

                    totalWithdrawn:
                        totalWithdrawn,

                    totalInvested:
                        totalInvested,

                    totalEarningsCredited:
                        totalEarningsCredited

                },

                pending: {

                    deposits:
                        pendingDeposits,

                    withdrawals:
                        pendingWithdrawals

                },

                recentActivity,

                system

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN OVERVIEW ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load the Admin Overview."
            });
        }
    }
);


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


            const effectiveStatus =
                await getEffectiveUserStatus(
                    user
                );


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
ADMIN — WITHDRAWALS

Withdrawal accounting:

User requests UGX 4,000
        ↓
Wallet immediately deducts UGX 4,000
        ↓
15% fee = UGX 600
        ↓
Net payout = UGX 3,400

APPROVE:
    Admin sends UGX 3,400
    Wallet is NOT deducted again.

REJECT:
    Full UGX 4,000 is returned to wallet.

Only pending withdrawals may be processed.
========================================================= */


/* =========================================================
ADMIN — GET PENDING WITHDRAWALS
========================================================= */

router.get(
    "/withdrawals",
    requireAdmin,
    async (req, res) => {

        try {

            const withdrawals =
                await Withdrawal.find({
                    status: "pending"
                })
                    .populate(
                        "user",
                        "fullName phone email status"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            const formattedWithdrawals =
                withdrawals.map(
                    withdrawal => {

                        const amount =
                            Number(
                                withdrawal.amount
                            ) || 0;


                        const fee =
                            Number(
                                withdrawal.fee
                            ) ||
                            (
                                amount * 0.15
                            );


                        const netAmount =
                            Number(
                                withdrawal.netAmount
                            ) ||
                            (
                                amount - fee
                            );


                        return {

                            _id:
                                withdrawal._id,

                            user:
                                withdrawal.user
                                    ? {
                                        _id:
                                            withdrawal.user._id,

                                        fullName:
                                            withdrawal.user.fullName,

                                        phone:
                                            withdrawal.user.phone,

                                        email:
                                            withdrawal.user.email,

                                        status:
                                            withdrawal.user.status
                                    }
                                    : null,

                            amount:
                                amount,

                            fee:
                                fee,

                            netAmount:
                                netAmount,

                            phoneNumber:
                                withdrawal.phoneNumber,

                            network:
                                withdrawal.network,

                            status:
                                withdrawal.status,

                            walletDeducted:
                                Boolean(
                                    withdrawal.walletDeducted
                                ),

                            walletDeductedAt:
                                withdrawal.walletDeductedAt,

                            transactionId:
                                withdrawal.transactionId,

                            createdAt:
                                withdrawal.createdAt,

                            processedAt:
                                withdrawal.processedAt,

                            processedBy:
                                withdrawal.processedBy,

                            rejectionReason:
                                withdrawal.rejectionReason,

                            payoutReference:
                                withdrawal.payoutReference

                        };

                    }
                );


            return res.status(200).json({

                success: true,

                withdrawals:
                    formattedWithdrawals

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN WITHDRAWALS FETCH ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load withdrawal requests."
            });
        }
    }
);


/* =========================================================
ADMIN — APPROVE WITHDRAWAL
========================================================= */

router.patch(
    "/withdrawals/:id/approve",
    requireAdmin,
    async (req, res) => {

        const session =
            await mongoose.startSession();


        try {

            const withdrawalId =
                String(
                    req.params.id || ""
                ).trim();


            if (
                !mongoose.Types.ObjectId.isValid(
                    withdrawalId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid withdrawal ID."
                });
            }


            let approvedWithdrawal = null;


            await session.withTransaction(
                async () => {

                    const withdrawal =
                        await Withdrawal.findById(
                            withdrawalId
                        )
                            .populate(
                                "user",
                                "fullName phone email status balance"
                            )
                            .session(
                                session
                            );


                    if (!withdrawal) {

                        const error =
                            new Error(
                                "Withdrawal request not found."
                            );

                        error.statusCode = 404;

                        throw error;
                    }


                    /* =====================================
                       ONLY PENDING CAN BE APPROVED
                    ===================================== */

                    if (
                        withdrawal.status !==
                        "pending"
                    ) {

                        const error =
                            new Error(
                                "This withdrawal has already been processed."
                            );

                        error.statusCode = 409;

                        throw error;
                    }


                    const user =
                        withdrawal.user;


                    if (!user) {

                        const error =
                            new Error(
                                "The user linked to this withdrawal could not be found."
                            );

                        error.statusCode = 404;

                        throw error;
                    }


                    /* =====================================
                       FROZEN USERS CANNOT BE PAID
                    ===================================== */

                    if (
                        user.status ===
                        "frozen"
                    ) {

                        const error =
                            new Error(
                                "This user's account is frozen. The withdrawal cannot be approved."
                            );

                        error.statusCode = 403;

                        throw error;
                    }


                    /* =====================================
                       WALLET MUST ALREADY HAVE BEEN DEDUCTED
                    ===================================== */

                    if (
                        withdrawal.walletDeducted !==
                        true
                    ) {

                        const error =
                            new Error(
                                "This withdrawal cannot be approved because its wallet deduction was not recorded."
                            );

                        error.statusCode = 409;

                        throw error;
                    }


                    const amount =
                        Number(
                            withdrawal.amount
                        ) || 0;


                    const fee =
                        Number(
                            withdrawal.fee
                        ) ||
                        (
                            amount * 0.15
                        );


                    const netAmount =
                        Number(
                            withdrawal.netAmount
                        ) ||
                        (
                            amount - fee
                        );


                    /* =====================================
                       FIND ORIGINAL WITHDRAWAL TRANSACTION
                    ===================================== */

                    let withdrawalTransaction =
                        null;


                    if (
                        withdrawal.transactionId
                    ) {

                        withdrawalTransaction =
                            await Transaction.findById(
                                withdrawal.transactionId
                            )
                                .session(
                                    session
                                );

                    }


                    if (
                        !withdrawalTransaction
                    ) {

                        withdrawalTransaction =
                            await Transaction.findOne({

                                user:
                                    user._id,

                                type:
                                    "withdrawal",

                                direction:
                                    "debit",

                                status:
                                    "pending",

                                relatedId:
                                    withdrawal._id

                            })
                                .sort({
                                    createdAt: -1
                                })
                                .session(
                                    session
                                );

                    }


                    if (
                        withdrawalTransaction
                    ) {

                        withdrawalTransaction.status =
                            "completed";

                        withdrawalTransaction.description =
                            `Withdrawal payout approved. UGX ${netAmount.toLocaleString("en-US")} sent after 15% withdrawal fee.`;

                        await withdrawalTransaction.save({
                            session
                        });

                    }


                    /* =====================================
                       APPROVAL DOES NOT TOUCH WALLET

                       The full requested amount was already
                       deducted when the user submitted the
                       withdrawal.
                    ===================================== */

                    withdrawal.status =
                        "completed";

                    withdrawal.processedAt =
                        new Date();

                    withdrawal.processedBy =
                        req.admin.username;

                    withdrawal.payoutReference =
                        String(
                            req.body.payoutReference ||
                            ""
                        ).trim() ||
                        null;


                    await withdrawal.save({
                        session
                    });


                    approvedWithdrawal =
                        withdrawal.toObject();

                }
            );


            return res.status(200).json({

                success: true,

                message:
                    "Withdrawal approved successfully. Send the net payout amount to the user's mobile money number.",

                withdrawal:
                    approvedWithdrawal

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN WITHDRAWAL APPROVAL ERROR:",
                error
            );


            return res.status(
                error.statusCode || 500
            ).json({

                success: false,

                message:
                    error.message ||
                    "FINORA could not approve the withdrawal."
            });

        } finally {

            await session.endSession();

        }
    }
);


/* =========================================================
ADMIN — REJECT WITHDRAWAL
========================================================= */

router.patch(
    "/withdrawals/:id/reject",
    requireAdmin,
    async (req, res) => {

        const session =
            await mongoose.startSession();


        try {

            const withdrawalId =
                String(
                    req.params.id || ""
                ).trim();


            if (
                !mongoose.Types.ObjectId.isValid(
                    withdrawalId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid withdrawal ID."
                });
            }


            let rejectedWithdrawal = null;
            let refundedAmount = 0;


            await session.withTransaction(
                async () => {

                    const withdrawal =
                        await Withdrawal.findById(
                            withdrawalId
                        )
                            .populate(
                                "user",
                                "fullName phone email status balance totalWithdrawal"
                            )
                            .session(
                                session
                            );


                    if (!withdrawal) {

                        const error =
                            new Error(
                                "Withdrawal request not found."
                            );

                        error.statusCode = 404;

                        throw error;
                    }


                    /* =====================================
                       ONLY PENDING CAN BE REJECTED
                    ===================================== */

                    if (
                        withdrawal.status !==
                        "pending"
                    ) {

                        const error =
                            new Error(
                                "This withdrawal has already been processed."
                            );

                        error.statusCode = 409;

                        throw error;
                    }


                    const user =
                        withdrawal.user;


                    if (!user) {

                        const error =
                            new Error(
                                "The user linked to this withdrawal could not be found."
                            );

                        error.statusCode = 404;

                        throw error;
                    }


                    const amount =
                        Number(
                            withdrawal.amount
                        ) || 0;


                    /* =====================================
                       REFUND FULL REQUESTED AMOUNT

                       Example:
                       Requested = 4,000
                       Refund = 4,000

                       NOT 3,400.
                    ===================================== */

                    if (
                        withdrawal.walletDeducted !==
                        true
                    ) {

                        const error =
                            new Error(
                                "This withdrawal cannot be rejected because its wallet deduction was not recorded."
                            );

                        error.statusCode = 409;

                        throw error;
                    }


                    user.balance =
                        (
                            Number(
                                user.balance
                            ) || 0
                        ) + amount;


                    /* =====================================
                       KEEP CACHED WITHDRAWAL TOTAL
                       CONSISTENT WITH THE REJECTED REQUEST
                    ===================================== */

                    user.totalWithdrawal =
                        Math.max(
                            0,
                            (
                                Number(
                                    user.totalWithdrawal
                                ) || 0
                            ) - amount
                        );


                    await user.save({
                        session
                    });


                    /* =====================================
                       FIND ORIGINAL WITHDRAWAL TRANSACTION
                    ===================================== */

                    let withdrawalTransaction =
                        null;


                    if (
                        withdrawal.transactionId
                    ) {

                        withdrawalTransaction =
                            await Transaction.findById(
                                withdrawal.transactionId
                            )
                                .session(
                                    session
                                );

                    }


                    if (
                        !withdrawalTransaction
                    ) {

                        withdrawalTransaction =
                            await Transaction.findOne({

                                user:
                                    user._id,

                                type:
                                    "withdrawal",

                                direction:
                                    "debit",

                                status:
                                    "pending",

                                relatedId:
                                    withdrawal._id

                            })
                                .sort({
                                    createdAt: -1
                                })
                                .session(
                                    session
                                );

                    }


                    if (
                        withdrawalTransaction
                    ) {

                        withdrawalTransaction.status =
                            "rejected";

                        withdrawalTransaction.description =
                            "Withdrawal rejected. Full deducted amount refunded to wallet.";

                        await withdrawalTransaction.save({
                            session
                        });

                    }


                    /* =====================================
                       CREATE REFUND TRANSACTION

                       This gives the wallet refund its own
                       clear financial record.
                    ===================================== */

                    await Transaction.create(
                        [
                            {

                                user:
                                    user._id,

                                type:
                                    "withdrawal",

                                amount:
                                    amount,

                                direction:
                                    "credit",

                                status:
                                    "completed",

                                description:
                                    "Withdrawal refund after admin rejection.",

                                reference:
                                    `WITHDRAWAL-REFUND-${withdrawal._id}`,

                                relatedId:
                                    withdrawal._id

                            }
                        ],
                        {
                            session
                        }
                    );


                    withdrawal.status =
                        "rejected";

                    withdrawal.processedAt =
                        new Date();

                    withdrawal.processedBy =
                        req.admin.username;

                    withdrawal.rejectionReason =
                        String(
                            req.body.rejectionReason ||
                            "Withdrawal rejected by Admin."
                        ).trim();


                    await withdrawal.save({
                        session
                    });


                    refundedAmount =
                        amount;


                    rejectedWithdrawal =
                        withdrawal.toObject();

                }
            );


            return res.status(200).json({

                success: true,

                message:
                    `Withdrawal rejected. ${refundedAmount.toLocaleString("en-US")} UGX has been returned to the user's wallet.`,

                withdrawal:
                    rejectedWithdrawal,

                refundedAmount:
                    refundedAmount

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN WITHDRAWAL REJECTION ERROR:",
                error
            );


            return res.status(
                error.statusCode || 500
            ).json({

                success: false,

                message:
                    error.message ||
                    "FINORA could not reject the withdrawal."
            });

        } finally {

            await session.endSession();

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
