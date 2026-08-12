require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./database");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/", (req, res) => {
  res.json({
    success: true,
    platform: "Finora",
    message: "Finora backend is running",
    status: "online"
  });
});

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
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      success: false,
      service: "Finora API",
      database: "disconnected",
      status: "unhealthy"
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Finora backend running on port ${PORT}`);
});
