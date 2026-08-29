require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./database");

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

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, "0.0.0.0", () => {
            console.log("=================================");
            console.log("🚀 FINORA BACKEND STARTED");
            console.log("🚀 PORT:", PORT);
            console.log("=================================");
        });

    } catch (error) {
        console.error("❌ FINORA SERVER START FAILED");
        console.error(error.message);
        process.exit(1);
    }
}

startServer();
