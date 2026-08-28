require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const userRoutes = require("./userRoutes");
const { connectDB } = require("./database");

const app = express();

const PORT = Number(process.env.PORT) || 8080;


/* =========================================================
   FINORA ALLOWED FRONTEND
========================================================= */

const allowedOrigin =
    "https://finora-platform-q56zx1xzc-akanyijukadavis38-1583s-projects.vercel.app";


/* =========================================================
   CORS
========================================================= */

app.use((req, res, next) => {

    const origin = req.headers.origin;

    if (origin === allowedOrigin) {

        res.header(
            "Access-Control-Allow-Origin",
            origin
        );

        res.header(
            "Access-Control-Allow-Credentials",
            "true"
        );
    }

    res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );

    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    if (req.method === "OPTIONS") {

        return res.sendStatus(204);
    }

    next();
});


/* =========================================================
   EXPRESS BODY PARSING
========================================================= */

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================================
   BASIC SERVER TEST
========================================================= */

app.get("/", (req, res) => {

    return res.json({

        success: true,

        application: "FINORA",

        message: "FINORA server is running.",

        version: "1.0.0"

    });
});


/* =========================================================
   API TEST
========================================================= */

app.get("/api", (req, res) => {

    return res.json({

        success: true,

        application: "FINORA",

        message: "FINORA API is running.",

        version: "1.0.0"

    });
});


/* =========================================================
   DATABASE HEALTH TEST
========================================================= */

app.get("/api/health", (req, res) => {

    try {

        const state =
            mongoose.connection.readyState;

        if (state === 1) {

            return res.json({

                success: true,

                server: "connected",

                database: "connected",

                databaseType: "MongoDB",

                message:
                    "FINORA MongoDB database is connected."

            });
        }

        return res.status(503).json({

            success: false,

            server: "connected",

            database: "disconnected",

            databaseType: "MongoDB",

            message:
                "FINORA MongoDB database is not connected."

        });

    } catch (error) {

        console.error(
            "FINORA DATABASE HEALTH ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            server: "connected",

            database: "disconnected",

            databaseType: "MongoDB",

            message:
                error.message

        });
    }
});


/* =========================================================
   FINORA USER ROUTES
========================================================= */

app.use(
    "/api/users",
    userRoutes
);


/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {

    return res.status(404).json({

        success: false,

        message:
            "FINORA endpoint not found.",

        method:
            req.method,

        path:
            req.originalUrl

    });
});


/* =========================================================
   SERVER START
========================================================= */

async function startServer() {

    try {

        console.log(
            "🔥 FINORA SERVER STARTING..."
        );

        console.log(
            "🔥 Connecting to MongoDB..."
        );

        await connectDB();

        console.log(
            "✅ FINORA MongoDB connection successful"
        );


        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    "=============================================="
                );

                console.log(
                    `🚀 FINORA SERVER RUNNING ON PORT ${PORT}`
                );

                console.log(
                    "🌐 FINORA BACKEND IS ONLINE"
                );

                console.log(
                    "=============================================="
                );

            }
        );

    } catch (error) {

        console.error(
            "=============================================="
        );

        console.error(
            "❌ FINORA SERVER STARTUP FAILED"
        );

        console.error(
            "=============================================="
        );

        console.error(
            error
        );

        process.exit(1);
    }
}


startServer();
