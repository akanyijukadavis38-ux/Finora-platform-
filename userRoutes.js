const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("./User");

const router = express.Router();

console.log("🔥 FINORA USERROUTES.JS LOADED 🔥");


/* =========================================================
   TEST ROUTE
   GET /api/Users/test
========================================================= */

router.get("/test", (req, res) => {

    console.log("🔥 FINORA USER ROUTES TEST REACHED");

    return res.json({

        success: true,

        message:
            "FINORA user routes are connected successfully."

    });

});


/* =========================================================
   REGISTER
   POST /api/Users/register
========================================================= */

router.post("/register", async (req, res) => {

    console.log("");
    console.log("==============================================");
    console.log("🔥 FINORA REGISTER REQUEST RECEIVED");
    console.log("==============================================");


    try {

        const {
            fullName,
            phone,
            email,
            password,
            confirmPassword,
            referralCode
        } = req.body || {};


        console.log("CHECKPOINT 1: Request body received");


        /* =====================================================
           REQUIRED FIELDS
        ===================================================== */

        if (
            !fullName ||
            !phone ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Full name, phone, email and password are required."

            });

        }


        console.log("CHECKPOINT 2: Required fields passed");


        /* =====================================================
           CONFIRM PASSWORD
        ===================================================== */

        if (
            confirmPassword !== undefined &&
            String(password) !== String(confirmPassword)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Passwords do not match."

            });

        }


        console.log("CHECKPOINT 3: Password confirmation passed");


        /* =====================================================
           CLEAN DATA
        ===================================================== */

        const cleanName =
            String(fullName).trim();

        let cleanPhone =
            String(phone)
                .trim()
                .replace(/\s+/g, "");

        const cleanEmail =
            String(email)
                .trim()
                .toLowerCase();

        const cleanReferral =
            referralCode
                ? String(referralCode)
                    .trim()
                    .toUpperCase()
                : null;


        console.log("CHECKPOINT 4: Data cleaned");


        /* =====================================================
           NORMALIZE UGANDA PHONE
        ===================================================== */

        if (/^\+2567\d{8}$/.test(cleanPhone)) {

            cleanPhone =
                "0" + cleanPhone.substring(4);

        }

        if (/^2567\d{8}$/.test(cleanPhone)) {

            cleanPhone =
                "0" + cleanPhone.substring(3);

        }


        console.log(
            "CHECKPOINT 5: Phone normalized:",
            cleanPhone
        );


        /* =====================================================
           VALIDATE NAME
        ===================================================== */

        if (cleanName.length < 2) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter your full name."

            });

        }


        /* =====================================================
           VALIDATE PHONE
        ===================================================== */

        if (!/^07[0-9]{8}$/.test(cleanPhone)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid Uganda phone number."

            });

        }


        /* =====================================================
           VALIDATE EMAIL
        ===================================================== */

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid email address."

            });

        }


        /* =====================================================
           VALIDATE PASSWORD
        ===================================================== */

        if (String(password).length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 6 characters long."

            });

        }


        console.log("CHECKPOINT 6: All validation passed");


        /* =====================================================
           CHECK EXISTING USER
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 7: Checking existing user in MongoDB..."
        );


        const existingUser =
            await User.findOne({

                $or: [

                    {
                        phone: cleanPhone
                    },

                    {
                        email: cleanEmail
                    }

                ]

            });


        console.log(
            "🔥 CHECKPOINT 8: Existing-user check finished"
        );


        if (existingUser) {

            return res.status(409).json({

                success: false,

                message:
                    "An account with this phone number or email already exists."

            });

        }


        /* =====================================================
           CHECK REFERRAL
        ===================================================== */

        let referredBy = null;


        if (cleanReferral) {

            console.log(
                "🔥 CHECKPOINT 9: Checking referral code..."
            );


            const referralUser =
                await User.findOne({

                    referralCode:
                        cleanReferral

                });


            if (!referralUser) {

                return res.status(400).json({

                    success: false,

                    message:
                        "The referral code is invalid."

                });

            }


            referredBy =
                cleanReferral;


            console.log(
                "🔥 CHECKPOINT 10: Referral code verified"
            );

        } else {

            console.log(
                "CHECKPOINT 10: No referral code supplied"
            );

        }


        /* =====================================================
           HASH PASSWORD
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 11: Hashing password..."
        );


        const passwordHash =
            await bcrypt.hash(
                String(password),
                12
            );


        console.log(
            "🔥 CHECKPOINT 12: Password hash finished"
        );


        /* =====================================================
           GENERATE REFERRAL CODE
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 13: Generating referral code..."
        );


        let newReferralCode;

        while (!newReferralCode) {

            const candidate =
                "FIN" +
                Math.random()
                    .toString(36)
                    .substring(2, 10)
                    .toUpperCase();


            const existingReferral =
                await User.findOne({

                    referralCode:
                        candidate

                });


            if (!existingReferral) {

                newReferralCode =
                    candidate;

            }

        }


        console.log(
            "🔥 CHECKPOINT 14: Referral code generated:",
            newReferralCode
        );


        /* =====================================================
           GENERATE ACCOUNT NUMBER
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 15: Generating account number..."
        );


        let accountNumber;

        while (!accountNumber) {

            const candidate =
                "FN" +
                Math.floor(
                    10000000 +
                    Math.random() * 90000000
                );


            const existingAccount =
                await User.findOne({

                    accountNumber:
                        candidate

                });


            if (!existingAccount) {

                accountNumber =
                    candidate;

            }

        }


        console.log(
            "🔥 CHECKPOINT 16: Account number generated:",
            accountNumber
        );


        /* =====================================================
           CREATE USER
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 17: Creating user in MongoDB..."
        );


        const user =
            await User.create({

                fullName:
                    cleanName,

                phone:
                    cleanPhone,

                email:
                    cleanEmail,

                passwordHash:
                    passwordHash,

                referralCode:
                    newReferralCode,

                referredBy:
                    referredBy,

                accountNumber:
                    accountNumber,

                walletBalance:
                    0,

                cumulativeIncome:
                    0,

                accountStatus:
                    "active"

            });


        console.log(
            "🔥 CHECKPOINT 18: USER CREATED:",
            user._id
        );


        /* =====================================================
           SUCCESS RESPONSE
        ===================================================== */

        return res.status(201).json({

            success: true,

            message:
                "Account registered successfully.",

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

                referredBy:
                    user.referredBy,

                accountNumber:
                    user.accountNumber,

                walletBalance:
                    Number(
                        user.walletBalance || 0
                    ),

                cumulativeIncome:
                    Number(
                        user.cumulativeIncome || 0
                    ),

                accountStatus:
                    user.accountStatus,

                createdAt:
                    user.createdAt

            }

        });


    } catch (error) {

        console.error("");
        console.error(
            "=============================================="
        );
        console.error(
            "🔥 FINORA MONGODB REGISTRATION ERROR"
        );
        console.error(
            "=============================================="
        );

        console.error(
            "ERROR MESSAGE:",
            error.message
        );

        console.error(
            "ERROR CODE:",
            error.code
        );

        console.error(
            "FULL ERROR:",
            error
        );


        if (error.code === 11000) {

            return res.status(409).json({

                success: false,

                message:
                    "Phone, email, referral code or account number already exists."

            });

        }


        return res.status(500).json({

            success: false,

            message:
                "Unable to create account. Please try again."

        });

    }

});


