require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const pool = require("./database");

/* =========================================================
   FINORA SERVER
========================================================= */

const app = express();

/* =========================================================
   SERVER CONFIGURATION
========================================================= */

const PORT = Number(process.env.PORT) || 8080;

const IS_PRODUCTION =
    process.env.NODE_ENV === "production";

const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || "";

const SESSION_SECRET =
    process.env.SESSION_SECRET ||
    "FINORA_CHANGE_THIS_SESSION_SECRET";

/* =========================================================
   TRUST PROXY
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
             * This includes direct browser/API testing.
             */

            if (!origin) {
                return callback(null, true);
            }

            /*
             * If FRONTEND_ORIGIN is not configured,
             * allow the request.
             */

            if (allowedOrigins.length === 0) {
                return callback(null, true);
            }

            /*
             * Allow configured frontend.
             */

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("CORS origin not allowed.")
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

        name: "finora.sid",

        secret: SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        rolling: true,

        cookie: {

            httpOnly: true,

            secure: IS_PRODUCTION,

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
    path.join(__dirname, "public");

app.use(
    express.static(publicPath)
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

Object.entries(frontendPages)
    .forEach(([route, file]) => {

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

    });

/* =========================================================
   API ROOT
========================================================= */

app.get(
    "/api",
    (req, res) => {

        return res.json({

            success: true,

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
   DATABASE HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    async (req, res) => {

        try {

            await pool.query(
                "SELECT 1"
            );

            return res.json({

                success: true,

                message:
                    "FINORA server is running.",

                database:
                    "connected"

            });

        }

        catch (error) {

            console.error(
                "FINORA DATABASE HEALTH ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "FINORA server is running but database connection failed.",

                database:
                    "disconnected"

            });

        }

    }
);


/* =========================================================
   USER HELPER FUNCTIONS
========================================================= */

/* ---------------------------------------------------------
   GENERATE REFERRAL CODE
--------------------------------------------------------- */

function generateReferralCode() {

    return (
        "FIN" +
        Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()
    );

}


/* ---------------------------------------------------------
   GENERATE ACCOUNT NUMBER
--------------------------------------------------------- */

function generateAccountNumber() {

    return (
        "FN" +
        Math.floor(
            10000000 +
            Math.random() * 90000000
        )
    );

}


/* ---------------------------------------------------------
   NORMALIZE UGANDA PHONE
--------------------------------------------------------- */

function normalizeUgandaPhone(phone) {

    let value =
        String(phone || "")
            .trim()
            .replace(/\s+/g, "");

    /*
     * +256701234567
     * becomes
     * 0701234567
     */

    if (
        /^\+2567\d{8}$/.test(value)
    ) {

        value =
            "0" +
            value.substring(4);

    }

    /*
     * 256701234567
     * becomes
     * 0701234567
     */

    if (
        /^2567\d{8}$/.test(value)
    ) {

        value =
            "0" +
            value.substring(3);

    }

    return value;

}


/* ---------------------------------------------------------
   NORMALIZE EMAIL
--------------------------------------------------------- */

function normalizeEmail(email) {

    return String(email || "")
        .trim()
        .toLowerCase();

}


/* ---------------------------------------------------------
   VALIDATE EMAIL
--------------------------------------------------------- */

function validEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* ---------------------------------------------------------
   VALIDATE UGANDA PHONE
--------------------------------------------------------- */

function validUgandaPhone(phone) {

    return /^07[0-9]{8}$/.test(phone);

}


/* =========================================================
   USER ROUTE TEST
   DIRECTLY INSIDE SERVER.JS
========================================================= */

app.get(
    "/api/users/test",
    (req, res) => {

        return res.json({

            success: true,

            message:
                "FINORA user system is working directly from server.js."

        });

    }
);


/* =========================================================
   USER REGISTRATION
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
                String(password) !==
                String(confirmPassword || "")
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Passwords do not match."

                });

            }


            /* -----------------------------------------
               CLEAN DATA
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
               VALIDATE NAME
            ----------------------------------------- */

            if (
                cleanName.length < 2
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your full name."

                });

            }


            /* -----------------------------------------
               VALIDATE PHONE
            ----------------------------------------- */

            if (
                !validUgandaPhone(cleanPhone)
            ) {

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
                !validEmail(cleanEmail)
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

            if (
                String(password).length < 6
            ) {

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


            if (
                existing.rows.length > 0
            ) {

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


                referredBy =
                    cleanReferral;

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

            let newReferralCode = null;

            while (!newReferralCode) {

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


                if (
                    check.rows.length === 0
                ) {

                    newReferralCode =
                        candidate;

                }

            }


            /* -----------------------------------------
               GENERATE UNIQUE ACCOUNT NUMBER
            ----------------------------------------- */

            let accountNumber = null;

            while (!accountNumber) {

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


                if (
                    check.rows.length === 0
                ) {

                    accountNumber =
                        candidate;

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
               SUCCESS RESPONSE
            ----------------------------------------- */

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
   USER LOGIN
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


            /* -----------------------------------------
               REQUIRED LOGIN DATA
            ----------------------------------------- */

            if (
                (!phone && !email) ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Phone or email and password are required."

                });

            }


            /* -----------------------------------------
               FIND USER
            ----------------------------------------- */

            let result;


            if (email) {

                const cleanEmail =
                    normalizeEmail(email);

                result =
                    await pool.query(
                        `
                        SELECT *
                        FROM users
                        WHERE LOWER(email) = LOWER($1)
                        LIMIT 1
                        `,
                        [cleanEmail]
                    );

            } else {

                const cleanPhone =
                    normalizeUgandaPhone(phone);

                result =
                    await pool.query(
                        `
                        SELECT *
                        FROM users
                        WHERE phone = $1
                        LIMIT 1
                        `,
                        [cleanPhone]
                    );

            }


            /* -----------------------------------------
               USER NOT FOUND
            ----------------------------------------- */

            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid login details."

                });

            }


            const user =
                result.rows[0];


            /* -----------------------------------------
               CHECK PASSWORD
            ----------------------------------------- */

            const passwordMatch =
                await bcrypt.compare(
                    String(password),
                    user.password_hash
                );


            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid login details."

                });

            }


            /* -----------------------------------------
               CHECK ACCOUNT STATUS
            ----------------------------------------- */

            if (
                user.account_status &&
                user.account_status !== "active"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your FINORA account is not active."

                });

            }


            /* -----------------------------------------
               SESSION
            ----------------------------------------- */

            req.session.userId =
                user.id;


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            return res.json({

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
                        Number(
                            user.wallet_balance || 0
                        ),

                    cumulativeIncome:
                        Number(
                            user.cumulative_income || 0
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

                success: false,

                message:
                    "Unable to login. Please try again."

            });

        }

    }
);


