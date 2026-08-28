const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("./database");

const router = express.Router();

console.log("🔥 FINORA USERROUTES.JS LOADED 🔥");


/* =========================================================
   GET DATABASE
========================================================= */

function getDatabase() {
    if (!db) {
        throw new Error("MongoDB database connection is not available.");
    }

    // Supports database.js exporting either:
    // 1. the MongoDB Db object directly
    // 2. an object containing { db }
    return db.db || db;
}


/* =========================================================
   TEST ROUTE
   GET /api/users/test
========================================================= */

router.get("/test", (req, res) => {

    console.log("🔥 FINORA USER TEST ENDPOINT REACHED");

    return res.json({

        success: true,

        message:
            "FINORA user routes are connected successfully."

    });

});


/* =========================================================
   REGISTER
   POST /api/users/register
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

            console.log(
                "CHECKPOINT FAILED: Required field missing"
            );

            return res.status(400).json({

                success: false,

                message:
                    "Full name, phone, email and password are required."

            });

        }


        console.log(
            "CHECKPOINT 2: Required fields passed"
        );


        /* =====================================================
           CONFIRM PASSWORD
        ===================================================== */

        if (
            confirmPassword !== undefined &&
            String(password) !== String(confirmPassword)
        ) {

            console.log(
                "CHECKPOINT FAILED: Password mismatch"
            );

            return res.status(400).json({

                success: false,

                message:
                    "Passwords do not match."

            });

        }


        console.log(
            "CHECKPOINT 3: Password confirmation passed"
        );


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
                ? String(referralCode).trim().toUpperCase()
                : null;


        console.log(
            "CHECKPOINT 4: Data cleaned"
        );


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


        console.log(
            "CHECKPOINT 6: All validation passed"
        );


        /* =====================================================
           GET MONGODB
        ===================================================== */

        const database =
            getDatabase();

        const users =
            database.collection("users");


        console.log(
            "🔥 CHECKPOINT 7: MongoDB users collection ready"
        );


        /* =====================================================
           CHECK EXISTING USER
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 8: Checking existing user..."
        );


        const existing =
            await users.findOne({

                $or: [

                    {
                        phone:
                            cleanPhone
                    },

                    {
                        email:
                            cleanEmail
                    }

                ]

            });


        console.log(
            "🔥 CHECKPOINT 9: Existing-user query finished"
        );


        if (existing) {

            console.log(
                "REGISTER STOPPED: User already exists"
            );

            return res.status(409).json({

                success: false,

                message:
                    "An account with this phone number or email already exists."

            });

        }


        console.log(
            "CHECKPOINT 10: No existing user found"
        );


        /* =====================================================
           CHECK REFERRAL
        ===================================================== */

        let referredBy = null;


        if (cleanReferral) {

            console.log(
                "🔥 CHECKPOINT 11: Checking referral code..."
            );


            const referral =
                await users.findOne({

                    referralCode:
                        cleanReferral

                });


            console.log(
                "🔥 CHECKPOINT 12: Referral query finished"
            );


            if (!referral) {

                return res.status(400).json({

                    success: false,

                    message:
                        "The referral code is invalid."

                });

            }


            referredBy =
                cleanReferral;

        }


        console.log(
            "CHECKPOINT 13: Referral processing finished"
        );


        /* =====================================================
           HASH PASSWORD
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 14: Hashing password..."
        );


        const passwordHash =
            await bcrypt.hash(
                String(password),
                12
            );


        console.log(
            "🔥 CHECKPOINT 15: Password hash finished"
        );


        /* =====================================================
           GENERATE REFERRAL CODE
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 16: Generating referral code..."
        );


        let newReferralCode;


        while (!newReferralCode) {

            const candidate =
                "FIN" +
                crypto
                    .randomBytes(4)
                    .toString("hex")
                    .toUpperCase();


            const check =
                await users.findOne({

                    referralCode:
                        candidate

                });


            if (!check) {

                newReferralCode =
                    candidate;

            }

        }


        console.log(
            "🔥 CHECKPOINT 17: Referral code generated:",
            newReferralCode
        );


        /* =====================================================
           GENERATE ACCOUNT NUMBER
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 18: Generating account number..."
        );


        let accountNumber;


        while (!accountNumber) {

            const candidate =
                "FN" +
                Math.floor(
                    10000000 +
                    Math.random() * 90000000
                );


            const check =
                await users.findOne({

                    accountNumber:
                        candidate

                });


            if (!check) {

                accountNumber =
                    candidate;

            }

        }


        console.log(
            "🔥 CHECKPOINT 19: Account number generated:",
            accountNumber
        );


        /* =====================================================
           CREATE USER
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 20: CREATING USER IN MONGODB..."
        );


        const now =
            new Date();


        const newUser = {

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
                "active",

            createdAt:
                now,

            updatedAt:
                now

        };


        /* =====================================================
           INSERT USER
        ===================================================== */

        const result =
            await users.insertOne(
                newUser
            );


        console.log(
            "🔥 CHECKPOINT 21: USER INSERT FINISHED"
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
                    result.insertedId,

                fullName:
                    newUser.fullName,

                phone:
                    newUser.phone,

                email:
                    newUser.email,

                referralCode:
                    newUser.referralCode,

                referredBy:
                    newUser.referredBy,

                accountNumber:
                    newUser.accountNumber,

                walletBalance:
                    newUser.walletBalance,

                cumulativeIncome:
                    newUser.cumulativeIncome,

                accountStatus:
                    newUser.accountStatus,

                createdAt:
                    newUser.createdAt

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


        /* =====================================================
           DUPLICATE KEY
        ===================================================== */

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
   EXPORT
========================================================= */

module.exports = router;
