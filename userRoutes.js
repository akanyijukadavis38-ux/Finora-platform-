const express = require("express");
const bcrypt = require("bcrypt");

const User = require("./user");

const router = express.Router();


/* =========================================================
   FRONTEND
========================================================= */

const FRONTEND_URL =
    "https://akanyijukadavis38-ux.github.io";
/* =========================================================
   REGISTER
========================================================= */

router.post("/register", async (req, res) => {

    try {

        const {
            fullName,
            phone,
            email,
            password,
            confirmPassword,
            referralCode
        } = req.body;


        /* =================================================
           BASIC VALIDATION
        ================================================= */

        if (
            !fullName ||
            !phone ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields."
            });

        }


        /* =================================================
           CLEAN VALUES
        ================================================= */

        const cleanName =
            String(fullName).trim();

        const cleanPhone =
            String(phone).trim();

        const cleanEmail =
            String(email)
                .trim()
                .toLowerCase();

        const cleanReferralCode =
            referralCode
                ? String(referralCode)
                    .trim()
                    .toUpperCase()
                : null;


        /* =================================================
           VALIDATION
        ================================================= */

        if (cleanName.length < 2) {

            return res.status(400).json({
                success: false,
                message: "Full name is too short."
            });

        }


        if (!/^07[0-9]{8}$/.test(cleanPhone)) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid Ugandan phone number."
            });

        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                cleanEmail
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters."
            });

        }


        if (password !== confirmPassword) {

            return res.status(400).json({
                success: false,
                message:
                    "Passwords do not match."
            });

        }


        /* =================================================
           REFERRER
        ================================================= */

        if (cleanReferralCode) {

            const referringUser =
                await User.findOne({
                    referralCode:
                        cleanReferralCode
                });

            if (!referringUser) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid referral code."
                });

            }

        }


        /* =================================================
           EXISTING EMAIL
        ================================================= */

        const existingEmail =
            await User.findOne({
                email: cleanEmail
            });

        if (existingEmail) {

            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists."
            });

        }


        /* =================================================
           EXISTING PHONE
        ================================================= */

        const existingPhone =
            await User.findOne({
                phone: cleanPhone
            });

        if (existingPhone) {

            return res.status(409).json({
                success: false,
                message:
                    "An account with this phone number already exists."
            });

        }


        /* =================================================
           HASH PASSWORD
        ================================================= */

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        /* =================================================
           CREATE USER
           
           user.js automatically generates the
           FINORA referralCode through its
           pre-validation hook.
        ================================================= */

        const user =
            new User({

                fullName:
                    cleanName,

                phone:
                    cleanPhone,

                email:
                    cleanEmail,

                password:
                    hashedPassword,

                referredByCode:
                    cleanReferralCode || null

            });


        await user.save();


        /* =================================================
           SESSION
        ================================================= */

        req.session.userId =
            user._id.toString();

        req.session.authenticated =
            true;


        await new Promise(
            (resolve, reject) => {

                req.session.save(
                    error => {

                        if (error) {
                            return reject(error);
                        }

                        resolve();

                    }
                );

            }
        );


        /* =================================================
           SUCCESS RESPONSE
        ================================================= */

        return res.status(201).json({

            success: true,

            message:
                "FINORA account created successfully.",

            user: {

                id:
                    user._id,

                fullName:
                    user.fullName,

                full_name:
                    user.fullName,

                phone:
                    user.phone,

                email:
                    user.email,

                referralCode:
                    user.referralCode,

                referral_code:
                    user.referralCode,

                referredByCode:
                    user.referredByCode || null,

                referred_by_code:
                    user.referredByCode || null,

                balance:
                    user.balance,

                walletBalance:
                    user.balance,

                wallet_balance:
                    user.balance,

                totalIncome:
                    user.totalIncome,

                totalEarnings:
                    user.totalIncome,

                total_earnings:
                    user.totalIncome,

                totalDeposit:
                    user.totalDeposit,

                totalInvested:
                    user.totalDeposit,

                total_invested:
                    user.totalDeposit,

                totalWithdrawal:
                    user.totalWithdrawal,

                status:
                    user.status,

                createdAt:
                    user.createdAt

            }

        });


    } catch (error) {

        console.error(
            "❌ FINORA REGISTER ERROR:",
            error
        );


        /* =================================================
           DUPLICATE DATABASE ENTRY
        ================================================= */

        if (
            error &&
            error.code === 11000
        ) {

            const duplicateFields =
                Object.keys(
                    error.keyPattern ||
                    error.keyValue ||
                    {}
                );


            if (
                duplicateFields.includes(
                    "email"
                )
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this email already exists."

                });

            }


            if (
                duplicateFields.includes(
                    "phone"
                )
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this phone number already exists."

                });

            }


            if (
                duplicateFields.includes(
                    "referralCode"
                )
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Please try creating the account again."

                });

            }

        }


        return res.status(500).json({

            success: false,

            message:
                "FINORA could not create your account."

        });

    }

});



