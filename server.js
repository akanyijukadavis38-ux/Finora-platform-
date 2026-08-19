require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const pool = require("./database");


/* =========================================================
   FINORA SERVER
   =========================================================
   User routes are directly inside this file.

   DO NOT require userRoutes.js.
========================================================= */

const app = express();


/* =========================================================
   SERVER CONFIGURATION
========================================================= */

const PORT =
    Number(process.env.PORT) || 8080;

const IS_PRODUCTION =
    process.env.NODE_ENV === "production";

const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || "";

const SESSION_SECRET =
    process.env.SESSION_SECRET ||
    "FINORA_CHANGE_THIS_SESSION_SECRET";


/* =========================================================
   TRUST RAILWAY PROXY
========================================================= */

if (IS_PRODUCTION) {
    app.set("trust proxy", 1);
}


/* =========================================================
   CORS
========================================================= */

const allowedOrigins =
    FRONTEND_ORIGIN
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean);

app.use(
    cors({

        origin: function (origin, callback) {

            /*
             * Allow requests without Origin.
             */

            if (!origin) {
                return callback(null, true);
            }


            /*
             * If FRONTEND_ORIGIN is not configured,
             * allow all origins.
             */

            if (allowedOrigins.length === 0) {
                return callback(null, true);
            }


            /*
             * Allow configured frontend origins.
             */

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }


            return callback(
                new Error(
                    "CORS origin not allowed."
                )
            );

        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]

    })
);


/* =========================================================
   BODY PARSING
========================================================= */

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);


/* =========================================================
   SESSION
========================================================= */

