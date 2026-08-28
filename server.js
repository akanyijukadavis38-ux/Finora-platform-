const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const userRoutes = require("./userRoutes");

const app = express();

// Allow frontend connection
app.use(cors());

// Read JSON data
app.use(express.json());

// Health check
app.get("/health", function(req, res) {

    res.status(200).json({

        status: "ok",

        message: "FINORA Backend is healthy"

    });

});

// Connect database
connectDB();

// FINORA user routes
app.use("/api/users", userRoutes);

// Test route
app.get("/", function(req, res) {

    res.send("FINORA Backend Running Successfully");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", function() {

    console.log(
        "FINORA server running on port " + PORT
    );

});
