require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const pool = require("./database");

/* =========================================================
   FINORA APPLICATION
========================================================= */

const app = express();

/* =========================================================
   SERVER CONFIGURATION
========================================================= */

const PORT = Number(process.env.PORT) || 10000;

const IS_PRODUCTION =
    process.env.NODE_ENV === "production";

const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || "";

const SESSION_SECRET =
    process.env.SESSION_SECRET ||
    "FINORA_CHANGE_THIS_SESSION_SECRET";

/* =========================================================
   FINORA BUSINESS RULES
========================================================= */

const MIN_DEPOSIT = 10000;
const MIN_WITHDRAWAL = 4000;

const DAILY_RATE = 0.10;

const WITHDRAWAL_FEE_RATE = 0.15;

const MAX_WITHDRAWALS_PER_DAY = 2;

const LEVEL_1_RATE = 0.15;
const LEVEL_2_RATE = 0.05;
const LEVEL_3_RATE = 0.02;

/* =========================================================
   TRUST PROXY
========================================================= */

if (IS_PRODUCTION) {
    app.set("trust proxy", 1);
}

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = FRONTEND_ORIGIN
    ? FRONTEND_ORIGIN
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

app.use(
    cors({
        origin: function (origin, callback) {

            /*
             * Allow requests with no Origin header.
             * This is useful for server-side requests,
             * health checks and same-origin requests.
             */

            if (!origin) {
                return callback(null, true);
            }

            /*
             * If no FRONTEND_ORIGIN was configured,
             * allow the requesting origin.
             *
             * IMPORTANT:
             * In production, set FRONTEND_ORIGIN to
             * your actual frontend URL.
             */

            if (allowedOrigins.length === 0) {
                return callback(null, true);
            }

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
            "PATCH",
            "PUT",
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

app.use(
    express.static(__dirname)
);

/* =========================================================
   PAGE ROUTES
========================================================= */

const frontendPages = {
    "/": "index.html",
    "/index.html": "index.html",
    "/login.html": "login.html",
    "/register.html": "register.html",
    "/dashboard.html": "dashboard.html",
    "/profile.html": "profile.html",
    "/profile": "profile.html",
    "/investments.html": "investments.html",
    "/team.html": "team.html",
    "/transactions.html": "transactions.html",
    "/deposit.html": "deposit.html",
    "/withdraw.html": "withdraw.html"
};

Object.entries(frontendPages).forEach(
    ([route, file]) => {

        app.get(
            route,
            function (req, res) {

                res.sendFile(
                    path.join(
                        __dirname,
                        file
                    )
                );

            }
        );

    }
);

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
        value =
            "0" +
            value.substring(4);
    }

    if (/^2567\d{8}$/.test(value)) {
        value =
            "0" +
            value.substring(3);
    }

    return value;
}

function normalizeEmail(email) {

    return String(email || "")
        .trim()
        .toLowerCase();

}

function money(value) {

    return Number(
        Number(value || 0).toFixed(2)
    );

}

function validEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}

function validUgandaPhone(phone) {

    return /^07[0-9]{8}$/.test(phone);

}

/* =========================================================
   USER AUTHENTICATION
========================================================= */

function requireUser(req, res, next) {

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

    next();

}

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

function requireAdmin(req, res, next) {

    if (
        !req.session ||
        !req.session.adminId
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Administrator authentication required."

        });

    }

    next();

}

/* =========================================================
   DATABASE TABLE INITIALIZATION
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

            account_number VARCHAR(50) UNIQUE,

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
     * Migration protection.
     * If the table already existed from an older version,
     * these statements make sure the required columns exist.
     */

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS full_name VARCHAR(100)
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email VARCHAR(150)
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password_hash TEXT
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50)
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50)
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS account_number VARCHAR(50)
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(15,2)
        DEFAULT 0
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS cumulative_income NUMERIC(15,2)
        DEFAULT 0
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS account_status VARCHAR(20)
        DEFAULT 'active'
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
    `);

    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
    `);

}

/* =========================================================
   DEPOSITS TABLE
========================================================= */

async function createDepositsTable() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS deposits (

            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            amount NUMERIC(15,2) NOT NULL,

            method VARCHAR(30),

            transaction_reference VARCHAR(100),

            status VARCHAR(20)
                DEFAULT 'pending',

            approved_by INTEGER,

            approved_at TIMESTAMP,

            rejected_reason TEXT,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP

        );

    `);

    await pool.query(`
        ALTER TABLE deposits
        ADD COLUMN IF NOT EXISTS method VARCHAR(30)
    `);

    await pool.query(`
        ALTER TABLE deposits
        ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(100)
    `);

    await pool.query(`
        ALTER TABLE deposits
        ADD COLUMN IF NOT EXISTS status VARCHAR(20)
        DEFAULT 'pending'
    `);

    await pool.query(`
        ALTER TABLE deposits
        ADD COLUMN IF NOT EXISTS approved_by INTEGER
    `);

    await pool.query(`
        ALTER TABLE deposits
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP
    `);

    await pool.query(`
        ALTER TABLE deposits
        ADD COLUMN IF NOT EXISTS rejected_reason TEXT
    `);

    await pool.query(`
        ALTER TABLE deposits
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
    `);

    await pool.query(`
        ALTER TABLE deposits
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
    `);

}

/* =========================================================
   WITHDRAWALS TABLE
========================================================= */

async function createWithdrawalsTable() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS withdrawals (

            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            amount NUMERIC(15,2) NOT NULL,

            fee NUMERIC(15,2) NOT NULL,

            net_amount NUMERIC(15,2) NOT NULL,

            method VARCHAR(30),

            phone VARCHAR(20),

            status VARCHAR(20)
                DEFAULT 'pending',

            approved_by INTEGER,

            approved_at TIMESTAMP,

            rejected_reason TEXT,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP

        );

    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS fee NUMERIC(15,2)
        DEFAULT 0
    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15,2)
        DEFAULT 0
    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS method VARCHAR(30)
    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS status VARCHAR(20)
        DEFAULT 'pending'
    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS approved_by INTEGER
    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP
    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS rejected_reason TEXT
    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
    `);

    await pool.query(`
        ALTER TABLE withdrawals
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
    `);

}

