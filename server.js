require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./database");

const app = express();


/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());
app.use(express.json());


/* =========================================
   FRONTEND FILES
========================================= */

app.use(express.static(__dirname));


/* =========================================
   HOME / INDEX
========================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


/* =========================================
   BACKEND STATUS
========================================= */

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        platform: "FINORA",
        message: "FINORA backend is running",
        status: "online"
    });

});


/* =========================================
   REGISTRATION CONNECTION TEST
========================================= */

app.get("/api/register-test", (req, res) => {

    res.json({
        success: true,
        service: "FINORA Registration API",
        message: "Registration server connection is working",
        status: "online"
    });

});


/* =========================================
   DATABASE HEALTH
========================================= */

app.get("/api/health", async (req, res) => {

    try {

        await pool.query("SELECT 1");

        res.json({
            success: true,
            service: "FINORA API",
            database: "connected",
            status: "healthy"
        });

    } catch (error) {

        console.error(
            "Database health check failed:",
            error.message
        );

        res.status(500).json({
            success: false,
            service: "FINORA API",
            database: "disconnected",
            status: "unhealthy"
        });

    }

});


/* =========================================
   SERVER
========================================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

    console.log(
        `FINORA backend running on port ${PORT}`
    );

});
