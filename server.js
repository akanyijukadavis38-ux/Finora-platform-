require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    platform: "Finora",
    message: "Finora backend is running",
    status: "online"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "Finora API",
    status: "healthy"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Finora backend running on port ${PORT}`);
});
