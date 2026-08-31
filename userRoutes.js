const express = require("express");
const bcrypt = require("bcrypt");

const User = require("./user");

const router = express.Router();


/* =====================================================
   GENERATE UNIQUE FINORA REFERRAL CODE
===================================================== */

async function generateReferralCode() {

    let code;
    let exists = true;

    while (exists) {

        const randomPart =
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        code =
            "FIN" + randomPart;

        const existingUser =
            await User.findOne({
                referralCode: code
            });

        exists = !!existingUser;
    }

    return code;
}


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
           NAME
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
           PHONE
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

                success: false,

                message:
                    "Please enter a valid email address."
            });
        }


        /* =================================================
           PASSWORD
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
           CHECK EMAIL
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
           CHECK PHONE
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
           REFERRER
           
           This is the code belonging to the person
           who referred the new user.
        ================================================= */

        let referredBy = null;


        const suppliedReferralCode =
            referralCode &&
            String(referralCode).trim()
                ? String(referralCode).trim().toUpperCase()
                : null;


        if (suppliedReferralCode) {

            const referringUser =
                await User.findOne({

                    referralCode:
                        suppliedReferralCode
                });


            if (!referringUser) {

                return res.status(400).json({

                    success: false,

                    message:
                        "The referral link or referral code is invalid."
                });
            }


            referredBy =
                referringUser.referralCode;
        }


        /* =================================================
           GENERATE THIS USER'S OWN REFERRAL CODE
           
           EVERY USER GETS ONE.
           
           It does NOT matter whether they were referred
           by someone else.
        ================================================= */

        const ownReferralCode =
            await generateReferralCode();


        /* =================================================
           HASH PASSWORD
        ================================================= */

        const hashedPassword =
            await bcrypt.hash(
                String(password),
                12
            );


        /* =================================================
           CREATE USER
        ================================================= */

        const userData = {

            fullName:
                cleanName,

            phone:
                cleanPhone,

            email:
                cleanEmail,

            password:
                hashedPassword,

            referralCode:
                ownReferralCode
        };


        /*
           Only add referredBy when a referral was actually
           used.

           This prevents an unnecessary null value for users
           who register directly.
        */

        if (referredBy) {

            userData.referredBy =
                referredBy;
        }


        const user =
            await User.create(
                userData
            );


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

                referral_code:
                    user.referralCode,

                referredBy:
                    user.referredBy || null,

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


        const identifierValue =
            String(identifier).trim();


        const passwordValue =
            String(password);


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


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid login details."
            });
        }


        if (
            user.status === "frozen"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your FINORA account has been frozen."
            });
        }


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
           IMPORTANT:
           OLD USERS MAY NOT HAVE A REFERRAL CODE.
           
           Generate one automatically when they log in.
        ================================================= */

        if (
            !user.referralCode
        ) {

            user.referralCode =
                await generateReferralCode();

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

                        referral_code:
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
           OLD USERS:
           CREATE REFERRAL CODE IF MISSING
        ================================================= */

        if (
            !user.referralCode
        ) {

            user.referralCode =
                await generateReferralCode();

            await user.save();
        }


        /* =================================================
           CURRENT USER RESPONSE
        ================================================= */

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

                referredBy:
                    user.referredBy || null,

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
                "finora.sid",
                {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none"
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


module.exports = router;