/* =========================================================
   EARNINGS TABLE
========================================================= */

async function createEarningsTable() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS earnings (

            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            deposit_id INTEGER
                REFERENCES deposits(id)
                ON DELETE SET NULL,

            amount NUMERIC(15,2) NOT NULL,

            rate NUMERIC(8,4) NOT NULL,

            earning_date DATE NOT NULL,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            UNIQUE (
                user_id,
                deposit_id,
                earning_date
            )

        );

    `);

}

/* =========================================================
   REFERRAL COMMISSIONS TABLE
========================================================= */

async function createReferralCommissionsTable() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS referral_commissions (

            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            referred_user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            deposit_id INTEGER
                REFERENCES deposits(id)
                ON DELETE SET NULL,

            level INTEGER NOT NULL,

            rate NUMERIC(8,4) NOT NULL,

            amount NUMERIC(15,2) NOT NULL,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP

        );

    `);

    /*
     * Prevent the same deposit from generating the
     * same level commission twice.
     */

    await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS
        referral_commission_unique_deposit_level
        ON referral_commissions
        (
            referred_user_id,
            deposit_id,
            level
        )
    `);

}

/* =========================================================
   TRANSACTIONS TABLE
========================================================= */

async function createTransactionsTable() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS transactions (

            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            type VARCHAR(40) NOT NULL,

            amount NUMERIC(15,2) NOT NULL,

            reference_id INTEGER,

            description TEXT,

            status VARCHAR(20)
                DEFAULT 'completed',

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP

        );

    `);

}

/* =========================================================
   ADMIN TABLE
========================================================= */

async function createAdminsTable() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS admins (

            id SERIAL PRIMARY KEY,

            username VARCHAR(100) NOT NULL UNIQUE,

            password_hash TEXT NOT NULL,

            admin_status VARCHAR(20)
                DEFAULT 'active',

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP

        );

    `);

}

/* =========================================================
   CREATE ADMIN FROM ENVIRONMENT
========================================================= */

async function createDefaultAdmin() {

    const username =
        process.env.ADMIN_USERNAME;

    const password =
        process.env.ADMIN_PASSWORD;

    /*
     * We do NOT create a default admin with a hard-coded
     * password. This prevents accidental public credentials.
     */

    if (!username || !password) {

        console.log(
            "FINORA: ADMIN_USERNAME / ADMIN_PASSWORD not set. Existing admins will be used."
        );

        return;

    }

    const existing =
        await pool.query(
            `
            SELECT id
            FROM admins
            WHERE username = $1
            LIMIT 1
            `,
            [username]
        );

    if (existing.rows.length > 0) {

        return;

    }

    const passwordHash =
        await bcrypt.hash(
            password,
            12
        );

    await pool.query(
        `
        INSERT INTO admins
        (
            username,
            password_hash,
            admin_status
        )
        VALUES
        (
            $1,
            $2,
            'active'
        )
        `,
        [
            username,
            passwordHash
        ]
    );

    console.log(
        `FINORA: Admin "${username}" created successfully.`
    );

}

/* =========================================================
   REGISTER
========================================================= */

app.post(
    "/api/register",
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

            if (
                confirmPassword !== undefined &&
                String(password) !==
                String(confirmPassword)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Passwords do not match."

                });

            }

            const cleanName =
                String(fullName)
                    .trim();

            const cleanPhone =
                normalizeUgandaPhone(
                    phone
                );

            const cleanEmail =
                normalizeEmail(
                    email
                );

            const cleanReferral =
                referralCode
                    ? String(
                        referralCode
                    ).trim()
                    : null;

            if (
                cleanName.length < 2
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your full name."

                });

            }

            if (
                !validUgandaPhone(
                    cleanPhone
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid Uganda phone number."

                });

            }

            if (
                !validEmail(
                    cleanEmail
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid email address."

                });

            }

            if (
                String(password).length < 6
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must be at least 6 characters long."

                });

            }

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
                        [
                            cleanReferral
                        ]
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

            const passwordHash =
                await bcrypt.hash(
                    String(password),
                    12
                );

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

                if (
                    check.rows.length === 0
                ) {

                    newReferralCode =
                        candidate;

                    break;

                }

            }

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

                if (
                    check.rows.length === 0
                ) {

                    accountNumber =
                        candidate;

                    break;

                }

            }

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
   LOGIN
========================================================= */

app.post(
    "/api/login",
    async function (req, res) {

        try {

            /*
             * Accept several common frontend names.
             */

            const identifier =
                req.body &&
                (
                    req.body.identifier ||
                    req.body.phone ||
                    req.body.email ||
                    req.body.username
                );

            const password =
                req.body &&
                req.body.password;

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

            const passwordMatch =
                await bcrypt.compare(
                    String(password),
                    user.password_hash
                );

            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid phone/email or password."

                });

            }

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

            req.session.userId =
                user.id;

            /*
             * Prevent an old admin session from remaining
             * attached to the same browser session.
             */

            delete req.session.adminId;

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
   CURRENT USER
========================================================= */

async function getCurrentUser(
    req,
    res
) {

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
                () => {}
            );

            return res.status(404).json({

                success: false,

                message:
                    "User account was not found."

            });

        }

        const user =
            result.rows[0];

        if (
            user.account_status !==
            "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is currently unavailable."

            });

        }

        let accountNumber =
            user.account_number;

        if (!accountNumber) {

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

                if (
                    check.rows.length === 0
                ) {

                    accountNumber =
                        candidate;

                    break;

                }

            }

            await pool.query(
                `
                UPDATE users
                SET
                    account_number = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    accountNumber,
                    user.id
                ]
            );

        }

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

                accountNumber,

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

app.get(
    "/api/me",
    getCurrentUser
);

app.get(
    "/api/users/me",
    getCurrentUser
);

