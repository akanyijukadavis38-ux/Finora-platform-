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

const PORT =
    process.env.PORT || 10000;

const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || true;

/* =========================================================
   FINORA BUSINESS RULES
========================================================= */

const MIN_DEPOSIT =
    10000;

const MIN_WITHDRAWAL =
    4000;

const DAILY_RATE =
    0.10;

const WITHDRAWAL_FEE_RATE =
    0.15;

const MAX_WITHDRAWALS_PER_DAY =
    2;

const LEVEL_1_RATE =
    0.15;

const LEVEL_2_RATE =
    0.05;

const LEVEL_3_RATE =
    0.02;


/* =========================================================
   TRUST PROXY
========================================================= */

app.set(
    "trust proxy",
    1
);


/* =========================================================
   CORS
========================================================= */

app.use(
    cors({

        origin:
            FRONTEND_ORIGIN,

        credentials:
            true

    })
);


/* =========================================================
   REQUEST BODY PARSING
========================================================= */

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

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            httpOnly:
                true,

            secure:
                true,

            sameSite:
                "none",

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
   STATIC FINORA FRONTEND
========================================================= */

app.use(
    express.static(__dirname)
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


app.get(
    "/transactions.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "transactions.html"
            )
        );

    }
);


app.get(
    "/deposit.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "deposit.html"
            )
        );

    }
);


app.get(
    "/withdraw.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "withdraw.html"
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

        return res.status(200).json({

            success:
                true,

            platform:
                "FINORA",

            status:
                "online",

            message:
                "FINORA backend is running."

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


            return res.status(200).json({

                success:
                    true,

                platform:
                    "FINORA",

                database:
                    "connected",

                status:
                    "healthy"

            });

        }

        catch (error) {

            console.error(
                "FINORA DATABASE HEALTH ERROR:",
                error.message
            );


            return res.status(500).json({

                success:
                    false,

                platform:
                    "FINORA",

                database:
                    "disconnected",

                status:
                    "unhealthy"

            });

        }

    }
);


/* =========================================================
   DATABASE TABLES
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
            Math.random() * 90000000
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

                    success:
                        false,

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

                    success:
                        false,

                    message:
                        "Passwords do not match."

                });

            }


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


            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(cleanEmail)
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Please enter a valid email address."

                });

            }


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


            let referredBy =
                null;


            if (
                cleanReferral
            ) {

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

                        success:
                            false,

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
                    10
                );


            let newReferralCode;


            while (true) {

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


                if (
                    check.rows.length === 0
                ) {

                    break;

                }

            }


            let accountNumber;


            while (true) {

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


                if (
                    check.rows.length === 0
                ) {

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
                        account_number
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7
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
========================================================= */

app.post(
    "/api/login",
    async function (req, res) {

        try {

            const {
                identifier,
                password
            } = req.body || {};


            if (
                !identifier ||
                !password
            ) {

                return res.status(400).json({

                    success:
                        false,

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

                    success:
                        false,

                    message:
                        "Invalid phone/email or password."

                });

            }


            const user =
                result.rows[0];


            if (
                user.account_status !==
                "active"
            ) {

                return res.status(403).json({

                    success:
                        false,

                    message:
                        "Your FINORA account is currently unavailable. Please contact support."

                });

            }


            const passwordMatch =
                await bcrypt.compare(
                    String(password),
                    user.password_hash
                );


            if (!passwordMatch) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Invalid phone/email or password."

                });

            }


            req.session.userId =
                user.id;


            req.session.save(
                function (sessionError) {

                    if (sessionError) {

                        console.error(
                            "FINORA SESSION SAVE ERROR:",
                            sessionError
                        );

                        return res.status(500).json({

                            success:
                                false,

                            message:
                                "Login session could not be created."

                        });

                    }


                    return res.status(200).json({

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

                success:
                    false,

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

                success:
                    false,

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
                function () {}
            );


            return res.status(404).json({

                success:
                    false,

                message:
                    "User account was not found."

            });

        }


        const user =
            result.rows[0];
let accountNumber =
    user.account_number;


if (!accountNumber) {

    while (true) {

        const newAccountNumber =
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
                    newAccountNumber
                ]
            );

        if (
            check.rows.length === 0
        ) {

            accountNumber =
                newAccountNumber;

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

            success:
                false,

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


/* =========================================================
   PROFILE
========================================================= */

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

                        success:
                            false,

                        message:
                            "Unable to logout."

                    });

                }


                res.clearCookie(
                    "connect.sid",
                    {
                        httpOnly:
                            true,

                        secure:
                            true,

                        sameSite:
                            "none"
                    }
                );


                return res.status(200).json({

                    success:
                        true,

                    message:
                        "Logged out successfully."

                });

            }
        );

    }
);