/* =========================================================
   LOGIN
========================================================= */

router.post("/login", async (req, res) => {

    try {

        const {
            identifier,
            password
        } = req.body;


        if (!identifier || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter your email/phone and password."

            });

        }


        const cleanIdentifier =
            String(identifier)
                .trim()
                .toLowerCase();


        let user;


        if (cleanIdentifier.includes("@")) {

            user =
                await User.findOne({
                    email: cleanIdentifier
                });

        } else {

            user =
                await User.findOne({
                    phone:
                        String(identifier).trim()
                });

        }


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid login credentials."

            });

        }


        /* =================================================
           FROZEN ACCOUNT
        ================================================= */

        if (user.status === "frozen") {

            return res.status(403).json({

                success: false,

                message:
                    "Your FINORA account has been frozen."

            });

        }


        /* =================================================
           PASSWORD
        ================================================= */

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatches) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid login credentials."

            });

        }


        /* =================================================
           ENSURE REFERRAL CODE
        ================================================= */

        if (!user.referralCode) {

            await user.save();

        }


        /* =================================================
           SESSION
        ================================================= */

        req.session.userId =
            user._id.toString();

        req.session.authenticated =
            true;


        await new Promise(
            (resolve, reject) => {

                req.session.save(
                    error => {

                        if (error) {
                            return reject(error);
                        }

                        resolve();

                    }
                );

            }
        );


        /* =================================================
           RESPONSE
        ================================================= */

        return res.status(200).json({

            success: true,

            message:
                "FINORA login successful.",

            user: {

                id:
                    user._id,

                fullName:
                    user.fullName,

                full_name:
                    user.fullName,

                phone:
                    user.phone,

                email:
                    user.email,

                referralCode:
                    user.referralCode,

                referral_code:
                    user.referralCode,

                referredByCode:
                    user.referredByCode || null,

                referred_by_code:
                    user.referredByCode || null,

                balance:
                    user.balance,

                walletBalance:
                    user.balance,

                wallet_balance:
                    user.balance,

                totalIncome:
                    user.totalIncome,

                totalEarnings:
                    user.totalIncome,

                total_earnings:
                    user.totalIncome,

                totalDeposit:
                    user.totalDeposit,

                totalInvested:
                    user.totalDeposit,

                total_invested:
                    user.totalDeposit,

                totalWithdrawal:
                    user.totalWithdrawal,

                status:
                    user.status,

                createdAt:
                    user.createdAt

            }

        });


    } catch (error) {

        console.error(
            "❌ FINORA LOGIN ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "FINORA could not log you in."

        });

    }

});


/* =========================================================
   GET CURRENT USER
========================================================= */