app.use(
    session({

        name:
            "finora.sid",

        secret:
            SESSION_SECRET,

        resave:
            false,

        saveUninitialized:
            false,

        rolling:
            true,

        cookie: {

            httpOnly:
                true,

            secure:
                IS_PRODUCTION,

            sameSite:
                IS_PRODUCTION
                    ? "none"
                    : "lax",

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
   STATIC FRONTEND
========================================================= */

const publicPath =
    path.join(
        __dirname,
        "public"
    );

app.use(
    express.static(
        publicPath
    )
);


/* =========================================================
   FRONTEND PAGE ROUTES
========================================================= */

const frontendPages = {

    "/":
        "index.html",

    "/index.html":
        "index.html",

    "/login.html":
        "login.html",

    "/register.html":
        "register.html",

    "/dashboard.html":
        "dashboard.html",

    "/profile.html":
        "profile.html",

    "/profile":
        "profile.html",

    "/investments.html":
        "investments.html",

    "/team.html":
        "team.html",

    "/transactions.html":
        "transactions.html",

    "/deposit.html":
        "deposit.html",

    "/withdraw.html":
        "withdraw.html"

};


Object.entries(
    frontendPages
).forEach(
    ([route, file]) => {

        app.get(
            route,
            (req, res) => {

                res.sendFile(
                    path.join(
                        publicPath,
                        file
                    )
                );

            }
        );

    }
);


/* =========================================================
   API ROOT
   GET /api
========================================================= */

app.get(
    "/api",
    (req, res) => {

        return res.json({

            success:
                true,

            application:
                "FINORA",

            message:
                "FINORA API is running.",

            version:
                "1.0.0"

        });

    }
);


/* =========================================================
   DATABASE HEALTH
   GET /api/health
========================================================= */

app.get(
    "/api/health",
    async (req, res) => {

        try {

            await pool.query(
                "SELECT 1"
            );

            return res.json({

                success:
                    true,

                message:
                    "FINORA server is running.",

                database:
                    "connected"

            });

        }

        catch (error) {

            console.error(
                "DATABASE HEALTH ERROR:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA server is running but database connection failed.",

                database:
                    "disconnected"

            });

        }

    }
);


/* =========================================================
   USER API ROOT
   GET /api/users
========================================================= */

app.get(
    "/api/users",
    (req, res) => {

        console.log(
            "FINORA: /api/users reached"
        );

        return res.json({

            success:
                true,

            message:
                "FINORA users API is working.",

            endpoints: {

                test:
                    "/api/users/test",

                register:
                    "/api/users/register",

                login:
                    "/api/users/login"

            }

        });

    }
);


/* =========================================================
   USER TEST
   GET /api/users/test
========================================================= */

app.get(
    "/api/users/test",
    (req, res) => {

        console.log(
            "FINORA: /api/users/test reached"
        );

        return res.json({

            success:
                true,

            message:
                "FINORA direct users route is working."

        });

    }
);


/* =========================================================
   REGISTER
   POST /api/users/register
========================================================= */

app.post(
    "/api/users/register",
    async (req, res) => {

        try {

            const {
                fullName,
                phone,
                email,
                password,
                confirmPassword,
                referralCode
            } = req.body || {};


            /* =========================================
               REQUIRED FIELDS
            ========================================= */

            if (
                !fullName ||
                !phone ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Full name, phone, email and password are required."

                });

            }


            /* =========================================
               CONFIRM PASSWORD
            ========================================= */

            if (
                String(password) !==
                String(confirmPassword || "")
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Passwords do not match."

                });

            }


            /* =========================================
               CLEAN DATA
            ========================================= */

            const cleanName =
                String(fullName)
                    .trim();

            let cleanPhone =
                String(phone)
                    .trim()
                    .replace(
                        /\s+/g,
                        ""
                    );

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


            /* =========================================
               NORMALIZE UGANDA PHONE
            ========================================= */

            if (
                /^\+2567\d{8}$/.test(
                    cleanPhone
                )
            ) {

                cleanPhone =
                    "0" +
                    cleanPhone.substring(
                        4
                    );

            }


            if (
                /^2567\d{8}$/.test(
                    cleanPhone
                )
            ) {

                cleanPhone =
                    "0" +
                    cleanPhone.substring(
                        3
                    );

            }


            /* =========================================
               NAME VALIDATION
            ========================================= */

            if (
                cleanName.length < 2
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Please enter your full name."

                });

            }


            /* =========================================
               PHONE VALIDATION
            ========================================= */

            if (
                !/^07[0-9]{8}$/.test(
                    cleanPhone
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Please enter a valid Uganda phone number."

                });

            }


            /* =========================================
               EMAIL VALIDATION
            ========================================= */

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    cleanEmail
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Please enter a valid email address."

                });

            }


            /* =========================================
               PASSWORD VALIDATION
            ========================================= */

            if (
                String(password).length < 6
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Password must be at least 6 characters long."

                });

            }


            /* =========================================
               CHECK EXISTING USER
            ========================================= */

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


            if (
                existing.rows.length > 0
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "An account with this phone number or email already exists."

                });

            }


            /* =========================================
               CHECK REFERRAL
            ========================================= */

            let referredBy =
                null;

            if (
                cleanReferral
            ) {

                const referral =
                    await pool.query(
                        `
                        SELECT referral_code
                        FROM users
                        WHERE referral_code = $1
                        LIMIT 1
                        `,
                        [
                            cleanReferral
                        ]
                    );


                if (
                    referral.rows.length === 0
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        message:
                            "The referral code is invalid."

                    });

                }


                referredBy =
                    cleanReferral;

            }


            /* =========================================
               HASH PASSWORD
            ========================================= */

            const passwordHash =
                await bcrypt.hash(
                    String(password),
                    12
                );


            /* =========================================
               GENERATE REFERRAL CODE
            ========================================= */

            let newReferralCode =
                null;


            while (
                !newReferralCode
            ) {

                const candidate =
                    "FIN" +
                    Math.random()
                        .toString(36)
                        .substring(
                            2,
                            10
                        )
                        .toUpperCase();


                const check =
                    await pool.query(
                        `
                        SELECT id
                        FROM users
                        WHERE referral_code = $1
                        LIMIT 1
                        `,
                        [
                            candidate
                        ]
                    );


                if (
                    check.rows.length === 0
                ) {

                    newReferralCode =
                        candidate;

                }

            }


            /* =========================================
               GENERATE ACCOUNT NUMBER
            ========================================= */

            let accountNumber =
                null;


            while (
                !accountNumber
            ) {

                const candidate =
                    "FN" +
                    Math.floor(
                        10000000 +
                        Math.random() *
                        90000000
                    );


                const check =
                    await pool.query(
                        `
                        SELECT id
                        FROM users
                        WHERE account_number = $1
                        LIMIT 1
                        `,
                        [
                            candidate
                        ]
                    );


                if (
                    check.rows.length === 0
                ) {

                    accountNumber =
                        candidate;

                }

            }


            /* =========================================
               INSERT USER
            ========================================= */

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


            /* =========================================
               SUCCESS
            ========================================= */

            return res.status(201).json({

                success:
                    true,

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

        }

        catch (error) {

            console.error(
                "FINORA REGISTER ERROR:",
                error
            );


            if (
                error.code === "23505"
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "Phone, email, referral code or account number already exists."

                });

            }


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to create account. Please try again."

            });

        }

    }
);