app.get(
    "/api/profile",
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
                    "finora.sid",
                    {
                        httpOnly: true,
                        secure: IS_PRODUCTION,
                        sameSite:
                            IS_PRODUCTION
                                ? "none"
                                : "lax"
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
   DEPOSIT
========================================================= */

app.post(
    "/api/deposits",
    requireUser,
    async function (req, res) {

        try {

            const amount =
                Number(
                    req.body &&
                    req.body.amount
                );

            const method =
                req.body &&
                req.body.method
                    ? String(
                        req.body.method
                    ).trim()
                    : null;

            const transactionReference =
                req.body &&
                (
                    req.body.transactionReference ||
                    req.body.transaction_reference ||
                    req.body.reference
                )
                    ? String(
                        req.body.transactionReference ||
                        req.body.transaction_reference ||
                        req.body.reference
                    ).trim()
                    : null;

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid deposit amount."

                });

            }

            if (
                amount < MIN_DEPOSIT
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Minimum deposit is UGX ${MIN_DEPOSIT}.`

                });

            }

            /*
             * If a transaction reference is supplied,
             * do not allow it to be submitted twice.
             */

            if (transactionReference) {

                const duplicate =
                    await pool.query(
                        `
                        SELECT id
                        FROM deposits
                        WHERE transaction_reference = $1
                        LIMIT 1
                        `,
                        [
                            transactionReference
                        ]
                    );

                if (
                    duplicate.rows.length > 0
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "This transaction reference has already been submitted."

                    });

                }

            }

            const result =
                await pool.query(
                    `
                    INSERT INTO deposits
                    (
                        user_id,
                        amount,
                        method,
                        transaction_reference,
                        status
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        'pending'
                    )
                    RETURNING *
                    `,
                    [
                        req.session.userId,
                        amount,
                        method,
                        transactionReference
                    ]
                );

            const deposit =
                result.rows[0];

            await pool.query(
                `
                INSERT INTO transactions
                (
                    user_id,
                    type,
                    amount,
                    reference_id,
                    description,
                    status
                )
                VALUES
                (
                    $1,
                    'deposit',
                    $2,
                    $3,
                    $4,
                    'pending'
                )
                `,
                [
                    req.session.userId,
                    amount,
                    deposit.id,
                    "Deposit submitted for approval."
                ]
            );

            return res.status(201).json({

                success: true,

                message:
                    "Deposit submitted successfully and is awaiting approval.",

                deposit

            });

        }

        catch (error) {

            console.error(
                "FINORA DEPOSIT ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to submit deposit."

            });

        }

    }
);

/* =========================================================
   USER DEPOSITS
========================================================= */

app.get(
    "/api/deposits",
    requireUser,
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM deposits
                    WHERE user_id = $1
                    ORDER BY created_at DESC, id DESC
                    `,
                    [
                        req.session.userId
                    ]
                );

            return res.status(200).json({

                success: true,

                deposits:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA DEPOSIT HISTORY ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load deposits."

            });

        }

    }
);

/* =========================================================
   PROCESS REFERRAL COMMISSIONS
========================================================= */

async function processReferralCommissions(
    client,
    deposit
) {

    const referredUserResult =
        await client.query(
            `
            SELECT
                id,
                referred_by
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [
                deposit.user_id
            ]
        );

    if (
        referredUserResult.rows.length === 0
    ) {

        return;

    }

    let referralCode =
        referredUserResult.rows[0]
            .referred_by;

    const levels = [
        {
            level: 1,
            rate: LEVEL_1_RATE
        },
        {
            level: 2,
            rate: LEVEL_2_RATE
        },
        {
            level: 3,
            rate: LEVEL_3_RATE
        }
    ];

    for (
        const item of levels
    ) {

        if (!referralCode) {
            break;
        }

        const parentResult =
            await client.query(
                `
                SELECT
                    id,
                    referred_by
                FROM users
                WHERE referral_code = $1
                LIMIT 1
                `,
                [
                    referralCode
                ]
            );

        if (
            parentResult.rows.length === 0
        ) {
            break;
        }

        const parent =
            parentResult.rows[0];

        const commission =
            money(
                Number(deposit.amount) *
                item.rate
            );

        /*
         * INSERT FIRST.
         *
         * If this commission already exists,
         * nothing else is paid.
         */

        const commissionResult =
            await client.query(
                `
                INSERT INTO referral_commissions
                (
                    user_id,
                    referred_user_id,
                    deposit_id,
                    level,
                    rate,
                    amount
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
                ON CONFLICT
                (
                    referred_user_id,
                    deposit_id,
                    level
                )
                DO NOTHING
                RETURNING id
                `,
                [
                    parent.id,
                    deposit.user_id,
                    deposit.id,
                    item.level,
                    item.rate,
                    commission
                ]
            );

        if (
            commissionResult.rows.length === 0
        ) {

            referralCode =
                parent.referred_by;

            continue;

        }

        await client.query(
            `
            UPDATE users
            SET
                wallet_balance =
                    wallet_balance + $1,

                cumulative_income =
                    cumulative_income + $1,

                updated_at =
                    CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [
                commission,
                parent.id
            ]
        );

        await client.query(
            `
            INSERT INTO transactions
            (
                user_id,
                type,
                amount,
                reference_id,
                description,
                status
            )
            VALUES
            (
                $1,
                'referral',
                $2,
                $3,
                $4,
                'completed'
            )
            `,
            [
                parent.id,
                commission,
                deposit.id,
                `Level ${item.level} referral commission.`
            ]
        );

        referralCode =
            parent.referred_by;

    }

}

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post(
    "/api/admin/login",
    async function (req, res) {

        try {

            const {
                username,
                password
            } = req.body || {};

            if (
                !username ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Admin username and password are required."

                });

            }

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM admins
                    WHERE username = $1
                    LIMIT 1
                    `,
                    [
                        String(username).trim()
                    ]
                );

            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid admin credentials."

                });

            }

            const admin =
                result.rows[0];

            if (
                admin.admin_status !==
                "active"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Admin account is unavailable."

                });

            }

            const match =
                await bcrypt.compare(
                    String(password),
                    admin.password_hash
                );

            if (!match) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid admin credentials."

                });

            }

            req.session.adminId =
                admin.id;

            delete req.session.userId;

            req.session.save(
                function (sessionError) {

                    if (sessionError) {

                        console.error(
                            "FINORA ADMIN SESSION SAVE ERROR:",
                            sessionError
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Admin session could not be created."

                        });

                    }

                    return res.status(200).json({

                        success: true,

                        message:
                            "Admin login successful."

                    });

                }
            );

        }

        catch (error) {

            console.error(
                "FINORA ADMIN LOGIN ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to login as administrator."

            });

        }

    }
);

/* =========================================================
   ADMIN PENDING DEPOSITS
========================================================= */

app.get(
    "/api/admin/deposits",
    requireAdmin,
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        d.*,
                        u.full_name,
                        u.phone,
                        u.email,
                        u.account_number
                    FROM deposits d
                    INNER JOIN users u
                        ON u.id = d.user_id
                    WHERE d.status = 'pending'
                    ORDER BY d.created_at ASC, d.id ASC
                    `
                );

            return res.status(200).json({

                success: true,

                deposits:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA ADMIN DEPOSITS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load pending deposits."

            });

        }

    }
);

