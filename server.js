require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const { connectDB, mongoose } = require("./database");
const User = require("./user");
const userRoutes = require("./userRoutes");
const investmentRoutes = require("./investmentRoutes");
const depositRoutes = require("./depositRoutes");
const transactionRoutes = require("./TransactionRoutes");
const withdrawalRoutes = require("./WithdrawalRoutes");
const supportRoutes = require("./supportRoutes");
const notificationRoutes = require("./notificationRoutes");
const {
    processDueInvestmentEarnings
} = require("./investmentEarningProcessor");
const adminRoutes = require("./adminRoutes");
const requireAdmin = require("./adminAuth");
const path = require("path");

const app = express();

const PORT =
    process.env.PORT ||
    8080;


/* =========================================================
   FINORA PRODUCTION CONFIGURATION
========================================================= */

const FRONTEND_URL =
    "https://finora-platform.pages.dev";

const allowedOrigins = [
    "https://finora-platform.pages.dev",
    "https://finora-platform.onrender.com"
];


/* =========================================================
   RAILWAY / PROXY
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

        origin: function(origin, callback) {

            if (!origin) {
                return callback(null, true);
            }

            if (
                allowedOrigins.includes(origin)
            ) {

                return callback(
                    null,
                    true
                );
            }

            console.warn(
                "⚠️ FINORA CORS BLOCKED:",
                origin
            );

            return callback(
                new Error(
                    "Not allowed by FINORA CORS"
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
            "Accept"
        ]
    })
);


/* =========================================================
   BODY PARSER
========================================================= */

app.use(
    express.json()
);


/* =========================================================
   SESSION
========================================================= */

app.use(
    session({

        name:
            "finora.sid",

        secret:
            process.env.SESSION_SECRET ||
            "FINORA_CHANGE_THIS_SESSION_SECRET",

        resave:
            false,

        saveUninitialized:
            false,

        store:
            MongoStore.create({

                mongoUrl:
                    process.env.MONGODB_URI,

                collectionName:
                    "finora_sessions",

                ttl:
                    7 * 24 * 60 * 60,

                autoRemove:
                    "native"
            }),

        cookie: {

            httpOnly:
                true,

            secure:
                true,

            sameSite:
                "none",

            path:
                "/",

            maxAge:
                7 * 24 * 60 * 60 * 1000
        }
    })
);


/* =========================================================
   USER ROUTES
========================================================= */

app.use(
    "/api/users",
    userRoutes
);


/* =========================================================
   INVEST ROUTES
========================================================= */

app.use(
    "/api/investments",
    investmentRoutes
);


/* =========================================================
   DEPOSIT ROUTES
========================================================= */

app.use(
    "/api/deposits",
    depositRoutes
);


/* =========================================================
   TRANSACTION / RECORDS ROUTES

   Used by:
   1. Dashboard Recent Transactions
   2. Records / Transaction History

   Both read from the same Transaction model.
========================================================= */

app.use(
    "/api/transactions",
    transactionRoutes
);


/* =========================================================
   WITHDRAWAL ROUTES
========================================================= */

app.use(
    "/api/withdrawals",
    withdrawalRoutes
);
/* =========================================================
   SUPPORT ROUTES
========================================================= */

app.use(
    "/api/support",
    supportRoutes
);
/* =========================================================
   NOTIFICATION ROUTES
========================================================= */

app.use(
    "/api/notifications",
    notificationRoutes
);
app.use(
    "/api/admin",
    adminRoutes
);
app.get(
    "/admin-login.html",
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin-login.html")
        );
    }
);

app.get(
    "/admin-login.css",
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin-login.css")
        );
    }
);

app.get(
    "/admin.html",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin.html")
        );
    }
);
app.get(
    "/admin.css",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin.css")
        );
    }
);

app.get(
    "/admin.js",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin.js")
        );
    }
);
app.get(
    "/admin-forgot-password.html",
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "admin-forgot-password.html"
            )
        );
    }
);

app.get(
    "/admin-forgot-password.css",
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "admin-forgot-password.css"
            )
        );
    }
);
app.get(
    "/admin-setup.html",
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "admin-setup.html"
            )
        );
    }
);
/* =========================================================
   FINORA ADMIN PAGES
========================================================= */

app.get(
    "/admin-users.html",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin-users.html")
        );
    }
);

app.get(
    "/admin-finance.html",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin-finance.html")
        );
    }
);

app.get(
    "/admin-records.html",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin-records.html")
        );
    }
);

app.get(
    "/admin-referrals.html",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin-referrals.html")
        );
    }
);

app.get(
    "/admin-communications.html",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin-communications.html")
        );
    }
);

app.get(
    "/admin-system.html",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin-system.html")
        );
    }
);

app.get(
    "/admin-account.html",
    requireAdmin,
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "admin-account.html")
        );
    }
);

/* =========================================================
   CURRENT USER

   GET /api/me

   Kept as a compatibility endpoint.

   The dashboard currently uses:
   GET /api/users/me
========================================================= */

