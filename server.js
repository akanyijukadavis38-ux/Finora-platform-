require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const { connectDB, mongoose } = require("./database");
const userRoutes = require("./userRoutes");

const app = express();

const PORT =
    process.env.PORT || 8080;


/* =====================================================
   RAILWAY PROXY
===================================================== */

app.set(
    "trust proxy",
    1
);


/* =====================================================
   FINORA CORS
===================================================== */

const allowedOrigins = [

    "https://finora-platform.vercel.app"

];


app.use(

    cors({

        origin: function (
            origin,
            callback
        ) {

            if (!origin) {

                return callback(
                    null,
                    true
                );
            }


            if (
                allowedOrigins.includes(
                    origin
                )
            ) {

                return callback(
                    null,
                    true
                );
            }


            console.warn(
                "⚠️ FINORA CORS blocked origin:",
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


/* =====================================================
   BODY PARSER
===================================================== */

app.use(
    express.json()
);


/* =====================================================
   SESSION
===================================================== */

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
                    7 * 24 * 60 * 60
            }),


        cookie: {

            httpOnly:
                true,

            secure:
                true,

            sameSite:
                "none",

            maxAge:
                7 * 24 * 60 * 60 * 1000
        }
    })
);


/* =====================================================
   USER ROUTES
===================================================== */

app.use(
    "/api/users",
    userRoutes
);


/* =====================================================
   CURRENT USER
   GET /api/me

   THIS IS THE ENDPOINT YOUR DASHBOARD USES.
===================================================== */

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


            const User =
                require("./user");


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


            /* =================================================
               IMPORTANT:
               EXISTING USERS WITHOUT A CODE GET ONE.
            ================================================= */

            if (
                !user.referralCode
            ) {

                const crypto =
                    require("crypto");


                let referralCode;
                let exists = true;


                while (exists) {

                    referralCode =
                        "FIN" +
                        crypto
                            .randomBytes(4)
                            .toString("hex")
                            .toUpperCase();


                    const existing =
                        await User.findOne({

                            referralCode:
                                referralCode
                        });


                    exists =
                        !!existing;
                }


                user.referralCode =
                    referralCode;


                await user.save();
            }


            /* =================================================
               RETURN DASHBOARD USER
            ================================================= */

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

                    referredBy:
                        user.referredBy || null,

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
                        user.createdAt,

                    referralIncome:
                        0,

                    referral_income:
                        0,

                    activeInvestments:
                        0,

                    active_investments:
                        0,

                    todayEarnings:
                        0,

                    today_earnings:
                        0,

                    dailyIncome:
                        0,

                    daily_income:
                        0
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


/* =====================================================
   ROOT
===================================================== */

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


/* =====================================================
   HEALTH CHECK
===================================================== */

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

            message:
                "FINORA Backend is healthy"
        });
    }
);


/* =====================================================
   404
===================================================== */

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


/* =====================================================
   ERROR HANDLER
===================================================== */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

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


/* =====================================================
   START SERVER
===================================================== */

async function startServer() {

    console.log(
        "FINORA-CURRENT-SERVER-2026"
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
                    "🔐 SESSION AUTHENTICATION ENABLED"
                );

                console.log(
                    "🔗 DASHBOARD USER ENDPOINT: /api/me"
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
            error.message
        );


        process.exit(1);
    }
}


startServer();