/* =========================================================
   ADMIN APPROVE DEPOSIT
========================================================= */

app.post(
    "/api/admin/deposits/:id/approve",
    requireAdmin,
    async function (req, res) {

        const client =
            await pool.connect();

        try {

            await client.query(
                "BEGIN"
            );

            const depositResult =
                await client.query(
                    `
                    SELECT *
                    FROM deposits
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [
                        req.params.id
                    ]
                );

            if (
                depositResult.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({

                    success: false,

                    message:
                        "Deposit not found."

                });

            }

            const deposit =
                depositResult.rows[0];

            if (
                deposit.status !==
                "pending"
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "This deposit has already been processed."

                });

            }

            const userResult =
                await client.query(
                    `
                    SELECT
                        id,
                        account_status
                    FROM users
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [
                        deposit.user_id
                    ]
                );

            if (
                userResult.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({

                    success: false,

                    message:
                        "Deposit owner was not found."

                });

            }

            if (
                userResult.rows[0]
                    .account_status !==
                "active"
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "The user's account is frozen."

                });

            }

            await client.query(
                `
                UPDATE deposits
                SET
                    status = 'approved',
                    approved_by = $1,
                    approved_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    req.session.adminId,
                    deposit.id
                ]
            );

            await client.query(
                `
                UPDATE users
                SET
                    wallet_balance =
                        wallet_balance + $1,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    deposit.amount,
                    deposit.user_id
                ]
            );

            await client.query(
                `
                UPDATE transactions
                SET
                    status = 'completed',
                    description =
                        'Deposit approved.'
                WHERE reference_id = $1
                  AND type = 'deposit'
                `,
                [
                    deposit.id
                ]
            );

            await processReferralCommissions(
                client,
                deposit
            );

            await client.query(
                "COMMIT"
            );

            return res.status(200).json({

                success: true,

                message:
                    "Deposit approved successfully."

            });

        }

        catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            }
            catch (rollbackError) {
                console.error(
                    "FINORA DEPOSIT ROLLBACK ERROR:",
                    rollbackError
                );
            }

            console.error(
                "FINORA DEPOSIT APPROVAL ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to approve deposit."

            });

        }

        finally {

            client.release();

        }

    }
);

/* =========================================================
   ADMIN REJECT DEPOSIT
========================================================= */

app.post(
    "/api/admin/deposits/:id/reject",
    requireAdmin,
    async function (req, res) {

        const client =
            await pool.connect();

        try {

            await client.query(
                "BEGIN"
            );

            const result =
                await client.query(
                    `
                    UPDATE deposits
                    SET
                        status = 'rejected',
                        rejected_reason = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                      AND status = 'pending'
                    RETURNING *
                    `,
                    [
                        req.body &&
                        req.body.reason
                            ? String(
                                req.body.reason
                            ).trim()
                            : "Deposit rejected.",
                        req.params.id
                    ]
                );

            if (
                result.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({

                    success: false,

                    message:
                        "Pending deposit not found."

                });

            }

            const deposit =
                result.rows[0];

            await client.query(
                `
                UPDATE transactions
                SET
                    status = 'rejected',
                    description = $1
                WHERE reference_id = $2
                  AND type = 'deposit'
                `,
                [
                    deposit.rejected_reason,
                    deposit.id
                ]
            );

            await client.query(
                "COMMIT"
            );

            return res.status(200).json({

                success: true,

                message:
                    "Deposit rejected."

            });

        }

        catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            }
            catch (rollbackError) {
                console.error(
                    "FINORA REJECT DEPOSIT ROLLBACK ERROR:",
                    rollbackError
                );
            }

            console.error(
                "FINORA DEPOSIT REJECTION ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to reject deposit."

            });

        }

        finally {

            client.release();

        }

    }
);

/* =========================================================
   WITHDRAWAL
========================================================= */

