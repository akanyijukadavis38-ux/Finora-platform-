const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        amount: {
            type: Number,
            required: true,
            min: 10000
        },

        dailyRate: {
            type: Number,
            required: true,
            default: 10,
            min: 0
        },

        dailyEarnings: {
            type: Number,
            required: true,
            min: 0
        },

        duration: {
            type: Number,
            required: true,
            default: 20,
            min: 1
        },

        earned: {
            type: Number,
            default: 0,
            min: 0
        },

        daysCompleted: {
            type: Number,
            default: 0,
            min: 0
        },

        daysRemaining: {
            type: Number,
            default: 20,
            min: 0
        },

        startDate: {
            type: Date,
            default: Date.now
        },

        endDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: [
                "active",
                "completed"
            ],
            default: "active",
            index: true
        }
    },

    {
        timestamps: true
    }
);


/* =========================================================
   USER INVESTMENT LOOKUP
========================================================= */

investmentSchema.index({
    user: 1,
    status: 1
});


module.exports =
    mongoose.model(
        "Investment",
        investmentSchema
    );
