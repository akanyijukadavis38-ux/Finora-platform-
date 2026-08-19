const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("./database");

const router = express.Router();

/* =========================================================
   TEST ROUTE
   GET /api/users/test
========================================================= */

router.get("/test", (req, res) => {
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
           CONFIRM PASSWORD
        ----------------------------------------- */

        if (
            confirmPassword !== undefined &&
            String(password) !== String(confirmPassword)
        ) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }


        /* -----------------------------------------
           CLEAN DATA
        ----------------------------------------- */

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


        /* -----------------------------------------
           NORMALIZE UGANDA PHONE
        ----------------------------------------- */

        if (/^\+2567\d{8}$/.test(cleanPhone)) {
            cleanPhone =
                "0" + cleanPhone.substring(4);
        }

        if (/^2567\d{8}$/.test(cleanPhone)) {
            cleanPhone =
                "0" + cleanPhone.substring(3);
        }


        /* -----------------------------------------
           VALIDATE NAME
        ----------------------------------------- */

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please enter your full name."
            });
        }


        /* -----------------------------------------
           VALIDATE PHONE
        ----------------------------------------- */

        if (!/^07[0-9]{8}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid Uganda phone number."
            });
        }


        /* -----------------------------------------
           VALIDATE EMAIL
        ----------------------------------------- */

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });
        }


        /* -----------------------------------------
           VALIDATE PASSWORD
        ----------------------------------------- */

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters long."
            });
        }


        /* -----------------------------------------
           CHECK EXISTING USER
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

            if (referral.rows.length === 0) {

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
           GENERATE REFERRAL CODE
        ----------------------------------------- */

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
                newReferralCode = candidate;
            }
        }


        /* -----------------------------------------
           GENERATE ACCOUNT NUMBER
        ----------------------------------------- */

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
                accountNumber = candidate;
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


        const user =
            result.rows[0];


        /* -----------------------------------------
           SUCCESS
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
                    Number(user.wallet_balance),

                cumulativeIncome:
                    Number(user.cumulative_income),

                accountStatus:
                    user.account_status,

                createdAt:
                    user.created_at
            }

        });

    }

    catch (error) {

        console.error(
            "FINORA USER ROUTE ERROR:",
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
