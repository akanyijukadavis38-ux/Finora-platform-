require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const { connectDB, mongoose } =
    require("./database");

const userRoutes =
    require("./userRoutes");


const app = express();

const PORT =
    process.env.PORT || 8080;


/* =========================================================
   FINORA SERVER IDENTIFICATION
========================================================= */

console.log(
    "FINORA-CURRENT-SERVER-2026-AUTH-FIX"
);


/* =========================================================
   RAILWAY / PROXY CONFIGURATION

   Required because Railway sits behind a proxy and
   FINORA uses secure cross-site session cookies.
========================================================= */

app.set(
    "trust proxy",
    1
);


/* =========================================================
   FINORA CORS
========================================================= */

const allowedOrigins = [

    "https://finora-platform.vercel.app"

];


app.use(
    cors({

        origin: function (
            origin,
            callback
        ) {

            /* =============================================
               Requests without Origin
            ============================================= */

            if (!origin) {

                return callback(
                    null,
                    true
                );
            }


            /* =============================================
               Official FINORA frontend
            ============================================= */

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

        /* =============================================
           COOKIE NAME
        ============================================= */

        name:
            "finora.sid",


        /* =============================================
           SECRET
        ============================================= */

        secret:
            process.env.SESSION_SECRET ||
            "FINORA_CHANGE_THIS_SESSION_SECRET",


        /* =============================================
           SESSION SAVE OPTIONS
        ============================================= */

        resave:
            false,


        saveUninitialized:
            false,


        /* =============================================
           MONGODB SESSION STORE
        ============================================= */

        store:
            MongoStore.create({

                mongoUrl:
                    process.env.MONGODB_URI,

                collectionName:
                    "finora_sessions",

                ttl:
                    7 * 24 * 60 * 60

            }),


        /* =============================================
           COOKIE
           
           Vercel frontend:
           finora-platform.vercel.app

           Railway backend:
           finora-platform-production.up.railway.app

           These are cross-site, so SameSite=None
           and Secure are required.
        ============================================= */

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


/* =========================================================
   USER ROUTES
========================================================= */

app.use(
    "/api/users",
    userRoutes
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
                "FINORA Backend Running Successfully",

            version:
                "AUTH-FIX-2026"

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


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

    try {

        console.log(
            "=========================================="
        );

        console.log(
            "🚀 FINORA BACKEND STARTING"
        );

        console.log(
            "=========================================="
        );


        /* =============================================
           CONNECT MONGODB
        ============================================= */

        await connectDB();


        console.log(
            "✅ FINORA DATABASE CONNECTED"
        );


        /* =============================================
           START EXPRESS
        ============================================= */

        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    "=========================================="
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
                    "🍪 CROSS-SITE SECURE COOKIE ENABLED"
                );

                console.log(
                    "🌐 FRONTEND:",
                    "https://finora-platform.vercel.app"
                );

                console.log(
                    "=========================================="
                );
            }
        );


    } catch (error) {

        console.error(
            "=========================================="
        );

        console.error(
            "❌ FINORA SERVER START FAILED"
        );

        console.error(
            error
        );

        console.error(
            "=========================================="
        );


        process.exit(1);
    }
}


startServer();
