const express = require("express");
const bcrypt = require("bcrypt");

const User = require("./user");

const router = express.Router();


/* =========================================================
   FINORA FRONTEND
========================================================= */

const FRONTEND_URL =
    "https://finora-platform.vercel.app";


/* =========================================================
   REGISTER USER
   POST /api/users/register
========================================================= */

router.post(
    "/register",
    async (req, res) => {

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

                    success:
                        false,

                    message:
                        "All required fields must be provided."
                });
            }


            /* =================================================
               FULL NAME
            ================================================= */

            const cleanName =
                String(fullName).trim();


            if (
                cleanName.length < 2
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Please enter your full name."
                });
            }


            /* =================================================
               UGANDA PHONE
            ================================================= */

            const cleanPhone =
                String(phone).trim();


            if (
                !/^07[0-9]{8}$/.test(
                    cleanPhone
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Enter a valid Uganda phone number, e.g. 0701234567."
                });
            }


            /* =================================================
               EMAIL
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

                    success:
                        false,

                    message:
                        "Please enter a valid email address."
                });
            }


            /* =================================================
               PASSWORD
            ================================================= */

            const cleanPassword =
                String(password);


            if (
                cleanPassword.length < 6
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Password must contain at least 6 characters."
                });
            }


            /* =================================================
               CONFIRM PASSWORD
            ================================================= */

            if (
                cleanPassword !==
                String(confirmPassword)
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Passwords do not match."
                });
            }


            /* =================================================
               CHECK EMAIL
            ================================================= */

            const existingEmail =
                await User.findOne({

                    email:
                        cleanEmail
                });


            if (
                existingEmail
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "An account with this email already exists."
                });
            }


            /* =================================================
               CHECK PHONE
            ================================================= */

            const existingPhone =
                await User.findOne({

                    phone:
                        cleanPhone
                });


            if (
                existingPhone
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "An account with this phone number already exists."
                });
            }


            /* =================================================
               REFERRAL CODE

               IMPORTANT:

               This is the CODE OF THE PERSON WHO REFERRED
               THE NEW USER.

               It is NOT the new user's own referral code.
            ================================================= */

            let cleanReferredByCode =
                null;


            if (
                referralCode &&
                String(referralCode).trim()
            ) {

                cleanReferredByCode =
                    String(
                        referralCode
                    )
                        .trim()
                        .toUpperCase();


                /*
                   Check whether the referral code actually
                   belongs to an existing FINORA user.
                */

                const referringUser =
                    await User.findOne({

                        referralCode:
                            cleanReferredByCode
                    });


                if (
                    !referringUser
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        message:
                            "The referral link or referral code is invalid."
                    });
                }
            }


            /* =================================================
               HASH PASSWORD
            ================================================= */

            const hashedPassword =
                await bcrypt.hash(
                    cleanPassword,
                    12
                );


            /* =================================================
               CREATE USER
            ================================================= */

            /*
               DO NOT manually set referralCode here.

               The User model automatically generates the
               new user's OWN referralCode.

               We only save referredByCode when applicable.
            */

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

                    referredByCode:
                        cleanReferredByCode
                });


            /* =================================================
               AUTOMATIC LOGIN AFTER REGISTRATION
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

                    if (
                        sessionError
                    ) {

                        console.error(
                            "❌ FINORA REGISTRATION SESSION ERROR:",
                            sessionError
                        );


                        return res.status(500).json({

                            success:
                                false,

                            message:
                                "Account was created, but FINORA could not create your login session."
                        });
                    }


                    /* =============================================
                       REGISTRATION SUCCESS
                    ============================================= */

                    return res.status(201).json({

                        success:
                            true,

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

                            /*
                               THIS is the new user's own code.
                            */

                            referralCode:
                                user.referralCode,

                            referral_code:
                                user.referralCode,

                            /*
                               THIS is the referrer's code.
                            */

                            referredByCode:
                                user.referredByCode,

                            referred_by_code:
                                user.referredByCode,

                            balance:
                                user.balance,

                            walletBalance:
                                user.balance,

                            totalIncome:
                                user.totalIncome,

                            totalEarnings:
                                user.totalIncome,

                            totalDeposit:
                                user.totalDeposit,

                            totalInvested:
                                user.totalDeposit,

                            totalWithdrawal:
                                user.totalWithdrawal,

                            status:
                                user.status,

                            createdAt:
                                user.createdAt,

                            referralLink:
                                `${FRONTEND_URL}/?ref=${encodeURIComponent(
                                    user.referralCode
                                )}`
                        }
                    });
                }
            );

        } catch (error) {

            console.error(
                "❌ FINORA REGISTRATION ERROR:",
                error
            );


            if (
                error.code === 11000
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "An account with those details already exists."
                });
            }


            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not create the account. Please try again."
            });
        }
    }
);


/* =========================================================
   LOGIN USER
   POST /api/users/login
========================================================= */

