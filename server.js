require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();

const PORT = Number(process.env.PORT) || 8080;

/* =========================================================
   EXPRESS
========================================================= */

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


/* =========================================================
   POSTGRESQL
========================================================= */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
});


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
   DATABASE TEST
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
            "DATABASE ERROR:",
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
   404
========================================================= */

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "FINORA endpoint not found.",
        method: req.method,
        path: req.originalUrl
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