/* =========================================================
   CURRENT USER
   GET /api/users/me
========================================================= */

app.get(
    "/api/users/me",
    async (req, res) => {

        try {

            if (!req.session.userId) {

                return res.status(401).json({

                    success: false,

                    message:
                        "You are not logged in."

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
                        account_number,
                        wallet_balance,
                        cumulative_income,
                        account_status,
                        created_at
                    FROM users
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [req.session.userId]
                );


            if (
                result.rows.length === 0
            ) {

                req.session.destroy(
                    () => {}
                );

                return res.status(404).json({

                    success: false,

                    message:
                        "User account not found."

                });

            }


            const user =
                result.rows[0];


            return res.json({

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
                        Number(
                            user.wallet_balance || 0
                        ),

                    cumulativeIncome:
                        Number(
                            user.cumulative_income || 0
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
                "FINORA CURRENT USER ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load your account."

            });

        }

    }
);


/* =========================================================
   LOGOUT
   POST /api/users/logout
========================================================= */

app.post(
    "/api/users/logout",
    (req, res) => {

        req.session.destroy(
            error => {

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
                    "finora.sid"
                );


                return res.json({

                    success: true,

                    message:
                        "Logged out successfully."

                });

            }
        );

    }
);


/* =========================================================
   404 HANDLER
========================================================= */

app.use(
    (req, res) => {

        if (
            req.path.startsWith("/api/")
        ) {

            return res.status(404).json({

                success: false,

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

                success: false,

                message:
                    "CORS origin not allowed."

            });

        }


        return res.status(500).json({

            success: false,

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

        await pool.query(
            "SELECT 1"
        );

        console.log(
            "FINORA: PostgreSQL connected successfully."
        );


        app.listen(
            PORT,
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


/* =========================================================
   START
========================================================= */

startServer();