router.get("/me", async (req, res) => {

    try {

        console.log(
            "🔐 FINORA /api/users/me SESSION:",
            req.session
        );


        if (
            !req.session ||
            !req.session.userId
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "No authenticated FINORA session."

            });

        }


        const user =
            await User.findById(
                req.session.userId
            ).select("-password");


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "FINORA user account could not be found."

            });

        }


        if (user.status === "frozen") {

            req.session.destroy(
                () => {}
            );

            return res.status(403).json({

                success: false,

                message:
                    "Your FINORA account has been frozen."

            });

        }


        if (!user.referralCode) {

            await user.save();

        }


        return res.status(200).json({

            success: true,

            user: {

                id:
                    user._id,

                fullName:
                    user.fullName,

                full_name:
                    user.fullName,

                phone:
                    user.phone,

                email:
                    user.email,

                referralCode:
                    user.referralCode,

                referral_code:
                    user.referralCode,

                referredByCode:
                    user.referredByCode || null,

                referred_by_code:
                    user.referredByCode || null,

                referralLink:
                    `${FRONTEND_URL}/?ref=${encodeURIComponent(
                        user.referralCode
                    )}`,

                balance:
                    user.balance,

                walletBalance:
                    user.balance,

                wallet_balance:
                    user.balance,

                totalIncome:
                    user.totalIncome,

                totalEarnings:
                    user.totalIncome,

                total_earnings:
                    user.totalIncome,

                totalDeposit:
                    user.totalDeposit,

                totalInvested:
                    user.totalDeposit,

                total_invested:
                    user.totalDeposit,

                totalWithdrawal:
                    user.totalWithdrawal,

                referralIncome:
                    0,

                referral_income:
                    0,

                activeInvestments:
                    0,

                active_investments:
                    0,

                todayEarnings:
                    0,

                today_earnings:
                    0,

                dailyIncome:
                    0,

                daily_income:
                    0,

                status:
                    user.status,

                createdAt:
                    user.createdAt

            }

        });


    } catch (error) {

        console.error(
            "❌ FINORA /api/users/me ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "FINORA could not load your account."

        });

    }

});

/* =========================================================
   GET REAL TEAM
========================================================= */

router.get("/team", async (req, res) => {

    try {

        /* =================================================
           AUTHENTICATION
        ================================================= */

        if (
            !req.session ||
            !req.session.userId
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "No authenticated FINORA session."

            });

        }


        /* =================================================
           CURRENT USER
        ================================================= */

        const currentUser =
            await User.findById(
                req.session.userId
            ).select(
                "_id fullName referralCode status createdAt"
            );


        if (!currentUser) {

            return res.status(401).json({

                success: false,

                message:
                    "FINORA user account could not be found."

            });

        }


        if (currentUser.status === "frozen") {

            req.session.destroy(
                () => {}
            );

            return res.status(403).json({

                success: false,

                message:
                    "Your FINORA account has been frozen."

            });

        }


        /* =================================================
           LEVEL 1

           Users directly referred by current user.
        ================================================= */

        const levelOneUsers =
            currentUser.referralCode
                ? await User.find({
                    referredByCode:
                        currentUser.referralCode
                })
                    .select(
                        "_id fullName phone referralCode referredByCode totalDeposit status createdAt"
                    )
                    .sort({
                        createdAt: -1
                    })
                : [];


        /* =================================================
           LEVEL 2

           Users referred by Level 1 users.
        ================================================= */

        const levelOneCodes =
            levelOneUsers
                .map(
                    user =>
                        user.referralCode
                )
                .filter(Boolean);


        const levelTwoUsers =
            levelOneCodes.length > 0
                ? await User.find({
                    referredByCode: {
                        $in:
                            levelOneCodes
                    }
                })
                    .select(
                        "_id fullName phone referralCode referredByCode totalDeposit status createdAt"
                    )
                    .sort({
                        createdAt: -1
                    })
                : [];


        /* =================================================
           LEVEL 3

           Users referred by Level 2 users.
        ================================================= */

        const levelTwoCodes =
            levelTwoUsers
                .map(
                    user =>
                        user.referralCode
                )
                .filter(Boolean);


        const levelThreeUsers =
            levelTwoCodes.length > 0
                ? await User.find({
                    referredByCode: {
                        $in:
                            levelTwoCodes
                    }
                })
                    .select(
                        "_id fullName phone referralCode referredByCode totalDeposit status createdAt"
                    )
                    .sort({
                        createdAt: -1
                    })
                : [];


        /* =================================================
           FORMAT MEMBERS
        ================================================= */

        const formatMember =
            (user, level) => {

                const totalDeposit =
                    Number(
                        user.totalDeposit
                    ) || 0;


                /*
                 * FINORA TEAM STATUS
                 *
                 * Active:
                 * Member has made their first deposit.
                 *
                 * Inactive:
                 * Member has never made a deposit.
                 *
                 * We intentionally do NOT use
                 * user.status for this.
                 */

                const depositStatus =
                    totalDeposit > 0
                        ? "Active"
                        : "Inactive";


                return {

                    id:
                        user._id,

                    fullName:
                        user.fullName,

                    full_name:
                        user.fullName,

                    phone:
                        user.phone || "",

                    referralCode:
                        user.referralCode,

                    referral_code:
                        user.referralCode,

                    referredByCode:
                        user.referredByCode || null,

                    referred_by_code:
                        user.referredByCode || null,

                    /*
                     * Deposit amount is sent so the
                     * frontend can correctly determine
                     * Active / Inactive as well.
                     */
                    totalDeposit:
                        totalDeposit,

                    total_deposit:
                        totalDeposit,

                    /*
                     * This is TEAM activity status,
                     * based on first deposit.
                     */
                    status:
                        depositStatus,

                    level,

                    createdAt:
                        user.createdAt

                };

            };


        /* =================================================
           BUILD COMPLETE TEAM
        ================================================= */

        const members = [

            ...levelOneUsers.map(
                user =>
                    formatMember(
                        user,
                        1
                    )
            ),

            ...levelTwoUsers.map(
                user =>
                    formatMember(
                        user,
                        2
                    )
            ),

            ...levelThreeUsers.map(
                user =>
                    formatMember(
                        user,
                        3
                    )
            )

        ];


        /* =================================================
           RESPONSE
        ================================================= */

        return res.status(200).json({

            success: true,

            team:
                members,

            members:
                members,

            summary: {

                total:
                    members.length,

                levelOne:
                    levelOneUsers.length,

                levelTwo:
                    levelTwoUsers.length,

                levelThree:
                    levelThreeUsers.length

            },

            commissionRates: {

                levelOne:
                    15,

                levelTwo:
                    5,

                levelThree:
                    2

            }

        });


    } catch (error) {

        console.error(
            "❌ FINORA /api/users/team ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "FINORA could not load your team."

        });

    }

});
/* =========================================================
   CHANGE PASSWORD
========================================================= */

