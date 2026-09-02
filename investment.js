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
            default: 10
        },

        dailyEarnings: {
            type: Number,
            required: true
        },

        duration: {
            type: Number,
            required: true,
            default: 20
        },

        earned: {
            type: Number,
            default: 0
        },

        daysCompleted: {
            type: Number,
            default: 0
        },

        daysRemaining: {
            type: Number,
            default: 20
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
                "completed",
                "expired",
                "finished"
            ],
            default: "active",
            index: true
        }
    },

    {
        timestamps: true
    }
);


investmentSchema.index({
    user: 1,
    status: 1
});


module.exports =
    mongoose.model(
        "Investment",
        investmentSchema
    );
