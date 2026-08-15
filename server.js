require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const pool = require("./database");

const app = express();


/* =========================================
   MIDDLEWARE
========================================= */

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================
   SESSION
========================================= */

app.set("trust proxy", 1);

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "FINORA_CHANGE_THIS_SESSION_SECRET",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge:
                1000 *
                60 *
                60 *
                24 *
                7
        }
    })
);


/* =========================================
   FRONTEND
========================================= */

app.use(
    express.static(__dirname)
);


/* =========================================
   HOME
========================================= */

app.get(
    "/",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


/* =========================================
   API STATUS
========================================= */

app.get(
    "/api/status",
    function (req, res) {

        res.json({

            success: true,

            platform: "FINORA",

            message:
                "FINORA backend is running",

            status: "online"

        });

    }
);


/* =========================================
   REGISTER TEST
========================================= */

app.get(
    "/api/register-test",
    function (req, res) {

        res.json({

            success: true,

            service:
                "FINORA Registration API",

            message:
                "Registration server connection is working",

            status: "online"

        });

    }
);


/* =========================================
   DATABASE HEALTH
========================================= */

app.get(
    "/api/health",
    async function (req, res) {

        try {

            await pool.query(
                "SELECT 1"
            );

            res.json({

                success: true,

                service:
                    "FINORA API",

                database:
                    "connected",

                status:
                    "healthy"

            });

        }

        catch (error) {

            console.error(
                "DATABASE HEALTH ERROR:",
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

    }
);


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
        "FINORA: users table is ready."
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
            "================================="
        );

        console.log(
            "FINORA: POST /api/register received"
        );

        console.log(
            "FINORA request body:",
            req.body
        );

        console.log(
            "================================="
        );


        try {

            await createUsersTable();


            const {
                fullName,
                phone,
                email,
                password,
                referralCode
            } = req.body || {};


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
                    ? String(
                        referralCode
                    ).trim()
                    : null;


            /* ==============================
               NAME VALIDATION
            ============================== */

            if (
                cleanName.length < 2
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your full name."

                });

            }


            /* ==============================
               PHONE VALIDATION
            ============================== */

            if (
                !/^07[0-9]{8}$/.test(
                    cleanPhone
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid Uganda phone number."

                });

            }


            /* ==============================
               EMAIL VALIDATION
            ============================== */

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


            /* ==============================
               PASSWORD VALIDATION
            ============================== */

            if (
                password.length < 6
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must be at least 6 characters long."

                });

            }


            /* ==============================
               CHECK EXISTING ACCOUNT
            ============================== */

            const existing =
                await pool.query(
                    `
                    SELECT
                        id,
                        phone,
                        email
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


            if (
                existing.rows.length > 0
            ) {

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
               CREATE UNIQUE REFERRAL CODE
            ============================== */

            let newReferralCode =
                null;

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
                        [
                            newReferralCode
                        ]
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
                        referred_by,
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


            if (
                !result.rows ||
                result.rows.length === 0
            ) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Account could not be created."

                });

            }


            const user =
                result.rows[0];


            console.log(
                "FINORA: ACCOUNT CREATED"
            );

            console.log(
                "User ID:",
                user.id
            );


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


            if (
                error.code === "23505"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this phone number or email already exists."

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Unable to create account. Please try again.",

                error:
                    process.env.NODE_ENV ===
                    "production"
                        ? undefined
                        : error.message

            });

        }

    }
);


/* =========================================
   LOGIN USER
========================================= */

app.post(
    "/api/login",
    async function (req, res) {

        console.log(
            "FINORA: Login request received."
        );


        try {

            const {
                identifier,
                password
            } = req.body || {};


            /* ==============================
               REQUIRED FIELDS
            ============================== */

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


            const cleanIdentifier =
                String(identifier).trim();


            /* ==============================
               FIND USER
            ============================== */

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        full_name,
                        phone,
                        email,
                        password_hash,
                        referral_code,
                        referred_by,
                        wallet_balance,
                        cumulative_income,
                        account_status,
                        created_at
                    FROM users
                    WHERE phone = $1
                       OR LOWER(email) =
                          LOWER($1)
                    LIMIT 1
                    `,
                    [
                        cleanIdentifier
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid phone/email or password."

                });

            }


            const user =
                result.rows[0];


            /* ==============================
               ACCOUNT STATUS
            ============================== */

            if (
                user.account_status !==
                "active"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your FINORA account is currently unavailable. Please contact support."

                });

            }


            /* ==============================
               VERIFY PASSWORD
            ============================== */

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );


            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid phone/email or password."

                });

            }


            /* ==============================
               CREATE LOGIN SESSION
            ============================== */

            req.session.userId =
                user.id;


            /* ==============================
               REMOVE PASSWORD HASH
            ============================== */

            delete user.password_hash;


            console.log(
                "FINORA: User logged in:",
                user.id
            );


            /* ==============================
               SAVE SESSION
            ============================== */

            req.session.save(
                function (sessionError) {

                    if (sessionError) {

                        console.error(
                            "FINORA SESSION SAVE ERROR:",
                            sessionError
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Login session could not be created."

                        });

                    }


                    return res.status(200).json({

                        success: true,

                        message:
                            "Login successful.",

                        user: user

                    });

                }
            );

        }

        catch (error) {

            console.error(
                "FINORA LOGIN ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to login. Please try again."

            });

        }

    }
);


/* =========================================
   CURRENT LOGGED-IN USER
========================================= */

app.get(
    "/api/me",
    async function (req, res) {

        try {

            if (
                !req.session ||
                !req.session.userId
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "User is not logged in."

                });

            }


            const result =
                await pool.query(
                    `
                    SELECT
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
                    FROM users
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        req.session.userId
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                req.session.destroy(
                    function () {}
                );


                return res.status(404).json({

                    success: false,

                    message:
                        "User account was not found."

                });

            }


            const user =
                result.rows[0];


            return res.status(200).json({

                success: true,

                user: user

            });

        }

        catch (error) {

            console.error(
                "FINORA CURRENT USER ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load user information."

            });

        }

    }
);


/* =========================================
   LOGOUT
========================================= */

app.post(
    "/api/logout",
    function (req, res) {

        req.session.destroy(
            function (error) {

                if (error) {

                    console.error(
                        "FINORA LOGOUT ERROR:",
                        error
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Unable to logout."

                    });

                }


                res.clearCookie(
                    "connect.sid"
                );


                return res.status(200).json({

                    success: true,

                    message:
                        "Logged out successfully."

                });

            }
        );

    }
);


/* =========================================
   START SERVER
========================================= */

const PORT =
    process.env.PORT || 10000;


async function startServer() {

    try {

        console.log(
            "FINORA: Starting server..."
        );


        await createUsersTable();


        app.listen(
            PORT,
            function () {

                console.log(
                    "================================="
                );

                console.log(
                    "FINORA BACKEND IS ONLINE"
                );

                console.log(
                    "PORT:",
                    PORT
                );

                console.log(
                    "================================="
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