app.post(
    "/api/withdrawals",
    requireUser,
    async function (req, res) {

        const client =
            await pool.connect();

        try {

            const amount =
                Number(
                    req.body &&
                    req.body.amount
                );

            const method =
                req.body &&
                req.body.method
                    ? String(
                        req.body.method
                    ).trim()
                    : null;

            const phone =
                req.body &&
                req.body.phone
                    ? normalizeUgandaPhone(
                        req.body.phone
                    )
                    : null;

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid withdrawal amount."

                });

            }

            if (
                amount < MIN_WITHDRAWAL
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Minimum withdrawal is UGX ${MIN_WITHDRAWAL}.`

                });

            }

            if (
                phone &&
                !validUgandaPhone(phone)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid Uganda mobile money number."

                });

            }

            await client.query(
                "BEGIN"
            );

            /*
             * Lock the user row before checking balance.
             * This prevents two simultaneous withdrawals
             * from spending the same wallet balance.
             */

            const userResult =
                await client.query(
                    `
                    SELECT
                        id,
                        wallet_balance,
                        account_status
                    FROM users
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [
                        req.session.userId
                    ]
                );

            if (
                userResult.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({

                    success: false,

                    message:
                        "User account was not found."

                });

            }

            const user =
                userResult.rows[0];

            if (
                user.account_status !==
                "active"
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(403).json({

                    success: false,

                    message:
                        "Your account is currently unavailable."

                });

            }

            const countResult =
                await client.query(
                    `
                    SELECT
                        COUNT(*)::INTEGER AS count
                    FROM withdrawals
                    WHERE user_id = $1
                      AND created_at >= CURRENT_DATE
                      AND created_at <
                          CURRENT_DATE + INTERVAL '1 day'
                    `,
                    [
                        req.session.userId
                    ]
                );

            if (
                Number(
                    countResult.rows[0].count
                ) >=
                MAX_WITHDRAWALS_PER_DAY
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "You have reached the maximum of 2 withdrawals for today."

                });

            }

            const walletBalance =
                Number(
                    user.wallet_balance
                );

            if (
                walletBalance < amount
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Insufficient wallet balance."

                });

            }

            const fee =
                money(
                    amount *
                    WITHDRAWAL_FEE_RATE
                );

            const netAmount =
                money(
                    amount - fee
                );

            /*
             * The requested amount is reserved immediately.
             * If admin rejects the withdrawal, the full amount
             * is returned to the wallet.
             */

            const withdrawalResult =
                await client.query(
                    `
                    INSERT INTO withdrawals
                    (
                        user_id,
                        amount,
                        fee,
                        net_amount,
                        method,
                        phone,
                        status
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        'pending'
                    )
                    RETURNING *
                    `,
                    [
                        req.session.userId,
                        amount,
                        fee,
                        netAmount,
                        method,
                        phone
                    ]
                );

            const withdrawal =
                withdrawalResult.rows[0];

            await client.query(
                `
                UPDATE users
                SET
                    wallet_balance =
                        wallet_balance - $1,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    amount,
                    req.session.userId
                ]
            );

            await client.query(
                `
                INSERT INTO transactions
                (
                    user_id,
                    type,
                    amount,
                    reference_id,
                    description,
                    status
                )
                VALUES
                (
                    $1,
                    'withdrawal',
                    $2,
                    $3,
                    $4,
                    'pending'
                )
                `,
                [
                    req.session.userId,
                    amount,
                    withdrawal.id,
                    `Withdrawal request. Fee: UGX ${fee.toFixed(2)}`
                ]
            );

            await client.query(
                "COMMIT"
            );

            return res.status(201).json({

                success: true,

                message:
                    "Withdrawal request submitted successfully.",

                withdrawal: {

                    id:
                        withdrawal.id,

                    amount:
                        Number(
                            withdrawal.amount
                        ),

                    fee:
                        Number(
                            withdrawal.fee
                        ),

                    netAmount:
                        Number(
                            withdrawal.net_amount
                        ),

                    status:
                        withdrawal.status

                }

            });

        }

        catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            }
            catch (rollbackError) {
                console.error(
                    "FINORA WITHDRAWAL ROLLBACK ERROR:",
                    rollbackError
                );
            }

            console.error(
                "FINORA WITHDRAWAL ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to submit withdrawal."

            });

        }

        finally {

            client.release();

        }

    }
);

/* =========================================================
   USER WITHDRAWALS
========================================================= */

app.get(
    "/api/withdrawals",
    requireUser,
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM withdrawals
                    WHERE user_id = $1
                    ORDER BY created_at DESC, id DESC
                    `,
                    [
                        req.session.userId
                    ]
                );

            return res.status(200).json({

                success: true,

                withdrawals:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA WITHDRAWAL HISTORY ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load withdrawals."

            });

        }

    }
);

/* =========================================================
   ADMIN PENDING WITHDRAWALS
========================================================= */

