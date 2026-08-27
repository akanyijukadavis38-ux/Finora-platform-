const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("./database");

const router = express.Router();

console.log("🔥 FINORA USERROUTES.JS LOADED 🔥");


/* =========================================================
   TEST ROUTE
========================================================= */

router.get("/test", (req, res) => {
console.log("🔥 REGISTER ENDPOINT REACHED");

return res.json({
    success: true,
    message: "REGISTER ENDPOINT IS WORKING",
    body: req.body
});
    res.json({
        success: true,
        message: "FINORA user routes are connected successfully."
    });

});


/* =========================================================
   REGISTER
   POST /api/users/register
========================================================= */

router.post("/register", async (req, res) => {

    console.log("");
    console.log("==============================================");
    console.log("🔥 REGISTER REQUEST RECEIVED");
    console.log("REGISTER BODY RECEIVED");
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
                ? String(referralCode).trim()
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
           DATABASE TEST BEFORE REGISTRATION
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 7: Testing database connection..."
        );


        const dbTest =
            await pool.query(
                "SELECT NOW() AS time"
            );


        console.log(
            "🔥 CHECKPOINT 8: Database query successful:",
            dbTest.rows[0].time
        );


        /* =====================================================
           CHECK EXISTING USER
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 9: Checking existing user..."
        );


        const existing =
            await pool.query(
                `
                SELECT id
                FROM users
                WHERE phone = $1
                   OR LOWER(email) = LOWER($2)
                LIMIT 1
                `,
                [
                    cleanPhone,
                    cleanEmail
                ]
            );


        console.log(
            "🔥 CHECKPOINT 10: Existing-user query finished"
        );


        if (existing.rows.length > 0) {

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
            "CHECKPOINT 11: No existing user found"
        );


        /* =====================================================
           CHECK REFERRAL
        ===================================================== */

        let referredBy = null;


        if (cleanReferral) {

            console.log(
                "🔥 CHECKPOINT 12: Checking referral code..."
            );


            const referral =
                await pool.query(
                    `
                    SELECT referral_code
                    FROM users
                    WHERE referral_code = $1
                    LIMIT 1
                    `,
                    [cleanReferral]
                );


            console.log(
                "🔥 CHECKPOINT 13: Referral query finished"
            );


            if (referral.rows.length === 0) {

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
            "CHECKPOINT 14: Referral processing finished"
        );


        /* =====================================================
           HASH PASSWORD
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 15: Hashing password..."
        );


        const passwordHash =
            await bcrypt.hash(
                String(password),
                12
            );


        console.log(
            "🔥 CHECKPOINT 16: Password hash finished"
        );


        /* =====================================================
           GENERATE REFERRAL CODE
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 17: Generating referral code..."
        );


        let newReferralCode;

        while (!newReferralCode) {

            const candidate =
                "FIN" +
                Math.random()
                    .toString(36)
                    .substring(2, 10)
                    .toUpperCase();


            const check =
                await pool.query(
                    `
                    SELECT id
                    FROM users
                    WHERE referral_code = $1
                    LIMIT 1
                    `,
                    [candidate]
                );


            if (check.rows.length === 0) {

                newReferralCode =
                    candidate;

            }

        }


        console.log(
            "🔥 CHECKPOINT 18: Referral code generated:",
            newReferralCode
        );


        /* =====================================================
           GENERATE ACCOUNT NUMBER
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 19: Generating account number..."
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
                await pool.query(
                    `
                    SELECT id
                    FROM users
                    WHERE account_number = $1
                    LIMIT 1
                    `,
                    [candidate]
                );


            if (check.rows.length === 0) {

                accountNumber =
                    candidate;

            }

        }


        console.log(
            "🔥 CHECKPOINT 20: Account number generated:",
            accountNumber
        );


        /* =====================================================
           INSERT USER
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 21: INSERTING USER INTO DATABASE..."
        );


        const result =
            await pool.query(
                `
                INSERT INTO users
                (
                    full_name,
                    phone,
                    email,
                    password_hash,
                    referral_code,
                    referred_by,
                    account_number,
                    wallet_balance,
                    cumulative_income,
                    account_status
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    0,
                    0,
                    'active'
                )
                RETURNING
                    id,
                    full_name,
                    phone,
                    email,
                    referral_code,
                    referred_by,
                    account_number,
                    wallet_balance,
                    cumulative_income,
                    account_status,
                    created_at
                `,
                [
                    cleanName,
                    cleanPhone,
                    cleanEmail,
                    passwordHash,
                    newReferralCode,
                    referredBy,
                    accountNumber
                ]
            );


        console.log(
            "🔥 CHECKPOINT 22: USER INSERT FINISHED"
        );


        const user =
            result.rows[0];


        console.log(
            "🔥 CHECKPOINT 23: USER RETURNED:",
            user.id
        );


        /* =====================================================
           SUCCESS RESPONSE
        ===================================================== */

        console.log(
            "🔥 CHECKPOINT 24: SENDING SUCCESS RESPONSE"
        );


        return res.status(201).json({

            success: true,

            message:
                "Account registered successfully.",

            user: {

                id:
                    user.id,

                fullName:
                    user.full_name,

                phone:
                    user.phone,

                email:
                    user.email,

                referralCode:
                    user.referral_code,

                referredBy:
                    user.referred_by,

                accountNumber:
                    user.account_number,

                walletBalance:
                    Number(
                        user.wallet_balance
                    ),

                cumulativeIncome:
                    Number(
                        user.cumulative_income
                    ),

                accountStatus:
                    user.account_status,

                createdAt:
                    user.created_at

            }

        });


    } catch (error) {

        console.error("");
        console.error(
            "=============================================="
        );
        console.error(
            "🔥 FINORA REGISTRATION ERROR"
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
            "ERROR DETAIL:",
            error.detail
        );

        console.error(
            "ERROR CONSTRAINT:",
            error.constraint
        );

        console.error(
            "FULL ERROR:",
            error
        );


        if (error.code === "23505") {

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