/* =========================================================
   AUTHENTICATION HELPER
========================================================= */

function requireUser(
    req,
    res,
    next
) {

    if (
        !req.session ||
        !req.session.userId
    ) {

        return res.status(401).json({

            success:
                false,

            message:
                "User is not logged in."

        });

    }


    next();

}


/* =========================================================
   DEPOSIT
========================================================= */

app.post(
    "/api/deposits",
    requireUser,
    async function (req, res) {

        try {

            const {
                amount,
                method,
                transactionReference
            } = req.body || {};


            const depositAmount =
                Number(amount);


            if (
                !Number.isFinite(
                    depositAmount
                ) ||
                depositAmount <= 0
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Enter a valid deposit amount."

                });

            }


            if (
                depositAmount <
                MIN_DEPOSIT
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        `Minimum deposit is UGX ${MIN_DEPOSIT}.`

                });

            }


            const result =
                await pool.query(
                    `
                    INSERT INTO deposits
                    (
                        user_id,
                        amount,
                        method,
                        transaction_reference
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4
                    )

                    RETURNING *
                    `,
                    [
                        req.session.userId,
                        depositAmount,
                        method || null,
                        transactionReference || null
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
                    depositAmount,
                    deposit.id,
                    "Deposit submitted for approval."
                ]
            );


            return res.status(201).json({

                success:
                    true,

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

                success:
                    false,

                message:
                    "Unable to submit deposit."

            });

        }

    }
);


/* =========================================================
   USER DEPOSIT HISTORY
========================================================= */

app.get(
    "/api/deposits",
    requireUser,
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        *
                    FROM deposits
                    WHERE user_id = $1
                    ORDER BY created_at DESC
                    `,
                    [
                        req.session.userId
                    ]
                );


            return res.status(200).json({

                success:
                    true,

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

                success:
                    false,

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

        if (
            !referralCode
        ) {

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
            Number(
                deposit.amount
            ) *
            item.rate;


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
   ADMIN DEPOSIT APPROVAL
========================================================= */

app.post(
    "/api/admin/deposits/:id/approve",
    requireUser,
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

                    success:
                        false,

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

                    success:
                        false,

                    message:
                        "This deposit has already been processed."

                });

            }


            await client.query(
                `
                UPDATE deposits
                SET
                    status = 'approved',
                    approved_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                `,
                [
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
                    description = 'Deposit approved.'
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

                success:
                    true,

                message:
                    "Deposit approved successfully."

            });

        }

        catch (error) {

            await client.query(
                "ROLLBACK"
            );


            console.error(
                "FINORA DEPOSIT APPROVAL ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

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
   ADMIN DEPOSIT REJECTION
========================================================= */

app.post(
    "/api/admin/deposits/:id/reject",
    requireUser,
    async function (req, res) {

        try {

            const reason =
                req.body &&
                req.body.reason
                    ? String(
                        req.body.reason
                    ).trim()
                    : "Deposit rejected.";


            const result =
                await pool.query(
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
                        reason,
                        req.params.id
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Pending deposit not found."

                });

            }


            await pool.query(
                `
                UPDATE transactions
                SET
                    status = 'rejected',
                    description = $1
                WHERE reference_id = $2
                  AND type = 'deposit'
                `,
                [
                    reason,
                    req.params.id
                ]
            );


            return res.status(200).json({

                success:
                    true,

                message:
                    "Deposit rejected."

            });

        }

        catch (error) {

            console.error(
                "FINORA DEPOSIT REJECTION ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to reject deposit."

            });

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

            const {
                amount,
                method,
                phone
            } = req.body || {};


            const withdrawalAmount =
                Number(amount);


            if (
                !Number.isFinite(
                    withdrawalAmount
                ) ||
                withdrawalAmount <= 0
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Enter a valid withdrawal amount."

                });

            }


            if (
                withdrawalAmount <
                MIN_WITHDRAWAL
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        `Minimum withdrawal is UGX ${MIN_WITHDRAWAL}.`

                });

            }


            const countResult =
                await client.query(
                    `
                    SELECT COUNT(*)::INTEGER AS count
                    FROM withdrawals
                    WHERE user_id = $1
                      AND created_at >= CURRENT_DATE
                      AND created_at < CURRENT_DATE + INTERVAL '1 day'
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

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "You have reached the maximum of 2 withdrawals for today."

                });

            }


            const userResult =
                await client.query(
                    `
                    SELECT
                        wallet_balance
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

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "User account was not found."

                });

            }


            const walletBalance =
                Number(
                    userResult.rows[0]
                        .wallet_balance
                );


            if (
                walletBalance <
                withdrawalAmount
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Insufficient wallet balance."

                });

            }


            const fee =
                withdrawalAmount *
                WITHDRAWAL_FEE_RATE;


            const netAmount =
                withdrawalAmount -
                fee;


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
                        phone
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

                    RETURNING *
                    `,
                    [
                        req.session.userId,
                        withdrawalAmount,
                        fee,
                        netAmount,
                        method || null,
                        phone || null
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
                    withdrawalAmount,
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
                    withdrawalAmount,
                    withdrawal.id,
                    `Withdrawal request. Fee: UGX ${fee.toFixed(2)}`
                ]
            );


            await client.query(
                "COMMIT"
            );


            return res.status(201).json({

                success:
                    true,

                message:
                    "Withdrawal request submitted successfully.",

                withdrawal: {

                    id:
                        withdrawal.id,

                    amount:
                        withdrawal.amount,

                    fee:
                        withdrawal.fee,

                    netAmount:
                        withdrawal.net_amount,

                    status:
                        withdrawal.status

                }

            });

        }

        catch (error) {

            await client.query(
                "ROLLBACK"
            );


            console.error(
                "FINORA WITHDRAWAL ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

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
   USER WITHDRAWAL HISTORY
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
                    ORDER BY created_at DESC
                    `,
                    [
                        req.session.userId
                    ]
                );


            return res.status(200).json({

                success:
                    true,

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

                success:
                    false,

                message:
                    "Unable to load withdrawals."

            });

        }

    }
);


/* =========================================================
   DAILY EARNINGS
========================================================= */

app.post(
    "/api/earnings/process",
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
                    WHERE d.status = 'approved'
                    `
                );


            let processed =
                0;


            for (
                const deposit
                of depositsResult.rows
            ) {

                const earning =
                    Number(
                        deposit.amount
                    ) *
                    DAILY_RATE;


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

                success:
                    true,

                processed

            });

        }

        catch (error) {

            await client.query(
                "ROLLBACK"
            );


            console.error(
                "FINORA DAILY EARNINGS ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

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
                    SELECT
                        *
                    FROM earnings
                    WHERE user_id = $1
                    ORDER BY created_at DESC
                    `,
                    [
                        req.session.userId
                    ]
                );


            return res.status(200).json({

                success:
                    true,

                earnings:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA EARNINGS HISTORY ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load earnings."

            });

        }

    }
);


/* =========================================================
   INVESTMENTS / ACTIVE EARNING RECORDS
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
                        d.created_at DESC
                    `,
                    [
                        req.session.userId
                    ]
                );


            return res.status(200).json({

                success:
                    true,

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

                success:
                    false,

                message:
                    "Unable to load investments."

            });

        }

    }
);


