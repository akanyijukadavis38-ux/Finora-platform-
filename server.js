require("dotenv").config();

const express = require("express");

const userRoutes = require("./userRoutes");
const { connectDB } = require("./database");

const app = express();

const PORT =
    Number(process.env.PORT) || 8080;


/* =========================================================
   CORS
   FINORA VERCEL FRONTEND
========================================================= */

const ALLOWED_ORIGINS = [

    "https://finora-platform-q56zx1xzc-akanyijukadavis38-1583s-projects.vercel.app"

];


app.use((req, res, next) => {

    const origin =
        req.headers.origin;


    if (
        origin &&
        ALLOWED_ORIGINS.includes(origin)
    ) {

        res.header(
            "Access-Control-Allow-Origin",
            origin
        );

        res.header(
            "Access-Control-Allow-Credentials",
            "true"
        );

        res.header(
            "Vary",
            "Origin"
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


    /* =====================================================
       PREFLIGHT REQUEST
    ===================================================== */

    if (req.method === "OPTIONS") {

        return res.sendStatus(204);

    }


    next();

});


/* =========================================================
   EXPRESS
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
   BASIC SERVER TEST
========================================================= */

app.get("/", (req, res) => {

    return res.json({

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

    return res.json({

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
   DATABASE TEST
========================================================= */

app.get("/api/health", async (req, res) => {

    try {

        const mongoose =
            require("mongoose");


        const state =
            mongoose.connection.readyState;


        if (state === 1) {

            return res.json({

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


    } catch (error) {

        console.error(
            "FINORA DATABASE ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            server:
                "connected",

            database:
                "disconnected",

            databaseType:
                "MongoDB",

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
   404
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
   START SERVER
========================================================= */

async function startServer() {

    try {

        await connectDB();


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


    } catch (error) {

        console.error(
            "❌ FINORA SERVER STARTUP FAILED"
        );


        console.error(
            error.message
        );


        process.exit(1);

    }

}


startServer();