router.post(
    "/login",
    async (req, res) => {

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

                    success:
                        false,

                    message:
                        "Phone/email and password are required."
                });
            }


            const identifierValue =
                String(
                    identifier
                ).trim();


            const passwordValue =
                String(password);


            /* =================================================
               FIND USER

               LOGIN USES PHONE OR EMAIL.

               NOT USERNAME.
            ================================================= */

            const user =
                await User.findOne({

                    $or: [

                        {
                            email:
                                identifierValue
                                    .toLowerCase()
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

            if (
                !user
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Invalid login details."
                });
            }


            /* =================================================
               ACCOUNT STATUS
            ================================================= */

            if (
                user.status ===
                "frozen"
            ) {

                return res.status(403).json({

                    success:
                        false,

                    message:
                        "Your FINORA account has been frozen."
                });
            }


            /* =================================================
               PASSWORD
            ================================================= */

            const passwordMatches =
                await bcrypt.compare(
                    passwordValue,
                    user.password
                );


            if (
                !passwordMatches
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Invalid login details."
                });
            }


            /* =================================================
               MAKE SURE USER HAS OWN REFERRAL CODE
            ================================================= */

            if (
                !user.referralCode
            ) {

                await user.save();
            }


            /* =================================================
               CREATE SESSION
            ================================================= */

            req.session.userId =
                user._id.toString();


            req.session.authenticated =
                true;


            /* =================================================
               SAVE SESSION BEFORE RESPONSE
            ================================================= */

            req.session.save(
                (sessionError) => {

                    if (
                        sessionError
                    ) {

                        console.error(
                            "❌ FINORA SESSION SAVE ERROR:",
                            sessionError
                        );


                        return res.status(500).json({

                            success:
                                false,

                            message:
                                "Login succeeded, but FINORA could not create your session."
                        });
                    }


                    /* =============================================
                       LOGIN SUCCESS
                    ============================================= */

                    return res.status(200).json({

                        success:
                            true,

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
                                user.createdAt,

                            referralLink:
                                `${FRONTEND_URL}/?ref=${encodeURIComponent(
                                    user.referralCode
                                )}`
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

                success:
                    false,

                message:
                    "FINORA could not process your login. Please try again."
            });
        }
    }
);


/* =========================================================
   GET CURRENT AUTHENTICATED USER
   GET /api/users/me
========================================================= */

router.get(
    "/me",
    async (req, res) => {

        try {

            console.log(
                "FINORA /api/users/me SESSION:",
                req.session
                    ? {
                        userId:
                            req.session.userId,

                        authenticated:
                            req.session.authenticated
                    }
                    : "NO SESSION"
            );


            /* =================================================
               CHECK SESSION
            ================================================= */

            if (
                !req.session ||
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "No authenticated FINORA session."
                });
            }


            /* =================================================
               FIND USER
            ================================================= */

            const user =
                await User.findById(
                    req.session.userId
                ).select("-password");


            if (
                !user
            ) {

                req.session.destroy(
                    () => {}
                );


                return res.status(401).json({

                    success:
                        false,

                    message:
                        "FINORA user account could not be found."
                });
            }


            /* =================================================
               FROZEN ACCOUNT
            ================================================= */

            if (
                user.status ===
                "frozen"
            ) {

                req.session.destroy(
                    () => {}
                );


                return res.status(403).json({

                    success:
                        false,

                    message:
                        "Your FINORA account has been frozen."
                });
            }


            /* =================================================
               ENSURE OWN REFERRAL CODE EXISTS
            ================================================= */

            if (
                !user.referralCode
            ) {

                await user.save();
            }


            /* =================================================
               DASHBOARD RESPONSE
            ================================================= */

            return res.status(200).json({

                success:
                    true,

                user: {

                    id:
                        user._id,

                    /*
                       FULL NAME — NOT USERNAME
                    */

                    fullName:
                        user.fullName,

                    full_name:
                        user.fullName,

                    phone:
                        user.phone,

                    email:
                        user.email,


                    /*
                       USER'S OWN REFERRAL CODE
                    */

                    referralCode:
                        user.referralCode,

                    referral_code:
                        user.referralCode,


                    /*
                       PERSON WHO REFERRED USER
                    */

                    referredByCode:
                        user.referredByCode || null,

                    referred_by_code:
                        user.referredByCode || null,


                    /*
                       REFERRAL LINK
                    */

                    referralLink:
                        `${FRONTEND_URL}/?ref=${encodeURIComponent(
                            user.referralCode
                        )}`,


                    /*
                       WALLET
                    */

                    balance:
                        user.balance,

                    walletBalance:
                        user.balance,

                    wallet_balance:
                        user.balance,


                    /*
                       EARNINGS
                    */

                    totalIncome:
                        user.totalIncome,

                    totalEarnings:
                        user.totalIncome,

                    total_earnings:
                        user.totalIncome,


                    /*
                       INVESTMENT
                    */

                    totalDeposit:
                        user.totalDeposit,

                    totalInvested:
                        user.totalDeposit,

                    total_invested:
                        user.totalDeposit,


                    /*
                       WITHDRAWAL
                    */

                    totalWithdrawal:
                        user.totalWithdrawal,


                    /*
                       DASHBOARD VALUES
                    */

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

                success:
                    false,

                message:
                    "FINORA could not load your account."
            });
        }
    }
);


/* =========================================================
   LOGOUT
   POST /api/users/logout
========================================================= */

router.post(
    "/logout",
    (req, res) => {

        if (
            !req.session
        ) {

            return res.status(200).json({

                success:
                    true,

                message:
                    "FINORA logout successful."
            });
        }


        req.session.destroy(
            (error) => {

                if (
                    error
                ) {

                    console.error(
                        "❌ FINORA LOGOUT ERROR:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,

                        message:
                            "FINORA could not complete logout."
                    });
                }


                /*
                   Clear the same cookie configuration
                   used by the production session.
                */

                res.clearCookie(
                    "finora.sid",
                    {
                        httpOnly:
                            true,

                        secure:
                            true,

                        sameSite:
                            "none",

                        path:
                            "/"
                    }
                );


                return res.status(200).json({

                    success:
                        true,

                    message:
                        "FINORA logout successful."
                });
            }
        );
    }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports =
    router;