router.post("/change-password", async (req, res) => {

    try {

        /* =================================================
           AUTHENTICATION
        ================================================= */

        if (
            !req.session ||
            !req.session.userId
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "You must be logged in to change your password."

            });

        }


        /* =================================================
           GET USER
        ================================================= */

        const user =
            await User.findById(
                req.session.userId
            );


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "FINORA user account could not be found."

            });

        }


        /* =================================================
           FROZEN ACCOUNT
        ================================================= */

        if (user.status === "frozen") {

            req.session.destroy(
                () => {}
            );

            return res.status(403).json({

                success: false,

                message:
                    "Your FINORA account has been frozen."

            });

        }


        /* =================================================
           GET PASSWORDS
        ================================================= */

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;


        /* =================================================
           REQUIRED FIELDS
        ================================================= */

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill in all password fields."

            });

        }


        /* =================================================
           PASSWORD LENGTH
        ================================================= */

        if (
            String(newPassword).length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 6 characters."

            });

        }


        /* =================================================
           CONFIRM PASSWORD
        ================================================= */

        if (
            newPassword !==
            confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New passwords do not match."

            });

        }


        /* =================================================
           VERIFY CURRENT PASSWORD
        ================================================= */

        const passwordMatches =
            await bcrypt.compare(
                currentPassword,
                user.password
            );


        if (!passwordMatches) {

            return res.status(401).json({

                success: false,

                message:
                    "Current password is incorrect."

            });

        }


        /* =================================================
           PREVENT SAME PASSWORD
        ================================================= */

        const samePassword =
            await bcrypt.compare(
                newPassword,
                user.password
            );


        if (samePassword) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be different from your current password."

            });

        }


        /* =================================================
           HASH NEW PASSWORD
        ================================================= */

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                12
            );


        /* =================================================
           UPDATE PASSWORD
        ================================================= */

        user.password =
            hashedPassword;


        await user.save();


        /* =================================================
           SUCCESS
        ================================================= */

        return res.status(200).json({

            success: true,

            message:
                "FINORA password changed successfully."

        });


    } catch (error) {

        console.error(
            "❌ FINORA CHANGE PASSWORD ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "FINORA could not change your password right now."

        });

    }

});
/* =========================================================
   FORGOT PASSWORD — REQUEST RESET
========================================================= */

