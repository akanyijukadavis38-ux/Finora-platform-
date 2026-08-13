require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================
   SERVE FINORA FRONTEND
========================================= */

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


/* =========================================
   DATABASE HEALTH CHECK
========================================= */

app.get("/api/health", async (req, res) => {

    try {

        await pool.query("SELECT 1");

        res.json({
            success: true,
            service: "Finora API",
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
            service: "Finora API",
            database: "disconnected",
            status: "unhealthy"

        });

    }

});


/* =========================================
   REGISTRATION API TEST
========================================= */

app.get("/api/register-test", (req, res) => {

    res.json({

        success: true,

        service:
            "Finora Registration API",

        message:
            "Registration server connection is working",

        status:
            "online"

    });

});


/* =========================================
   SERVER
========================================= */

const PORT =
    process.env.PORT || 10000;

app.listen(PORT, () => {

    console.log(
        `Finora backend running on port ${PORT}`
    );

});