app.get(
    "/api/admin/withdrawals",
    requireAdmin,
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        w.*,
                        u.full_name,
                        u.phone AS user_phone,
                        u.email,
                        u.account_number
                    FROM withdrawals w
                    INNER JOIN users u
                        ON u.id = w.user_id
                    WHERE w.status = 'pending'
                    ORDER BY w.created_at ASC, w.id ASC
                    `
                );

            return res.status(200).json({

                success: true,

                withdrawals:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA ADMIN WITHDRAWALS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load pending withdrawals."

            });

        }

    }
);

/* =========================================================
   ADMIN APPROVE WITHDRAWAL
========================================================= */

app.post(
    "/api/admin/withdrawals/:id/approve",
    requireAdmin,
    async function (req, res) {

        const client =
            await pool.connect();

        try {

            await client.query(
                "BEGIN"
            );

            const result =
                await client.query(
                    `
                    SELECT *
                    FROM withdrawals
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [
                        req.params.id
                    ]
                );

            if (
                result.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({

                    success: false,

                    message:
                        "Withdrawal not found."

                });

            }

            const withdrawal =
                result.rows[0];

            if (
                withdrawal.status !==
                "pending"
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "This withdrawal has already been processed."

                });

            }

            await client.query(
                `
                UPDATE withdrawals
                SET
                    status = 'approved',
                    approved_by = $1,
                    approved_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    req.session.adminId,
                    withdrawal.id
                ]
            );

            await client.query(
                `
                UPDATE transactions
                SET
                    status = 'completed',
                    description =
                        'Withdrawal approved.'
                WHERE reference_id = $1
                  AND type = 'withdrawal'
                `,
                [
                    withdrawal.id
                ]
            );

            await client.query(
                "COMMIT"
            );

            return res.status(200).json({

                success: true,

                message:
                    "Withdrawal approved successfully."

            });

        }

        catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            }
            catch (rollbackError) {
                console.error(
                    "FINORA APPROVE WITHDRAWAL ROLLBACK ERROR:",
                    rollbackError
                );
            }

            console.error(
                "FINORA APPROVE WITHDRAWAL ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to approve withdrawal."

            });

        }

        finally {

            client.release();

        }

    }
);

/* =========================================================
   ADMIN REJECT WITHDRAWAL
========================================================= */

app.post(
    "/api/admin/withdrawals/:id/reject",
    requireAdmin,
    async function (req, res) {

        const client =
            await pool.connect();

        try {

            await client.query(
                "BEGIN"
            );

            const result =
                await client.query(
                    `
                    SELECT *
                    FROM withdrawals
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [
                        req.params.id
                    ]
                );

            if (
                result.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({

                    success: false,

                    message:
                        "Withdrawal not found."

                });

            }

            const withdrawal =
                result.rows[0];

            if (
                withdrawal.status !==
                "pending"
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "This withdrawal has already been processed."

                });

            }

            const reason =
                req.body &&
                req.body.reason
                    ? String(
                        req.body.reason
                    ).trim()
                    : "Withdrawal rejected.";

            /*
             * Return the RESERVED amount to the wallet.
             */

            await client.query(
                `
                UPDATE withdrawals
                SET
                    status = 'rejected',
                    rejected_reason = $1,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    reason,
                    withdrawal.id
                ]
            );

            await client.query(
                `
                UPDATE users
                SET
                    wallet_balance =
                        wallet_balance + $1,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    withdrawal.amount,
                    withdrawal.user_id
                ]
            );

            await client.query(
                `
                UPDATE transactions
                SET
                    status = 'rejected',
                    description = $1
                WHERE reference_id = $2
                  AND type = 'withdrawal'
                `,
                [
                    reason,
                    withdrawal.id
                ]
            );

            await client.query(
                "COMMIT"
            );

            return res.status(200).json({

                success: true,

                message:
                    "Withdrawal rejected and wallet amount restored."

            });

        }

        catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            }
            catch (rollbackError) {
                console.error(
                    "FINORA REJECT WITHDRAWAL ROLLBACK ERROR:",
                    rollbackError
                );
            }

            console.error(
                "FINORA REJECT WITHDRAWAL ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to reject withdrawal."

            });

        }

        finally {

            client.release();

        }

    }
);

/* =========================================================
   DAILY EARNINGS
========================================================= */

app.post(
    "/api/earnings/process",
    requireAdmin,
    async function (req, res) {

        const client =
            await pool.connect();

        try {

            await client.query(
                "BEGIN"
            );

            const depositsResult =
                await client.query(
                    `
                    SELECT
                        d.id,
                        d.user_id,
                        d.amount
                    FROM deposits d
                    INNER JOIN users u
                        ON u.id = d.user_id
                    WHERE d.status = 'approved'
                      AND u.account_status = 'active'
                    ORDER BY d.id ASC
                    `
                );

            let processed = 0;

            for (
                const deposit
                of depositsResult.rows
            ) {

                const earning =
                    money(
                        Number(
                            deposit.amount
                        ) *
                        DAILY_RATE
                    );

                const earningResult =
                    await client.query(
                        `
                        INSERT INTO earnings
                        (
                            user_id,
                            deposit_id,
                            amount,
                            rate,
                            earning_date
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4,
                            CURRENT_DATE
                        )
                        ON CONFLICT
                        (
                            user_id,
                            deposit_id,
                            earning_date
                        )
                        DO NOTHING
                        RETURNING id
                        `,
                        [
                            deposit.user_id,
                            deposit.id,
                            earning,
                            DAILY_RATE
                        ]
                    );

                /*
                 * Already paid today.
                 */

                if (
                    earningResult.rows.length === 0
                ) {

                    continue;

                }

                await client.query(
                    `
                    UPDATE users
                    SET
                        wallet_balance =
                            wallet_balance + $1,

                        cumulative_income =
                            cumulative_income + $1,

                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = $2
                    `,
                    [
                        earning,
                        deposit.user_id
                    ]
                );

                await client.query(
                    `
                    INSERT INTO transactions
                    (
                        user_id,
                        type,
                        amount,
                        reference_id,
                        description,
                        status
                    )
                    VALUES
                    (
                        $1,
                        'daily_income',
                        $2,
                        $3,
                        $4,
                        'completed'
                    )
                    `,
                    [
                        deposit.user_id,
                        earning,
                        deposit.id,
                        "Daily earning at 10%."
                    ]
                );

                processed++;

            }

            await client.query(
                "COMMIT"
            );

            return res.status(200).json({

                success: true,

                processed,

                rate:
                    DAILY_RATE

            });

        }

        catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            }
            catch (rollbackError) {
                console.error(
                    "FINORA EARNINGS ROLLBACK ERROR:",
                    rollbackError
                );
            }

            console.error(
                "FINORA DAILY EARNINGS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to process daily earnings."

            });

        }

        finally {

            client.release();

        }

    }
);

/* =========================================================
   USER EARNINGS
========================================================= */

app.get(
    "/api/earnings",
    requireUser,
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM earnings
                    WHERE user_id = $1
                    ORDER BY earning_date DESC, id DESC
                    `,
                    [
                        req.session.userId
                    ]
                );

            return res.status(200).json({

                success: true,

                earnings:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA EARNINGS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load earnings."

            });

        }

    }
);

/* =========================================================
   INVESTMENTS
========================================================= */

app.get(
    "/api/investments",
    requireUser,
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        d.id,
                        d.amount,
                        d.status,
                        d.created_at,

                        COALESCE(
                            SUM(e.amount),
                            0
                        ) AS total_earned

                    FROM deposits d

                    LEFT JOIN earnings e
                        ON e.deposit_id = d.id

                    WHERE d.user_id = $1

                    GROUP BY
                        d.id,
                        d.amount,
                        d.status,
                        d.created_at

                    ORDER BY
                        d.created_at DESC,
                        d.id DESC
                    `,
                    [
                        req.session.userId
                    ]
                );

            return res.status(200).json({

                success: true,

                investments:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA INVESTMENTS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load investments."

            });

        }

    }
);

