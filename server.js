require("dotenv").config();

const express = require("express");

const userRoutes = require("./userRoutes");
const pool = require("./database");

const app = express();

const PORT = Number(process.env.PORT) || 8080;


/* =========================================================
   CORS
========================================================= */

app.use((req, res, next) => {

    res.header(
        "Access-Control-Allow-Origin",
        "*"
    );

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
   EXPRESS
========================================================= */

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


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

        console.log(
            "FINORA CORS enabled"
        );

    }
);
