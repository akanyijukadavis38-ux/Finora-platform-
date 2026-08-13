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
   FRONTEND FILES
========================================= */

app.use(express.static(__dirname));


/* =========================================
   HOME / INDEX
========================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


/* =========================================
   BACKEND STATUS
========================================= */

app.get("/api/status", (req, res) => {

    res.json({

        success: true,

        platform: "FINORA",

        message:
            "FINORA backend is running",

        status: "online"

    });

});


/* =========================================
   REGISTRATION CONNECTION TEST
========================================= */

app.get("/api/register-test", (req, res) => {

    res.json({

        success: true,

        service:
            "FINORA Registration API",

        message:
            "Registration server connection is working",

        status: "online"

    });

});


/* =========================================
   DATABASE HEALTH
========================================= */

app.get("/api/health", async (req, res) => {

    try {

        await pool.query("SELECT 1");

        res.json({

            success: true,

            service:
                "FINORA API",

            database:
                "connected",

            status:
                "healthy"

        });

    } catch (error) {

        console.error(
            "Database health check failed:",
            error.message
        );

        res.status(500).json({

            success: false,

            service:
                "FINORA API",

            database:
                "disconnected",

            status:
                "unhealthy",

            message:
                error.message

        });

    }

});


/* =========================================
   CREATE USERS TABLE
========================================= */

async function createUsersTable() {

    try {

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

    } catch (error) {

        console.error(
            "Failed to create users table:",
            error.message
        );

    }

}


/* =========================================
   REGISTER USER
========================================= */

app.post("/api/register", async (req, res) => {

    console.log(
        "================================="
    );

    console.log(
        "FINORA REGISTER REQUEST RECEIVED"
    );

    console.log(
        "================================="
    );


    try {

        /* ---------------------------------
           READ REQUEST
        --------------------------------- */

        const {
            fullName,
            phone,
            email,
            password,
            referralCode
        } = req.body;


        console.log(
            "Registration data received"
        );


        /* ---------------------------------
           REQUIRED FIELDS
        --------------------------------- */

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


        /* ---------------------------------
           CLEAN DATA
        --------------------------------- */

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


        /* ---------------------------------
           PASSWORD VALIDATION
        --------------------------------- */

        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 6 characters long."

            });

        }


        /* ---------------------------------
           EMAIL VALIDATION
        --------------------------------- */

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailPattern.test(cleanEmail)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid email address."

            });

        }


        /* ---------------------------------
           UGANDA PHONE VALIDATION
        --------------------------------- */

        const phonePattern =
            /^07[0-9]{8}$/;

        if (
            !phonePattern.test(cleanPhone)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid Uganda phone number."

            });

        }


        /* =================================
           DATABASE CONNECTION TEST
        ================================= */

        console.log(
            "Testing database connection..."
        );

        await pool.query("SELECT 1");

        console.log(
            "Database connection successful"
        );


        /* =================================
           CHECK EXISTING USER
        ================================= */

        console.log(
            "Checking existing account..."
        );

        const existingUser =
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


        console.log(
            "Existing account check completed"
        );


        if (
            existingUser.rows.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "An account with this phone number or email already exists."

            });

        }


        /* =================================
           HASH PASSWORD
        ================================= */

        console.log(
            "Hashing password..."
        );

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );

        console.log(
            "Password hashing completed"
        );


        /* =================================
           CREATE REFERRAL CODE
        ================================= */

        const referralCodeForUser =
            "FIN" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();


        /* =================================
           SAVE USER
        ================================= */

        console.log(
            "Creating user in database..."
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
                    account_status,
                    created_at
                `,
                [
                    cleanName,
                    cleanPhone,
                    cleanEmail,
                    passwordHash,
                    referralCodeForUser,
                    cleanReferral
                ]
            );


        const user =
            result.rows[0];


        console.log(
            "USER CREATED SUCCESSFULLY:",
            user
        );


        /* =================================
           SUCCESS
        ================================= */

        return res.status(201).json({

            success: true,

            message:
                "Account created successfully!",

            user:
                user

        });


    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "FINORA REGISTRATION ERROR:"
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );


        /* =================================
           DATABASE / SERVER ERROR
        ================================= */

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to create account. Please try again."

        });

    }

});


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
            () => {

                console.log(
                    `FINORA backend running on port ${PORT}`
                );

            }
        );

    } catch (error) {

        console.error(
            "FINORA SERVER START ERROR:",
            error
        );

    }

}


startServer();