/* =========================================================
   TEAM
========================================================= */

app.get(
    "/api/team",
    requireUser,
    async function (req, res) {

        try {

            const userResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        referral_code
                    FROM users
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        req.session.userId
                    ]
                );

            if (
                userResult.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User account was not found."

                });

            }

            const referralCode =
                userResult.rows[0]
                    .referral_code;

            const level1Result =
                await pool.query(
                    `
                    SELECT
                        u.id,
                        u.full_name,
                        u.phone,
                        u.account_number,
                        u.account_status,
                        u.created_at,

                        COALESCE(
                            (
                                SELECT SUM(d.amount)
                                FROM deposits d
                                WHERE d.user_id = u.id
                                  AND d.status = 'approved'
                            ),
                            0
                        ) AS deposit_amount

                    FROM users u

                    WHERE u.referred_by = $1

                    ORDER BY
                        u.created_at DESC
                    `,
                    [
                        referralCode
                    ]
                );

            const level2Result =
                await pool.query(
                    `
                    SELECT
                        u.id,
                        u.full_name,
                        u.phone,
                        u.account_number,
                        u.account_status,
                        u.created_at,

                        COALESCE(
                            (
                                SELECT SUM(d.amount)
                                FROM deposits d
                                WHERE d.user_id = u.id
                                  AND d.status = 'approved'
                            ),
                            0
                        ) AS deposit_amount

                    FROM users u

                    INNER JOIN users parent
                        ON u.referred_by =
                           parent.referral_code

                    WHERE parent.referred_by = $1

                    ORDER BY
                        u.created_at DESC
                    `,
                    [
                        referralCode
                    ]
                );

            const level3Result =
                await pool.query(
                    `
                    SELECT
                        u.id,
                        u.full_name,
                        u.phone,
                        u.account_number,
                        u.account_status,
                        u.created_at,

                        COALESCE(
                            (
                                SELECT SUM(d.amount)
                                FROM deposits d
                                WHERE d.user_id = u.id
                                  AND d.status = 'approved'
                            ),
                            0
                        ) AS deposit_amount

                    FROM users u

                    INNER JOIN users parent2
                        ON u.referred_by =
                           parent2.referral_code

                    INNER JOIN users parent1
                        ON parent2.referred_by =
                           parent1.referral_code

                    WHERE parent1.referred_by = $1

                    ORDER BY
                        u.created_at DESC
                    `,
                    [
                        referralCode
                    ]
                );

            const level1 =
                level1Result.rows;

            const level2 =
                level2Result.rows;

            const level3 =
                level3Result.rows;

            const commissionResult =
                await pool.query(
                    `
                    SELECT

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN level = 1
                                    THEN amount
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS level1_income,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN level = 2
                                    THEN amount
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS level2_income,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN level = 3
                                    THEN amount
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS level3_income,

                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total_income

                    FROM referral_commissions

                    WHERE user_id = $1
                    `,
                    [
                        req.session.userId
                    ]
                );

            const commission =
                commissionResult.rows[0];

            const team = [
                ...level1,
                ...level2,
                ...level3
            ];

            return res.status(200).json({

                success: true,

                referralCode,

                totalMembers:
                    team.length,

                totalReferralIncome:
                    Number(
                        commission.total_income || 0
                    ),

                level1Income:
                    Number(
                        commission.level1_income || 0
                    ),

                level2Income:
                    Number(
                        commission.level2_income || 0
                    ),

                level3Income:
                    Number(
                        commission.level3_income || 0
                    ),

                rates: {

                    level1:
                        LEVEL_1_RATE,

                    level2:
                        LEVEL_2_RATE,

                    level3:
                        LEVEL_3_RATE

                },

                level1,

                level2,

                level3,

                team

            });

        }

        catch (error) {

            console.error(
                "FINORA TEAM ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load team information."

            });

        }

    }
);

/* =========================================================
   REFERRAL COMMISSIONS
========================================================= */

app.get(
    "/api/referrals",
    requireUser,
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT *
                    FROM referral_commissions
                    WHERE user_id = $1
                    ORDER BY created_at DESC, id DESC
                    `,
                    [
                        req.session.userId
                    ]
                );

            return res.status(200).json({

                success: true,

                referrals:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA REFERRALS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load referral income."

            });

        }

    }
);

/* =========================================================
   TRANSACTION HISTORY
========================================================= */

app.get(
    "/api/transactions/user",
    requireUser,
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        type,
                        amount,
                        reference_id,
                        description,
                        status,
                        created_at
                    FROM transactions
                    WHERE user_id = $1
                    ORDER BY created_at DESC, id DESC
                    `,
                    [
                        req.session.userId
                    ]
                );

            return res.status(200).json({

                success: true,

                transactions:
                    result.rows

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
   TRANSACTION FILTER
========================================================= */

app.get(
    "/api/transactions/:type",
    requireUser,
    async function (req, res) {

        try {

            const type =
                String(
                    req.params.type
                ).trim().toLowerCase();

            const allowedTypes = [
                "deposit",
                "withdrawal",
                "daily_income",
                "referral",
                "bonus"
            ];

            if (
                !allowedTypes.includes(type)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid transaction type."

                });

            }

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        type,
                        amount,
                        reference_id,
                        description,
                        status,
                        created_at
                    FROM transactions
                    WHERE user_id = $1
                      AND type = $2
                    ORDER BY created_at DESC, id DESC
                    `,
                    [
                        req.session.userId,
                        type
                    ]
                );

            return res.status(200).json({

                success: true,

                transactions:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA FILTERED TRANSACTIONS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load transaction records."

            });

        }

    }
);

/* =========================================================
   ADMIN USERS
========================================================= */

app.get(
    "/api/admin/users",
    requireAdmin,
    async function (req, res) {

        try {

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
                    ORDER BY created_at DESC, id DESC
                    `
                );

            return res.status(200).json({

                success: true,

                users:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA ADMIN USERS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load users."

            });

        }

    }
);

