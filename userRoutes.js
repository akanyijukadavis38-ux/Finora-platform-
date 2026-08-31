const express = require("express");
const bcrypt = require("bcrypt");

const User = require("./user");

const router = express.Router();


/* =====================================================
   REGISTER USER
   POST /api/users/register
===================================================== */

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

                message:
                    "All required fields must be provided."
            });
        }


        /* =================================================
           NAME VALIDATION
        ================================================= */

        const cleanName =
            String(fullName).trim();


        if (cleanName.length < 2) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter your full name."
            });
        }


        /* =================================================
           PHONE VALIDATION
        ================================================= */

        const cleanPhone =
            String(phone).trim();


        if (
            !/^07[0-9]{8}$/.test(
                cleanPhone
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Enter a valid Uganda phone number, e.g. 0701234567."
            });
        }


        /* =================================================
           EMAIL VALIDATION
        ================================================= */

        const cleanEmail =
            String(email)
                .trim()
                .toLowerCase();


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


        /* =================================================
           PASSWORD VALIDATION
        ================================================= */

        if (
            String(password).length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 6 characters."
            });
        }


        /* =================================================
           CONFIRM PASSWORD
        ================================================= */

        if (
            password !== confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Passwords do not match."
            });
        }


        /* =================================================
           CHECK EXISTING EMAIL
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
           CHECK EXISTING PHONE
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
           REFERRAL CODE
        ================================================= */

        const cleanReferralCode =
            referralCode &&
            String(referralCode).trim()
                ? String(referralCode).trim()
                : null;


        /* =================================================
           CREATE USER
        ================================================= */

        const user =
            await User.create({

                fullName:
                    cleanName,

                phone:
                    cleanPhone,

                email:
                    cleanEmail,

                password:
                    hashedPassword,

                referralCode:
                    cleanReferralCode
            });


        /* =================================================
           SUCCESS
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

                phone:
                    user.phone,

                email:
                    user.email,

                referralCode:
                    user.referralCode,

                balance:
                    user.balance,

                totalIncome:
                    user.totalIncome,

                totalDeposit:
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
            "❌ FINORA REGISTRATION ERROR:",
            error
        );


        if (
            error.code === 11000
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "An account with those details already exists."
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "FINORA could not create the account. Please try again."
        });
    }
});
/* =====================================================
   LOGIN USER
   POST /api/users/login
===================================================== */

router.post("/login", async (req, res) => {

    try {

        const {
            identifier,
            password
        } = req.body;


        /* =================================================
           BASIC VALIDATION
        ================================================= */

        if (
            !identifier ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone/email and password are required."
            });
        }


        /* =================================================
           CLEAN LOGIN DETAILS
        ================================================= */

        const identifierValue =
            String(identifier).trim();


        const passwordValue =
            String(password);


        /* =================================================
           FIND USER BY EMAIL OR PHONE
        ================================================= */

        const user =
            await User.findOne({

                $or: [

                    {
                        email:
                            identifierValue.toLowerCase()
                    },

                    {
                        phone:
                            identifierValue
                    }

                ]

            });


        /* =================================================
           USER NOT FOUND
        ================================================= */

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid login details."
            });
        }


        /* =================================================
           CHECK ACCOUNT STATUS
        ================================================= */

        if (
            user.status === "frozen"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your FINORA account has been frozen."
            });
        }


        /* =================================================
           CHECK PASSWORD
        ================================================= */

        const passwordMatches =
            await bcrypt.compare(
                passwordValue,
                user.password
            );


        if (!passwordMatches) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid login details."
            });
        }


        /* =================================================
           CREATE FINORA SESSION
        ================================================= */

        req.session.userId =
            user._id.toString();


        req.session.authenticated =
            true;


        /* =================================================
           SAVE SESSION
        ================================================= */

        req.session.save(
            (sessionError) => {

                if (sessionError) {

                    console.error(
                        "❌ FINORA SESSION SAVE ERROR:",
                        sessionError
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Login succeeded, but FINORA could not create your session."
                    });
                }


                /* =================================================
                   LOGIN SUCCESS
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

                        phone:
                            user.phone,

                        email:
                            user.email,

                        referralCode:
                            user.referralCode,

                        balance:
                            user.balance,

                        totalIncome:
                            user.totalIncome,

                        totalDeposit:
                            user.totalDeposit,

                        totalWithdrawal:
                            user.totalWithdrawal,

                        status:
                            user.status,

                        createdAt:
                            user.createdAt
                    }
                });
            }
        );

    } catch (error) {

        console.error(
            "❌ FINORA LOGIN ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "FINORA could not process your login. Please try again."
        });
    }
});

/* =====================================================
   GET CURRENT AUTHENTICATED USER
   GET /api/users/me
===================================================== */

router.get("/me", async (req, res) => {

    try {

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

            req.session.destroy(
                () => {}
            );


            return res.status(401).json({

                success: false,

                message:
                    "FINORA user account could not be found."
            });
        }


        if (
            user.status === "frozen"
        ) {

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
           DASHBOARD-COMPATIBLE RESPONSE
        ================================================= */

        return res.status(200).json({

            success: true,

            user: {

                id:
                    user._id,

                /* Original model fields */

                fullName:
                    user.fullName,

                phone:
                    user.phone,

                email:
                    user.email,

                referralCode:
                    user.referralCode,

                balance:
                    user.balance,

                totalIncome:
                    user.totalIncome,

                totalDeposit:
                    user.totalDeposit,

                totalWithdrawal:
                    user.totalWithdrawal,

                status:
                    user.status,

                createdAt:
                    user.createdAt,


                /* Dashboard aliases */

                full_name:
                    user.fullName,

                walletBalance:
                    user.balance,

                wallet_balance:
                    user.balance,

                totalEarnings:
                    user.totalIncome,

                total_earnings:
                    user.totalIncome,

                totalInvested:
                    user.totalDeposit,

                total_invested:
                    user.totalDeposit,

                referralCode:
                    user.referralCode,

                referral_code:
                    user.referralCode,

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
                    0
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


/* =====================================================
   LOGOUT
   POST /api/users/logout
===================================================== */

router.post("/logout", (req, res) => {

    if (!req.session) {

        return res.status(200).json({

            success: true,

            message:
                "FINORA logout successful."
        });
    }


    req.session.destroy(
        (error) => {

            if (error) {

                console.error(
                    "❌ FINORA LOGOUT ERROR:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    message:
                        "FINORA could not complete logout."
                });
            }


            res.clearCookie(
                "finora.sid"
            );


            return res.status(200).json({

                success: true,

                message:
                    "FINORA logout successful."
            });
        }
    );
});


module.exports = router;
