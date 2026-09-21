const mongoose = require("mongoose");


const supportSchema = new mongoose.Schema(
    {

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        category: {
            type: String,
            required: true,
            enum: [
                "deposit",
                "investment",
                "withdrawal",
                "referral",
                "account",
                "other"
            ],
            trim: true
        },


        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },


        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },


        status: {
            type: String,
            enum: [
                "open",
                "in_progress",
                "resolved",
                "closed"
            ],
            default: "open",
            index: true
        }

    },
    {
        timestamps: true
    }
);


module.exports =
    mongoose.model(
        "Support",
        supportSchema
    );