/* =========================================================
   ADMIN USER STATUS
========================================================= */

app.patch(
    "/api/admin/users/:id/status",
    requireAdmin,
    async function (req, res) {

        try {

            const status =
                String(
                    req.body &&
                    req.body.status
                        ? req.body.status
                        : ""
                ).trim().toLowerCase();

            if (
                ![
                    "active",
                    "frozen"
                ].includes(status)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Status must be active or frozen."

                });

            }

            const result =
                await pool.query(
                    `
                    UPDATE users
                    SET
                        account_status = $1,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING
                        id,
                        full_name,
                        account_status
                    `,
                    [
                        status,
                        req.params.id
                    ]
                );

            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."

                });

            }

            return res.status(200).json({

                success: true,

                message:
                    `User account ${status}.`,

                user:
                    result.rows[0]

            });

        }

        catch (error) {

            console.error(
                "FINORA ADMIN USER STATUS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to update user status."

            });

        }

    }
);

/* =========================================================
   ADMIN SUMMARY
========================================================= */

app.get(
    "/api/admin/summary",
    requireAdmin,
    async function (req, res) {

        try {

            const users =
                await pool.query(
                    `
                    SELECT COUNT(*)::INTEGER AS count
                    FROM users
                    `
                );

            const deposits =
                await pool.query(
                    `
                    SELECT
                        COUNT(*)::INTEGER AS count,
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM deposits
                    WHERE status = 'approved'
                    `
                );

            const pendingDeposits =
                await pool.query(
                    `
                    SELECT COUNT(*)::INTEGER AS count
                    FROM deposits
                    WHERE status = 'pending'
                    `
                );

            const withdrawals =
                await pool.query(
                    `
                    SELECT
                        COUNT(*)::INTEGER AS count,
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM withdrawals
                    WHERE status = 'approved'
                    `
                );

            const pendingWithdrawals =
                await pool.query(
                    `
                    SELECT COUNT(*)::INTEGER AS count
                    FROM withdrawals
                    WHERE status = 'pending'
                    `
                );

            return res.status(200).json({

                success: true,

                summary: {

                    users:
                        Number(
                            users.rows[0].count
                        ),

                    totalDeposits:
                        Number(
                            deposits.rows[0].total
                        ),

                    approvedDepositCount:
                        Number(
                            deposits.rows[0].count
                        ),

                    pendingDeposits:
                        Number(
                            pendingDeposits.rows[0].count
                        ),

                    totalWithdrawals:
                        Number(
                            withdrawals.rows[0].total
                        ),

                    approvedWithdrawalCount:
                        Number(
                            withdrawals.rows[0].count
                        ),

                    pendingWithdrawals:
                        Number(
                            pendingWithdrawals.rows[0].count
                        )

                }

            });

        }

        catch (error) {

            console.error(
                "FINORA ADMIN SUMMARY ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load admin summary."

            });

        }

    }
);

/* =========================================================
   ADMIN LOGOUT
========================================================= */

app.post(
    "/api/admin/logout",
    requireAdmin,
    function (req, res) {

        req.session.destroy(
            function (error) {

                if (error) {

                    console.error(
                        "FINORA ADMIN LOGOUT ERROR:",
                        error
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Unable to logout."

                    });

                }

                res.clearCookie(
                    "finora.sid",
                    {
                        httpOnly: true,
                        secure: IS_PRODUCTION,
                        sameSite:
                            IS_PRODUCTION
                                ? "none"
                                : "lax"
                    }
                );

                return res.status(200).json({

                    success: true,

                    message:
                        "Admin logged out successfully."

                });

            }
        );

    }
);

/* =========================================================
   API 404
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
   GENERAL ERROR HANDLER
========================================================= */

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "FINORA SERVER ERROR:",
            error
        );

        if (
            res.headersSent
        ) {

            return next(error);

        }

        return res.status(500).json({

            success: false,

            message:
                "FINORA server error."

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

        /*
         * Create / migrate all required tables.
         */

        await createUsersTable();

        await createDepositsTable();

        await createWithdrawalsTable();

        await createEarningsTable();

        await createReferralCommissionsTable();

        await createTransactionsTable();

        await createAdminsTable();

        /*
         * Create admin only when credentials are
         * explicitly supplied in Render environment variables.
         */

        await createDefaultAdmin();

        /*
         * Verify PostgreSQL.
         */

        await pool.query(
            "SELECT 1"
        );

        console.log(
            "FINORA: PostgreSQL connection verified."
        );

        app.listen(
            PORT,
            function () {

                console.log(
                    "========================================"
                );

                console.log(
                    "FINORA BACKEND IS ONLINE"
                );

                console.log(
                    "PORT:",
                    PORT
                );

                console.log(
                    "DATABASE: PostgreSQL"
                );

                console.log(
                    "DAILY RATE:",
                    `${DAILY_RATE * 100}%`
                );

                console.log(
                    "MINIMUM DEPOSIT:",
                    MIN_DEPOSIT
                );

                console.log(
                    "MINIMUM WITHDRAWAL:",
                    MIN_WITHDRAWAL
                );

                console.log(
                    "WITHDRAWAL FEE:",
                    `${WITHDRAWAL_FEE_RATE * 100}%`
                );

                console.log(
                    "LEVEL 1 REFERRAL:",
                    `${LEVEL_1_RATE * 100}%`
                );

                console.log(
                    "LEVEL 2 REFERRAL:",
                    `${LEVEL_2_RATE * 100}%`
                );

                console.log(
                    "LEVEL 3 REFERRAL:",
                    `${LEVEL_3_RATE * 100}%`
                );

                console.log(
                    "========================================"
                );

            }
        );

    }

    catch (error) {

        console.error(
            "========================================"
        );

        console.error(
            "FINORA SERVER START ERROR"
        );

        console.error(
            error
        );

        console.error(
            "========================================"
        );

        process.exit(1);

    }

}

startServer();