/* =========================================================
   TEAM / REFERRALS
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

                    success:
                        false,

                    message:
                        "User account was not found."

                });

            }


            const referralCode =
                userResult.rows[0]
                    .referral_code;


            const teamResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        full_name,
                        phone,
                        account_number,
                        created_at
                    FROM users
                    WHERE referred_by = $1
                    ORDER BY created_at DESC
                    `,
                    [
                        referralCode
                    ]
                );


            const commissionResult =
                await pool.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM referral_commissions
                    WHERE user_id = $1
                    `,
                    [
                        req.session.userId
                    ]
                );


            return res.status(200).json({

                success:
                    true,

                referralCode,

                team:
                    teamResult.rows,

                totalReferralIncome:
                    commissionResult.rows[0]
                        .total

            });

        }

        catch (error) {

            console.error(
                "FINORA TEAM ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

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
                    SELECT
                        *
                    FROM referral_commissions
                    WHERE user_id = $1
                    ORDER BY created_at DESC
                    `,
                    [
                        req.session.userId
                    ]
                );


            return res.status(200).json({

                success:
                    true,

                referrals:
                    result.rows

            });

        }

        catch (error) {

            console.error(
                "FINORA REFERRAL ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

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

                success:
                    true,

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

                success:
                    false,

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
                ).trim();


            const allowedTypes = [
                "deposit",
                "withdrawal",
                "daily_income",
                "referral",
                "bonus"
            ];


            if (
                !allowedTypes.includes(
                    type
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

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

                success:
                    true,

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

                success:
                    false,

                message:
                    "Unable to load transaction records."

            });

        }

    }
);


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

                    success:
                        false,

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
                        String(
                            username
                        ).trim()
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({

                    success:
                        false,

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

                    success:
                        false,

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

                    success:
                        false,

                    message:
                        "Invalid admin credentials."

                });

            }


            req.session.adminId =
                admin.id;


            return res.status(200).json({

                success:
                    true,

                message:
                    "Admin login successful."

            });

        }

        catch (error) {

            console.error(
                "FINORA ADMIN LOGIN ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to login as administrator."

            });

        }

    }
);


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

function requireAdmin(
    req,
    res,
    next
) {

    if (
        !req.session ||
        !req.session.adminId
    ) {

        return res.status(401).json({

            success:
                false,

            message:
                "Administrator authentication required."

        });

    }


    next();

}


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

                    ORDER BY
                        d.created_at ASC
                    `
                );


            return res.status(200).json({

                success:
                    true,

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

                success:
                    false,

                message:
                    "Unable to load pending deposits."

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

                    ORDER BY
                        w.created_at ASC
                    `
                );


            return res.status(200).json({

                success:
                    true,

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

                success:
                    false,

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

                    success:
                        false,

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

                    success:
                        false,

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
                    description = 'Withdrawal approved.'
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

                success:
                    true,

                message:
                    "Withdrawal approved successfully."

            });

        }

        catch (error) {

            await client.query(
                "ROLLBACK"
            );


            console.error(
                "FINORA APPROVE WITHDRAWAL ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

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

                    success:
                        false,

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

                    success:
                        false,

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


            await client.query(
                `
                UPDATE withdrawals
                SET
                    status = 'rejected',
                    rejected_reason = $1,
                    updated_at = CURRENT_TIMESTAMP
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

                success:
                    true,

                message:
                    "Withdrawal rejected and wallet amount restored."

            });

        }

        catch (error) {

            await client.query(
                "ROLLBACK"
            );


            console.error(
                "FINORA REJECT WITHDRAWAL ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

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
                    ORDER BY created_at DESC
                    `
                );


            return res.status(200).json({

                success:
                    true,

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

                success:
                    false,

                message:
                    "Unable to load users."

            });

        }

    }
);


/* =========================================================
   ADMIN FREEZE / ACTIVATE USER
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
                ).trim();


            if (
                ![
                    "active",
                    "frozen"
                ].includes(status)
            ) {

                return res.status(400).json({

                    success:
                        false,

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
                        updated_at = CURRENT_TIMESTAMP
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

                    success:
                        false,

                    message:
                        "User not found."

                });

            }


            return res.status(200).json({

                success:
                    true,

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

                success:
                    false,

                message:
                    "Unable to update user status."

            });

        }

    }
);


/* =========================================================
   ADMIN DASHBOARD SUMMARY
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

                success:
                    true,

                summary: {

                    users:
                        users.rows[0].count,

                    totalDeposits:
                        deposits.rows[0].total,

                    approvedDepositCount:
                        deposits.rows[0].count,

                    pendingDeposits:
                        pendingDeposits.rows[0].count,

                    totalWithdrawals:
                        withdrawals.rows[0].total,

                    approvedWithdrawalCount:
                        withdrawals.rows[0].count,

                    pendingWithdrawals:
                        pendingWithdrawals.rows[0].count

                }

            });

        }

        catch (error) {

            console.error(
                "FINORA ADMIN SUMMARY ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

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

        delete req.session.adminId;


        return res.status(200).json({

            success:
                true,

            message:
                "Admin logged out successfully."

        });

    }
);


/* =========================================================
   API 404 HANDLER
========================================================= */

app.use(
    "/api",
    function (req, res) {

        return res.status(404).json({

            success:
                false,

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

            return next(
                error
            );

        }


        return res.status(500).json({

            success:
                false,

            message:
                "FINORA server error."

        });

    }
);


/* =========================================================
   START FINORA SERVER
========================================================= */

async function startServer() {

    try {

        console.log(
            "FINORA: Starting server..."
        );


        /* -----------------------------------------
           CREATE DATABASE TABLES
        ----------------------------------------- */

        await createUsersTable();

        await createDepositsTable();

        await createWithdrawalsTable();

        await createEarningsTable();

        await createReferralCommissionsTable();

        await createTransactionsTable();

        await createAdminsTable();


        /* -----------------------------------------
           VERIFY DATABASE
        ----------------------------------------- */

        await pool.query(
            "SELECT 1"
        );


        console.log(
            "FINORA: PostgreSQL connection verified."
        );


        /* -----------------------------------------
           START EXPRESS SERVER
        ----------------------------------------- */

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
                    "DAILY RATE: 10%"
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
                    "WITHDRAWAL FEE: 14%"
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


        process.exit(
            1
        );

    }

}


startServer();
