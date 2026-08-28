require("dotenv").config();

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ FINORA ERROR: MONGODB_URI is not defined.");
    process.exit(1);
}

mongoose.connection.on("connected", () => {
    console.log("✅ FINORA MongoDB database connected");
});

mongoose.connection.on("error", (error) => {
    console.error(
        "❌ FINORA MongoDB error:",
        error.message
    );
});

mongoose.connection.on("disconnected", () => {
    console.log("⚠️ FINORA MongoDB database disconnected");
});

async function connectDB() {
    try {

        await mongoose.connect(MONGODB_URI);

        console.log(
            "✅ FINORA MongoDB connection established"
        );

    } catch (error) {

        console.error(
            "❌ FINORA MongoDB connection failed:",
            error.message
        );

        throw error;
    }
}

module.exports = {
    mongoose,
    connectDB
};
