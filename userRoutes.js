const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("./database");

const router = express.Router();

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function generateReferralCode() {
    return (
        "FIN" +
        Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()
    );
}

function generateAccountNumber() {
    const random =
        Math.floor(
            10000000 +
            Math.random() * 90000000
        );

    return "FN" + random;
}

function normalizeUgandaPhone(phone) {
    let value =
        String(phone || "")
            .trim()
            .replace(/\s+/g, "");

    if (/^\+2567\d{8}$/.test(value)) {
        value = "0" + value.substring(4);
    }

    if (/^2567\d{8}$/.test(value)) {
        value = "0" + value.substring(3);
    }

    return value;
}

function normalizeEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validUgandaPhone(phone) {
    return /^07[0-9]{8}$/.test(phone);
}

/* =========================================================
   REGISTER USER
   POST /api/users/register
========================================================= */

router.post(
    "/register",
    async function (req, res) {

        try {

            const {
                fullName,
                phone,
                email,
                password,
                confirmPassword,
                referralCode
            } = req.body || {};

            /* -----------------------------------------
               REQUIRED FIELDS
            ----------------------------------------- */

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

            /* -----------------------------------------
               PASSWORD CONFIRMATION
            ----------------------------------------- */

            if (
                String(password) !==
                String(confirmPassword)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Passwords do not match."

                });

            }

            /* -----------------------------------------
               CLEAN VALUES
            ----------------------------------------- */

            const cleanName =
                String(fullName).trim();

            const cleanPhone =
                normalizeUgandaPhone(phone);

            const cleanEmail =
                normalizeEmail(email);

            const cleanReferral =
                referralCode
                    ? String(referralCode).trim()
                    : null;

            /* -----------------------------------------
               NAME
            ----------------------------------------- */

            if (cleanName.length < 2) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your full name."

                });

            }

            /* -----------------------------------------
               PHONE
            ----------------------------------------- */

            if (!validUgandaPhone(cleanPhone)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid Uganda phone number."

                });

            }

            /* -----------------------------------------
               EMAIL
            ----------------------------------------- */

            if (!validEmail(cleanEmail)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid email address."

                });

            }

            /* -----------------------------------------
               PASSWORD
            ----------------------------------------- */

            if (String(password).length < 6) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must be at least 6 characters long."

                });

            }

            /* -----------------------------------------
               CHECK EXISTING ACCOUNT
            ----------------------------------------- */

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

            if (existing.rows.length > 0) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this phone number or email already exists."

                });

            }

            /* -----------------------------------------
               CHECK REFERRAL
            ----------------------------------------- */

            let referredBy = null;

            if (cleanReferral) {

                const referralResult =
                    await pool.query(
                        `
                        SELECT id
                        FROM users
                        WHERE referral_code = $1
                        LIMIT 1
                        `,
                        [cleanReferral]
                    );

                if (
                    referralResult.rows.length === 0
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "The referral code is invalid."

                    });

                }

                referredBy = cleanReferral;
            }

            /* -----------------------------------------
               HASH PASSWORD
            ----------------------------------------- */

            const passwordHash =
                await bcrypt.hash(
                    String(password),
                    12
                );

            /* -----------------------------------------
               GENERATE UNIQUE REFERRAL CODE
            ----------------------------------------- */

            let newReferralCode;

            for (;;) {

                const candidate =
                    generateReferralCode();

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

                    break;
                }
            }

            /* -----------------------------------------
               GENERATE UNIQUE ACCOUNT NUMBER
            ----------------------------------------- */

            let accountNumber;

            for (;;) {

                const candidate =
                    generateAccountNumber();

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

                    break;
                }
            }

            /* -----------------------------------------
               CREATE USER
            ----------------------------------------- */

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

            const user = result.rows[0];

            /* -----------------------------------------
               SUCCESS RESPONSE
            ----------------------------------------- */

            return res.status(201).json({

                success: true,

                message:
                    "Account registered successfully.",

                user: {

                    id: user.id,

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

            console.error(
                "FINORA USER REGISTRATION ERROR:",
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

    }
);


/* =========================================================
   TEST USER ROUTE
   GET /api/users/test
========================================================= */

router.get(
    "/test",
    function (req, res) {

        res.json({

            success: true,

            message:
                "FINORA user routes are connected successfully."

        });

    }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;
