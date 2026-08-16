require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const pool = require("./database");

const app = express();


/* =========================================================
   FINORA SERVER CONFIGURATION
========================================================= */

const PORT =
    process.env.PORT || 10000;

const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || true;


/* =========================================================
   MIDDLEWARE
========================================================= */

app.set("trust proxy", 1);

app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        credentials: true
    })
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================================
   SESSION
========================================================= */

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


/* =========================================================
   FINORA FRONTEND FILES
========================================================= */

app.use(
    express.static(__dirname)
);
/* =========================================
   FINORA PAGE ROUTES
========================================= */

app.get(
    "/profile",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "profile.html"
            )
        );

    }
);


app.get(
    "/profile.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "profile.html"
            )
        );

    }
);

/* =========================================================
   FRONTEND PAGE ROUTES
========================================================= */

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


app.get(
    "/index.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


app.get(
    "/login.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "login.html"
            )
        );

    }
);


app.get(
    "/register.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "register.html"
            )
        );

    }
);


app.get(
    "/dashboard.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "dashboard.html"
            )
        );

    }
);


app.get(
    "/profile.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "profile.html"
            )
        );

    }
);


app.get(
    "/investments.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "investments.html"
            )
        );

    }
);


app.get(
    "/team.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "team.html"
            )
        );

    }
);


/* =========================================================
   API STATUS
========================================================= */

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


/* =========================================================
   REGISTRATION TEST
========================================================= */

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


/* =========================================================
   DATABASE HEALTH
========================================================= */

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


/* =========================================================
   CREATE USERS TABLE
========================================================= */

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


    /*
       Add account_number to older FINORA databases
       if it does not already exist.
    */

    await pool.query(`

        ALTER TABLE users

        ADD COLUMN IF NOT EXISTS
            account_number VARCHAR(50) UNIQUE;

    `);


    console.log(
        "FINORA: users table is ready."
    );

}


/* =========================================================
   GENERATE REFERRAL CODE
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


/* =========================================================
   GENERATE ACCOUNT NUMBER
========================================================= */

function generateAccountNumber() {

    const random =
        Math.floor(
            10000000 +
            Math.random() *
            90000000
        );

    return (
        "FN" +
        random
    );

}


/* =========================================================
   REGISTER USER
========================================================= */

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


            /* =====================================
               REQUIRED FIELDS
            ===================================== */

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


            /* =====================================
               CLEAN DATA
            ===================================== */

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


            /* =====================================
               NAME VALIDATION
            ===================================== */

            if (
                cleanName.length < 2
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your full name."

                });

            }


            /* =====================================
               UGANDA PHONE VALIDATION
            ===================================== */

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


            /* =====================================
               EMAIL VALIDATION
            ===================================== */

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


            /* =====================================
               PASSWORD VALIDATION
            ===================================== */

            if (
                password.length < 6
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must be at least 6 characters long."

                });

            }


            /* =====================================
               CHECK EXISTING ACCOUNT
            ===================================== */

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


            /* =====================================
               HASH PASSWORD
            ===================================== */

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );


            /* =====================================
               UNIQUE REFERRAL CODE
            ===================================== */

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


            /* =====================================
               UNIQUE ACCOUNT NUMBER
            ===================================== */

            let accountNumber =
                null;

            let accountNumberExists =
                true;


            while (accountNumberExists) {

                accountNumber =
                    generateAccountNumber();


                const check =
                    await pool.query(
                        `
                        SELECT id
                        FROM users
                        WHERE account_number = $1
                        LIMIT 1
                        `,
                        [
                            accountNumber
                        ]
                    );


                accountNumberExists =
                    check.rows.length > 0;

            }


            /* =====================================
               INSERT USER
            ===================================== */

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
                        cleanReferral,
                        accountNumber
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
                        user.wallet_balance,

                    cumulativeIncome:
                        user.cumulative_income,

                    accountStatus:
                        user.account_status,

                    createdAt:
                        user.created_at
                }

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
                        "An account with this phone number, email, referral code or account number already exists."

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


/* =========================================================
   LOGIN USER
========================================================= */

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


            /* =====================================
               REQUIRED FIELDS
            ===================================== */

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


            /* =====================================
               FIND USER
            ===================================== */

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
                        account_number,
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


            /* =====================================
               ACCOUNT STATUS
            ===================================== */

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


            /* =====================================
               VERIFY PASSWORD
            ===================================== */

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


            /* =====================================
               CREATE SESSION
            ===================================== */

            req.session.userId =
                user.id;


            console.log(
                "FINORA: User logged in:",
                user.id
            );


            /* =====================================
               SAVE SESSION
            ===================================== */

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
                                user.wallet_balance,

                            cumulativeIncome:
                                user.cumulative_income,

                            accountStatus:
                                user.account_status,

                            createdAt:
                                user.created_at

                        }

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


/* =========================================================
   CURRENT LOGGED-IN USER
========================================================= */

async function getCurrentUser(req, res) {

    try {

        /* =====================================
           CHECK SESSION
        ===================================== */

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


        /* =====================================
           FIND USER
        ===================================== */

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
                    account_number,
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


        /* =====================================
           RETURN CLEAN FINORA USER OBJECT
        ===================================== */

        return res.status(200).json({

            success: true,

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
                    user.wallet_balance,

                cumulativeIncome:
                    user.cumulative_income,

                accountStatus:
                    user.account_status,

                createdAt:
                    user.created_at

            }

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


/* =========================================================
   CURRENT USER — PRIMARY ROUTE
========================================================= */

app.get(
    "/api/me",
    getCurrentUser
);


/* =========================================================
   CURRENT USER — DASHBOARD COMPATIBILITY ROUTE
=========================================================

   dashboard.js currently requests:

   /api/users/me

   Keep this route so the dashboard and profile
   both work without localStorage.
========================================================= */

app.get(
    "/api/users/me",
    getCurrentUser
);


/* =========================================================
   LOGOUT
========================================================= */

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
                    "connect.sid",
                    {
                        httpOnly: true,
                        secure: true,
                        sameSite: "none"
                    }
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


/* =========================================================
   TRANSACTIONS
=========================================================

   This endpoint is included so the current dashboard
   does not receive an unnecessary 404.

   Actual transaction records will be connected when
   the transaction/deposit tables are implemented.
========================================================= */

app.get(
    "/api/transactions/user",
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


            /*
               Transactions will be connected to the
               FINORA database in the transaction stage.

               For now return an empty list instead of
               returning a 404.
            */

            return res.status(200).json({

                success: true,

                transactions: []

            });

        }

        catch (error) {

            console.error(
                "FINORA TRANSACTIONS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load transactions."

            });

        }

    }
);


/* =========================================================
   UNKNOWN API ROUTE
========================================================= */

app.use(
    "/api",
    function (req, res) {

        return res.status(404).json({

            success: false,

            message:
                "FINORA API endpoint not found."

        });

    }
);


/* =========================================================
   START SERVER
========================================================= */

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
