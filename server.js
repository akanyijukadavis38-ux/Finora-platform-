require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("./database");

const app = express();


/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());

app.use(express.json());


/* =========================================
   FRONTEND
========================================= */

app.use(express.static(__dirname));


/* =========================================
   HOME
========================================= */

app.get("/", function (req, res) {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


/* =========================================
   API STATUS
========================================= */

app.get("/api/status", function (req, res) {

    res.json({

        success: true,

        platform: "FINORA",

        message: "FINORA backend is running",

        status: "online"

    });

});


/* =========================================
   REGISTER TEST
========================================= */

app.get("/api/register-test", function (req, res) {

    res.json({

        success: true,

        service: "FINORA Registration API",

        message:
            "Registration server connection is working",

        status: "online"

    });

});


/* =========================================
   DATABASE HEALTH
========================================= */

app.get("/api/health", async function (req, res) {

    try {

        await pool.query("SELECT 1");

        res.json({

            success: true,

            service: "FINORA API",

            database: "connected",

            status: "healthy"

        });

    }

    catch (error) {

        console.error(
            "DATABASE HEALTH ERROR:",
            error.message
        );

        res.status(500).json({

            success: false,

            service: "FINORA API",

            database: "disconnected",

            status: "unhealthy",

            message: error.message

        });

    }

});


/* =========================================
   CREATE USERS TABLE
========================================= */

async function createUsersTable() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS users (

            id SERIAL PRIMARY KEY,

            full_name VARCHAR(100) NOT NULL,

            phone VARCHAR(20) NOT NULL UNIQUE,

            email VARCHAR(150) NOT NULL UNIQUE,

            password_hash TEXT NOT NULL,

            referral_code VARCHAR(50) UNIQUE,

            referred_by VARCHAR(50),

            wallet_balance NUMERIC(15,2)
                DEFAULT 0,

            cumulative_income NUMERIC(15,2)
                DEFAULT 0,

            account_status VARCHAR(20)
                DEFAULT 'active',

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP

        );

    `);

    console.log(
        "FINORA users table is ready"
    );

}


/* =========================================
   GENERATE REFERRAL CODE
========================================= */

function generateReferralCode() {

    return (
        "FIN" +
        Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()
    );

}


/* =========================================
   REGISTER USER
========================================= */

app.post(
    "/api/register",
    async function (req, res) {

        console.log(
            "FINORA: Registration request received."
        );

        try {

            const {
                fullName,
                phone,
                email,
                password,
                referralCode
            } = req.body;


            /* ==============================
               REQUIRED FIELDS
            ============================== */

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


            /* ==============================
               CLEAN DATA
            ============================== */

            const cleanName =
                String(fullName).trim();

            const cleanPhone =
                String(phone).trim();

            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            const cleanReferral =
                referralCode
                    ? String(referralCode).trim()
                    : null;


            /* ==============================
               VALIDATION
            ============================== */

            if (cleanName.length < 2) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your full name."

                });

            }


            if (!/^07[0-9]{8}$/.test(cleanPhone)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid Uganda phone number."

                });

            }


            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(cleanEmail)
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
                        "Password must be at least 6 characters long."

                });

            }


            /* ==============================
               CHECK EXISTING USER
            ============================== */

            const existing =
                await pool.query(
                    `
                    SELECT id
                    FROM users
                    WHERE phone = $1
                       OR email = $2
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


            /* ==============================
               HASH PASSWORD
            ============================== */

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );


            /* ==============================
               REFERRAL CODE
            ============================== */

            let newReferralCode;

            let codeExists = true;

            while (codeExists) {

                newReferralCode =
                    generateReferralCode();

                const check =
                    await pool.query(
                        `
                        SELECT id
                        FROM users
                        WHERE referral_code = $1
                        LIMIT 1
                        `,
                        [newReferralCode]
                    );

                codeExists =
                    check.rows.length > 0;

            }


            /* ==============================
               INSERT USER
            ============================== */

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
                        referred_by
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )

                    RETURNING
                        id,
                        full_name,
                        phone,
                        email,
                        referral_code,
                        referred_by,
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
                        cleanReferral
                    ]
                );


            const user =
                result.rows[0];


            console.log(
                "FINORA: User created:",
                user.id
            );


            /* ==============================
               SUCCESS
            ============================== */

            return res.status(201).json({

                success: true,

                message:
                    "Account registered successfully.",

                user: user

            });

        }

        catch (error) {

            console.error(
                "FINORA REGISTRATION ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to create account. Please try again."

            });

        }

    }
);


/* =========================================
   START SERVER
========================================= */

const PORT =
    process.env.PORT || 10000;


async function startServer() {

    try {

        await createUsersTable();

        app.listen(
            PORT,
            function () {

                console.log(
                    "FINORA backend running on port " +
                    PORT
                );

            }
        );

    }

    catch (error) {

        console.error(
            "FINORA SERVER START ERROR:",
            error
        );

        process.exit(1);

    }

}


startServer();