/* =========================================================
   LOGIN
   POST /api/Users/login
========================================================= */

router.post("/login", async (req, res) => {

    console.log("");
    console.log("==============================================");
    console.log("🔥 FINORA LOGIN REQUEST RECEIVED");
    console.log("==============================================");


    try {

        const {
            identifier,
            password
        } = req.body || {};


        console.log(
            "LOGIN CHECKPOINT 1: Request body received"
        );


        /* =====================================================
           REQUIRED FIELDS
        ===================================================== */

        if (!identifier || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone number or email and password are required."

            });

        }


        /* =====================================================
           CLEAN IDENTIFIER
        ===================================================== */

        let cleanIdentifier =
            String(identifier)
                .trim();


        const cleanPassword =
            String(password);


        /* =====================================================
           NORMALIZE PHONE IF PHONE WAS PROVIDED
        ===================================================== */

        if (
            /^\+2567\d{8}$/.test(
                cleanIdentifier
            )
        ) {

            cleanIdentifier =
                "0" +
                cleanIdentifier.substring(4);

        }


        if (
            /^2567\d{8}$/.test(
                cleanIdentifier
            )
        ) {

            cleanIdentifier =
                "0" +
                cleanIdentifier.substring(3);

        }


        /* =====================================================
           EMAIL NORMALIZATION
        ===================================================== */

        const identifierForSearch =
            cleanIdentifier.toLowerCase();


        console.log(
            "LOGIN CHECKPOINT 2: Identifier cleaned:",
            identifierForSearch
        );


        /* =====================================================
           FIND USER
        ===================================================== */

        console.log(
            "🔥 LOGIN CHECKPOINT 3: Searching MongoDB..."
        );


        const user =
            await User.findOne({

                $or: [

                    {
                        phone:
                            cleanIdentifier
                    },

                    {
                        email:
                            identifierForSearch
                    }

                ]

            });


        console.log(
            "🔥 LOGIN CHECKPOINT 4: User search finished"
        );


        /* =====================================================
           USER NOT FOUND
        ===================================================== */

        if (!user) {

            console.log(
                "LOGIN FAILED: User not found"
            );

            return res.status(401).json({

                success: false,

                message:
                    "Invalid phone number/email or password."

            });

        }


        /* =====================================================
           ACCOUNT STATUS
        ===================================================== */

        if (
            user.accountStatus !==
            "active"
        ) {

            console.log(
                "LOGIN FAILED: Account status:",
                user.accountStatus
            );

            return res.status(403).json({

                success: false,

                message:
                    "Your FINORA account is not active."

            });

        }


        /* =====================================================
           CHECK PASSWORD
        ===================================================== */

        console.log(
            "🔥 LOGIN CHECKPOINT 5: Checking password..."
        );


        const passwordMatch =
            await bcrypt.compare(
                cleanPassword,
                user.passwordHash
            );


        console.log(
            "🔥 LOGIN CHECKPOINT 6: Password check finished"
        );


        if (!passwordMatch) {

            console.log(
                "LOGIN FAILED: Incorrect password"
            );

            return res.status(401).json({

                success: false,

                message:
                    "Invalid phone number/email or password."

            });

        }


        /* =====================================================
           LOGIN SUCCESS
        ===================================================== */

        console.log(
            "🔥 LOGIN CHECKPOINT 7: LOGIN SUCCESS:",
            user._id
        );


        /* =====================================================
           RETURN SAFE USER DATA
           
           NEVER RETURN passwordHash
        ===================================================== */

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

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

                referredBy:
                    user.referredBy,

                accountNumber:
                    user.accountNumber,

                walletBalance:
                    Number(
                        user.walletBalance || 0
                    ),

                cumulativeIncome:
                    Number(
                        user.cumulativeIncome || 0
                    ),

                accountStatus:
                    user.accountStatus,

                createdAt:
                    user.createdAt

            }

        });


    } catch (error) {

        console.error("");
        console.error(
            "=============================================="
        );

        console.error(
            "🔥 FINORA LOGIN ERROR"
        );

        console.error(
            "=============================================="
        );

        console.error(
            "ERROR MESSAGE:",
            error.message
        );

        console.error(
            "FULL ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to login. Please try again."

        });

    }

});


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
