require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const { connectDB, mongoose } = require("./database");
const User = require("./user");
const userRoutes = require("./userRoutes");

const app = express();

const PORT = process.env.PORT || 8080;


/* =========================================================
   FINORA PRODUCTION CONFIGURATION
========================================================= */

const FRONTEND_URL =
    "https://finora-platform.vercel.app";


const allowedOrigins = [
    FRONTEND_URL
];


/* =========================================================
   RAILWAY / PROXY
========================================================= */

/*
   Railway sits behind a proxy.

   This is important because FINORA uses:
   secure: true
   cookies in production.

   Without trust proxy, Express may not correctly
   recognize the HTTPS connection through Railway.
*/

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

            /*
               Allow requests without an Origin header.
               Useful for health checks and direct API calls.
            */

            if (!origin) {
                return callback(null, true);
            }


            /*
               Allow only the official FINORA frontend.
            */

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

/*
   IMPORTANT:

   Vercel frontend:
   https://finora-platform.vercel.app

   Railway backend:
   https://finora-platform-production.up.railway.app

   These are different sites.

   Therefore production requires:

   secure: true
   sameSite: "none"
*/

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