const crypto = require("crypto");

router.post("/forgot-password", async (req, res) => {

    try {

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();


        if (!email) {

            return res.status(400).json({
                success: false,
                message: "Please enter your registered email address."
            });

        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });

        }


        const user =
            await User.findOne({
                email
            });


        /*
         * Do not reveal whether an email exists.
         * This prevents account enumeration.
         */

        if (!user) {

            return res.status(200).json({
                success: true,
                message:
                    "If an account exists with that email, a password reset link has been sent."
            });

        }


        if (user.status === "frozen") {

            return res.status(403).json({
                success: false,
                message:
                    "Your FINORA account has been frozen."
            });

        }


        /*
         * Generate a secure random reset token.
         */

        const resetToken =
            crypto.randomBytes(32).toString("hex");


        /*
         * Store only the HASHED token in MongoDB.
         */

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");


        /*
         * Reset link expires after 15 minutes.
         */

        const resetExpires =
            new Date(
                Date.now() + 15 * 60 * 1000
            );


        user.resetPasswordToken =
            hashedToken;

        user.resetPasswordExpires =
            resetExpires;


        await user.save();


        /*
         * Frontend reset page.
         */

        const resetLink =
            `${FRONTEND_URL}/forgot-password.html?token=${encodeURIComponent(
                resetToken
            )}`;


        /*
         * Resend email configuration.
         *
         * These values will come from Railway
         * environment variables.
         */

        const resendApiKey =
            process.env.RESEND_API_KEY;

        const resendFromEmail =
            process.env.RESEND_FROM_EMAIL;


        if (
            !resendApiKey ||
            !resendFromEmail
        ) {

            console.error(
                "❌ FINORA PASSWORD RESET: Resend environment variables are missing."
            );

            /*
             * Do not leave a usable reset token
             * in the database if email cannot be sent.
             */

            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;

            await user.save();

            return res.status(500).json({
                success: false,
                message:
                    "FINORA could not send the password reset email right now."
            });

        }


        /*
         * SEND RESET EMAIL THROUGH RESEND
         */

        const emailResponse =
            await fetch(
                "https://api.resend.com/emails",
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${resendApiKey}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            from:
                                resendFromEmail,

                            to: [
                                user.email
                            ],

                            subject:
                                "FINORA Password Reset",

                            html: `
                                <div style="
                                    background:#07050A;
                                    padding:40px 20px;
                                    font-family:Arial,sans-serif;
                                    color:#ffffff;
                                ">

                                    <div style="
                                        max-width:520px;
                                        margin:auto;
                                        background:#100C13;
                                        border:1px solid rgba(209,0,255,.22);
                                        border-radius:14px;
                                        padding:30px;
                                    ">

                                        <div style="
                                            text-align:center;
                                            font-size:34px;
                                            font-weight:700;
                                            letter-spacing:-2px;
                                        ">
                                            <span style="color:#ffffff;">
                                                FIN
                                            </span>
                                            <span style="color:#E7B84B;">
                                                ORA
                                            </span>
                                        </div>

                                        <div style="
                                            text-align:center;
                                            color:#D100FF;
                                            font-size:9px;
                                            font-weight:700;
                                            letter-spacing:2px;
                                            margin-top:6px;
                                        ">
                                            INVEST • GROW • EARN
                                        </div>

                                        <h2 style="
                                            margin-top:30px;
                                            color:#ffffff;
                                        ">
                                            Reset Your Password
                                        </h2>

                                        <p style="
                                            color:#B7AEBB;
                                            line-height:1.7;
                                        ">
                                            We received a request to reset
                                            your FINORA account password.
                                        </p>

                                        <p style="
                                            color:#B7AEBB;
                                            line-height:1.7;
                                        ">
                                            Click the button below to create
                                            your new password.
                                        </p>

                                        <div style="
                                            text-align:center;
                                            margin:30px 0;
                                        ">

                                            <a
                                                href="${resetLink}"
                                                style="
                                                    display:inline-block;
                                                    background:#D100FF;
                                                    color:#ffffff;
                                                    text-decoration:none;
                                                    padding:14px 24px;
                                                    border-radius:8px;
                                                    font-weight:700;
                                                "
                                            >
                                                RESET PASSWORD
                                            </a>

                                        </div>

                                        <p style="
                                            color:#8E8791;
                                            font-size:12px;
                                            line-height:1.6;
                                        ">
                                            This password reset link expires
                                            in 15 minutes.
                                        </p>

                                        <p style="
                                            color:#8E8791;
                                            font-size:12px;
                                            line-height:1.6;
                                        ">
                                            If you did not request a password
                                            reset, you can safely ignore this
                                            email.
                                        </p>

                                    </div>

                                </div>
                            `
                        })
                }
            );


        if (!emailResponse.ok) {

            const resendError =
                await emailResponse.text();

            console.error(
                "❌ FINORA RESEND ERROR:",
                resendError
            );


            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;

            await user.save();


            return res.status(500).json({
                success: false,
                message:
                    "FINORA could not send the password reset email."
            });

        }


        return res.status(200).json({
            success: true,
            message:
                "If an account exists with that email, a password reset link has been sent."
        });


    } catch (error) {

        console.error(
            "❌ FINORA FORGOT PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "FINORA could not process your password reset request."
        });

    }

});


