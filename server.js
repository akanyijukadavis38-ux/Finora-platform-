require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const pool = require("./database");
const userRoutes = require("./userRoutes");

/* =========================================================
   FINORA SERVER
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
   TRUST PROXY
========================================================= */

if (IS_PRODUCTION) {
    app.set("trust proxy", 1);
}

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = FRONTEND_ORIGIN
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests without an Origin header
            if (!origin) {
                return callback(null, true);
            }

            /*
             * Development:
             * allow all origins when FRONTEND_ORIGIN
             * has not been configured.
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
   HEALTH CHECK
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
                "DATABASE HEALTH ERROR:",
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
   API ROOT
========================================================= */

app.get(
    "/api",
    (req, res) => {

        res.json({

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
   USER ROUTES
========================================================= */

app.use(
    "/api/users",
    userRoutes
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

        /*
         * Test database connection before
         * starting the HTTP server.
         */

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

startServer();
