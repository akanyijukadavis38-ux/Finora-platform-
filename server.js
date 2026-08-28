require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const userRoutes = require("./userRoutes");
const { connectDB } = require("./database");

const app = express();

const PORT =
    Number(process.env.PORT) || 8080;


/* =========================================================
   FINORA CORS
========================================================= */

const allowedOrigins = [

    "https://finora-platform-q56zx1xzc-akanyijukadavis38-1583s-projects.vercel.app"

];


app.use((req, res, next) => {

    const origin =
        req.headers.origin;


    /* =====================================================
       ALLOW FINORA FRONTEND
    ===================================================== */

    if (
        origin &&
        allowedOrigins.includes(origin)
    ) {

        res.setHeader(
            "Access-Control-Allow-Origin",
            origin
        );

        res.setHeader(
            "Access-Control-Allow-Credentials",
            "true"
        );

    }


    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );


    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );


    res.setHeader(
        "Vary",
        "Origin"
    );


    /* =====================================================
       PREFLIGHT
    ===================================================== */

    if (req.method === "OPTIONS") {

        return res.status(204).end();

    }


    next();

});


/* =========================================================
   EXPRESS BODY PARSING
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
   REQUEST LOGGER
========================================================= */

app.use((req, res, next) => {

    console.log(
        "FINORA REQUEST:",
        req.method,
        req.originalUrl
    );

    next();

});


/* =========================================================
   BASIC SERVER TEST
========================================================= */

app.get("/", (req, res) => {

    return res.status(200).json({

        success: true,

        application:
            "FINORA",

        message:
            "FINORA server is running.",

        version:
            "1.0.0"

    });

});


/* =========================================================
   API TEST
========================================================= */

app.get("/api", (req, res) => {

    return res.status(200).json({

        success: true,

        application:
            "FINORA",

        message:
            "FINORA API is running.",

        version:
            "1.0.0"

    });

});


/* =========================================================
   DATABASE HEALTH
========================================================= */

app.get("/api/health", (req, res) => {

    const state =
        mongoose.connection.readyState;


    if (state === 1) {

        return res.status(200).json({

            success: true,

            server:
                "connected",

            database:
                "connected",

            databaseType:
                "MongoDB",

            message:
                "FINORA MongoDB database is connected."

        });

    }


    return res.status(503).json({

        success: false,

        server:
            "connected",

        database:
            "disconnected",

        databaseType:
            "MongoDB",

        message:
            "FINORA MongoDB database is not connected."

    });

});


/* =========================================================
   FINORA USER ROUTES
========================================================= */

app.use(
    "/api/users",
    userRoutes
);


/* =========================================================
   404
========================================================= */

app.use((req, res) => {

    console.log(
        "FINORA 404:",
        req.method,
        req.originalUrl
    );


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
   GLOBAL ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {

    console.error(
        "🔥 FINORA SERVER ERROR:",
        error
    );


    return res.status(500).json({

        success: false,

        message:
            "FINORA server error."

    });

});


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

    try {

        console.log(
            "🔥 FINORA: Starting server..."
        );


        await connectDB();


        console.log(
            "🔥 FINORA: Database connection ready."
        );


        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    "=============================================="
                );

                console.log(
                    "🔥 FINORA BACKEND ONLINE"
                );

                console.log(
                    `🔥 PORT: ${PORT}`
                );

                console.log(
                    "🔥 MongoDB: CONNECTED"
                );

                console.log(
                    "🔥 User routes: /api/users"
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
            error
        );

        console.error(
            "=============================================="
        );


        process.exit(1);

    }

}


startServer();