app.get(
    "/api/me",
    async (req, res) => {

        try {

            if (
                !req.session ||
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "No authenticated FINORA session."
                });
            }


            const user =
                await User.findById(
                    req.session.userId
                ).select("-password");


            if (!user) {

                req.session.destroy(
                    () => {}
                );


                return res.status(401).json({

                    success:
                        false,

                    message:
                        "FINORA user account could not be found."
                });
            }


            if (
                user.status === "frozen"
            ) {

                req.session.destroy(
                    () => {}
                );


                return res.status(403).json({

                    success:
                        false,

                    message:
                        "Your FINORA account has been frozen."
                });
            }


            /*
               Existing users created before the automatic
               referral-code system may not have a code.

               Saving here allows the User model's
               pre-validation hook to generate one.
            */

            if (
                !user.referralCode
            ) {

                await user.save();
            }


            return res.status(200).json({

                success:
                    true,

                user: {

                    id:
                        user._id,

                    fullName:
                        user.fullName,

                    full_name:
                        user.fullName,

                    phone:
                        user.phone,

                    email:
                        user.email,

                    referralCode:
                        user.referralCode,

                    referral_code:
                        user.referralCode,

                    referredByCode:
                        user.referredByCode || null,

                    referred_by_code:
                        user.referredByCode || null,

                    balance:
                        user.balance,

                    walletBalance:
                        user.balance,

                    wallet_balance:
                        user.balance,

                    totalIncome:
                        user.totalIncome,

                    totalEarnings:
                        user.totalIncome,

                    total_earnings:
                        user.totalIncome,

                    totalDeposit:
                        user.totalDeposit,

                    totalInvested:
                        user.totalDeposit,

                    total_invested:
                        user.totalDeposit,

                    totalWithdrawal:
                        user.totalWithdrawal,

                    status:
                        user.status,

                    createdAt:
                        user.createdAt
                }
            });

        } catch (error) {

            console.error(
                "❌ FINORA /api/me ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not load your account."
            });
        }
    }
);


/* =========================================================
   ROOT
========================================================= */

app.get(
    "/",
    (req, res) => {

        res.status(200).json({

            success:
                true,

            application:
                "FINORA",

            message:
                "FINORA Backend Running Successfully"
        });
    }
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/health",
    (req, res) => {

        res.status(200).json({

            success:
                true,

            status:
                "ok",

            database:
                mongoose.connection.readyState === 1
                    ? "connected"
                    : "disconnected",

            session:
                "enabled",

            message:
                "FINORA Backend is healthy"
        });
    }
);


/* =========================================================
   404 HANDLER
========================================================= */

app.use(
    (req, res) => {

        res.status(404).json({

            success:
                false,

            message:
                "FINORA API endpoint not found.",

            path:
                req.originalUrl
        });
    }
);


/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
    (error, req, res, next) => {

        console.error(
            "❌ FINORA SERVER ERROR:",
            error
        );


        if (
            error.message ===
            "Not allowed by FINORA CORS"
        ) {

            return res.status(403).json({

                success:
                    false,

                message:
                    "FINORA CORS rejected this request."
            });
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
   AUTOMATIC DAILY EARNING ENGINE
========================================================= */

let earningProcessorRunning =
    false;


async function runDailyEarningProcessor() {

    if (
        earningProcessorRunning
    ) {

        return;
    }


    earningProcessorRunning =
        true;


    try {

        const result =
            await processDueInvestmentEarnings();


        if (
            result &&
            result.processed > 0
        ) {

            console.log(
                "💰 FINORA DAILY EARNINGS:",
                `checked=${result.checked}`,
                `processed=${result.processed}`
            );

        }

    } catch (error) {

        console.error(
            "❌ FINORA DAILY EARNING ENGINE ERROR:",
            error
        );

    } finally {

        earningProcessorRunning =
            false;
    }
}


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

    console.log(
        "================================="
    );

    console.log(
        "FINORA-CURRENT-SERVER-2026"
    );

    console.log(
        "================================="
    );


    try {

        await connectDB();


        /* =====================================================
           REMOVE OBSOLETE MONGODB INDEX
        ===================================================== */

        try {

            await mongoose.connection
                .collection("users")
                .dropIndex("accountNumber_1");

            console.log(
                "✅ FINORA: Removed obsolete accountNumber_1 index"
            );

        } catch (indexError) {

            if (
                indexError.codeName ===
                "IndexNotFound"
            ) {

                console.log(
                    "ℹ️ FINORA: accountNumber_1 index already removed"
                );

            } else {

                console.error(
                    "⚠️ FINORA: Could not remove accountNumber_1 index:",
                    indexError.message
                );
            }
        }


        /* =====================================================
           START DAILY EARNING ENGINE
        ===================================================== */

        console.log(
            "💰 FINORA: Starting automatic daily earning engine..."
        );


        /*
           Run immediately after the database connection is
           ready. This also catches investments that became
           due while the server was restarting.
        */

        await runDailyEarningProcessor();


        /*
           Continue checking once every minute.

           The processor itself decides whether an investment
           is actually due. It does NOT pay an earning merely
           because this timer runs.
        */

        setInterval(
            runDailyEarningProcessor,
            60 * 1000
        );


        console.log(
            "✅ FINORA: Automatic daily earning engine enabled"
        );


        /* =====================================================
           START HTTP SERVER
        ===================================================== */

        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    "================================="
                );

                console.log(
                    "🚀 FINORA BACKEND STARTED"
                );

                console.log(
                    "🚀 PORT:",
                    PORT
                );

                console.log(
                    "🌐 FRONTEND:",
                    FRONTEND_URL
                );

                console.log(
                    "🔐 SESSION AUTHENTICATION ENABLED"
                );

                console.log(
                    "🍪 CROSS-SITE SECURE COOKIE ENABLED"
                );

                console.log(
                    "💰 DAILY EARNINGS ENGINE ENABLED"
                );

                console.log(
                    "================================="
                );
            }
        );

    } catch (error) {

        console.error(
            "❌ FINORA SERVER START FAILED"
        );

        console.error(
            error
        );

        process.exit(1);
    }
}


startServer();