/* =========================================================
   RESET PASSWORD
========================================================= */

router.post("/reset-password", async (req, res) => {

    try {

        const {
            token,
            newPassword,
            confirmPassword
        } = req.body;


        if (
            !token ||
            !newPassword ||
            !confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please fill in all password fields."
            });

        }


        if (
            String(newPassword).length < 6
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 6 characters."
            });

        }


        if (
            newPassword !== confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "New passwords do not match."
            });

        }


        /*
         * Hash the token received from the
         * frontend and compare it with the
         * token stored in MongoDB.
         */

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(String(token))
                .digest("hex");


        const user =
            await User.findOne({
                resetPasswordToken:
                    hashedToken,

                resetPasswordExpires: {
                    $gt: new Date()
                }
            });


        if (!user) {

            return res.status(400).json({
                success: false,
                message:
                    "This password reset link is invalid or has expired."
            });

        }


        if (user.status === "frozen") {

            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;

            await user.save();

            return res.status(403).json({
                success: false,
                message:
                    "Your FINORA account has been frozen."
            });

        }


        /*
         * Prevent using the current password again.
         */

        const samePassword =
            await bcrypt.compare(
                newPassword,
                user.password
            );


        if (samePassword) {

            return res.status(400).json({
                success: false,
                message:
                    "New password must be different from your current password."
            });

        }


        /*
         * Hash the new permanent password.
         */

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                12
            );


        user.password =
            hashedPassword;


        /*
         * Reset token can never be reused.
         */

        user.resetPasswordToken = null;

        user.resetPasswordExpires = null;


        await user.save();


        return res.status(200).json({
            success: true,
            message:
                "FINORA password has been reset successfully."
        });


    } catch (error) {

        console.error(
            "❌ FINORA RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "FINORA could not reset your password right now."
        });

    }

});
/* =========================================================
   LOGOUT
========================================================= */

router.post("/logout", (req, res) => {

    req.session.destroy(
        error => {

            if (error) {

                console.error(
                    "❌ FINORA LOGOUT ERROR:",
                    error
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "FINORA could not log you out."

                });

            }


            res.clearCookie(
                "finora.sid",
                {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/"
                }
            );


            return res.status(200).json({

                success: true,

                message:
                    "FINORA logout successful."

            });

        }
    );

});


/* =========================================================
   EXPORT
========================================================= */

module.exports =
    router;