/* =========================================================
   LOGIN
   POST /api/users/login
========================================================= */

app.post(
    "/api/users/login",
    async (req, res) => {

        try {

            const {
                phone,
                email,
                password
            } = req.body || {};


            const loginValue =
                String(
                    phone ||
                    email ||
                    ""
                )
                    .trim();


            const passwordValue =
                String(
                    password ||
                    ""
                );


            if (
                !loginValue ||
                !passwordValue
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Phone/email and password are required."

                });

            }


            /* =========================================
               FIND USER
            ========================================= */

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
                       OR LOWER(email) = LOWER($1)
                    LIMIT 1
                    `,
                    [
                        loginValue
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Invalid login details."

                });

            }


            const user =
                result.rows[0];


            /* =========================================
               ACCOUNT STATUS
            ========================================= */

            if (
                user.account_status &&
                user.account_status !== "active"
            ) {

                return res.status(403).json({

                    success:
                        false,

                    message:
                        "Your FINORA account is not active."

                });

            }


            /* =========================================
               PASSWORD
            ========================================= */

            const passwordMatches =
                await bcrypt.compare(
                    passwordValue,
                    user.password_hash
                );


            if (
                !passwordMatches
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Invalid login details."

                });

            }


            /* =========================================
               SESSION
            ========================================= */

            req.session.userId =
                user.id;


            /* =========================================
               RESPONSE
            ========================================= */

            return res.json({

                success:
                    true,

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

        }

        catch (error) {

            console.error(
                "FINORA LOGIN ERROR:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to login. Please try again."

            });

        }

    }
);


/* =========================================================
   GET USER BY ID
   GET /api/users/:id

   IMPORTANT:
   This route is deliberately AFTER /test
   and /register /login.
========================================================= */

app.get(
    "/api/users/:id",
    async (req, res) => {

        try {

            const userId =
                req.params.id;


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
                        userId
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "User not found."

                });

            }


            const user =
                result.rows[0];


            return res.json({

                success:
                    true,

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

        }

        catch (error) {

            console.error(
                "FINORA GET USER ERROR:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load user."

            });

        }

    }
);


/* =========================================================
   404 HANDLER
   MUST BE LAST
========================================================= */

app.use(
    (req, res) => {

        console.log(
            "FINORA 404:",
            req.method,
            req.originalUrl
        );


        if (
            req.path.startsWith("/api/")
        ) {

            return res.status(404).json({

                success:
                    false,

                message:
                    "API endpoint not found."

            });

        }


        return res.status(404).send(
            "FINORA page not found."
        );

    }
);


/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
    (error, req, res, next) => {

        console.error(
            "FINORA SERVER ERROR:",
            error
        );


        if (
            error.message ===
            "CORS origin not allowed."
        ) {

            return res.status(403).json({

                success:
                    false,

                message:
                    "CORS origin not allowed."

            });

        }


        return res.status(500).json({

            success:
                false,

            message:
                "Internal server error."

        });

    }
);


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

    try {

        /*
         * Test PostgreSQL before
         * starting HTTP server.
         */

        await pool.query(
            "SELECT 1"
        );


        console.log(
            "FINORA: PostgreSQL connected successfully."
        );


        /*
         * Start server on Railway's
         * assigned port and all interfaces.
         */

        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `FINORA server running on port ${PORT}`
                );

            }
        );

    }

    catch (error) {

        console.error(
            "FINORA FAILED TO START:",
            error
        );

        process.exit(1);

    }

}


startServer();
