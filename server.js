const express = require("express");
const cors = require("cors");

const { connectDB } = require("./database");

const app = express();

const PORT = process.env.PORT || 8080;

// Allow frontend requests
app.use(cors());

// Read JSON requests
app.use(express.json());

// Basic health check
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

// Start server
app.listen(PORT, "0.0.0.0", async () => {
    console.log("=================================");
    console.log("FINORA BACKEND STARTED");
    console.log("PORT:", PORT);
    console.log("=================================");

    try {
        await connectDB();
    } catch (error) {
        console.error("FINORA DATABASE CONNECTION FAILED");
    }
});
