require("dotenv").config();

const express = require("express");

const app = express();

const userRoutes = require("./userRoutes");
const pool = require("./database");

const PORT = Number(process.env.PORT) || 8080;


/* =========================================================
   EXPRESS
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

    res.json({
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

    res.json({
        success: true,
        application: "FINORA",
        message: "FINORA API is running.",
        version: "1.0.0"
    });

});


/* =========================================================
   DATABASE HEALTH TEST
========================================================= */

app.get("/api/health", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT NOW() AS time"
        );

        res.json({
            success: true,
            server: "connected",
            database: "connected",
            time: result.rows[0].time
        });

    } catch (error) {

        console.error(
            "FINORA DATABASE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            server: "connected",
            database: "disconnected",
            message: error.message
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
   404
========================================================= */

app.use((req, res) => {

    res.status(404).json({

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
        "FINORA SERVER ERROR:",
        error
    );

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({

        success: false,

        message:
            "FINORA server error."

    });

});


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `FINORA server running on port ${PORT}`
        );

    }
);
