const express = require("express");
const cors = require("cors");

console.log("STEP 1: server.js loaded");

const { connectDB } = require("./database");

console.log("STEP 2: database.js loaded");

const app = express();

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        application: "FINORA",
        message: "FINORA Backend Running Successfully"
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        message: "FINORA Backend is healthy"
    });
});

app.listen(PORT, "0.0.0.0", async () => {

    console.log("STEP 3: FINORA SERVER STARTED");
    console.log("PORT:", PORT);

    console.log("STEP 4: Starting database connection...");

    try {

        await connectDB();

        console.log("STEP 5: DATABASE CONNECTED SUCCESSFULLY");

    } catch (error) {

        console.error("STEP 5: DATABASE CONNECTION FAILED");
        console.error(error.message);

    }

});
