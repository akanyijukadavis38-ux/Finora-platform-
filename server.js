require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const { connectDB, mongoose } = require("./database");
const userRoutes = require("./userRoutes");

const app = express();

const PORT = process.env.PORT || 8080;

/* =====================================================
   FINORA FRONTEND URL
===================================================== */

const FRONTEND_URL =
    process.env.FRONTEND_URL || "";


/* =====================================================
   CORS
===================================================== */

app.use(
    cors({
        origin: function (origin, callback) {

            /*
               Allow requests without an Origin header.
               Useful for health checks and server-to-server
               requests.
            */

            if (!origin) {
                return callback(null, true);
            }


            /*
               FRONTEND_URL must be configured on Railway.

               Example:

               FRONTEND_URL=https://your-finora-frontend.com
            */

            if (
                FRONTEND_URL &&
                origin === FRONTEND_URL
            ) {

                return callback(null, true);
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

        credentials: true
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

        name: "finora.sid",

        secret:
            process.env.SESSION_SECRET ||
            "FINORA_CHANGE_THIS_SESSION_SECRET",

        resave: false,

        saveUninitialized: false,

        store: MongoStore.create({

            mongoUrl:
                process.env.MONGODB_URI,

            collectionName:
                "finora_sessions",

            ttl:
                7 * 24 * 60 * 60
        }),

        cookie: {

            httpOnly: true,

            secure:
                process.env.NODE_ENV === "production",

            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",

            maxAge:
                7 * 24 * 60 * 60 * 1000
        }
    })
);


/* =====================================================
   API ROUTES
===================================================== */

app.use(
    "/api/users",
    userRoutes
);


/* =====================================================
   ROOT
===================================================== */

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        application: "FINORA",

        message:
            "FINORA Backend Running Successfully"
    });
});


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/health", (req, res) => {

    res.status(200).json({

        success: true,

        status: "ok",

        database:
            mongoose.connection.readyState === 1
                ? "connected"
                : "disconnected",

        message:
            "FINORA Backend is healthy"
    });
});


/* =====================================================
   404 HANDLER
===================================================== */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            "FINORA API endpoint not found.",

        path:
            req.originalUrl
    });
});


/* =====================================================
   ERROR HANDLER
===================================================== */

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

                success: false,

                message:
                    "FINORA CORS rejected this request."
            });
        }


        return res.status(500).json({

            success: false,

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
