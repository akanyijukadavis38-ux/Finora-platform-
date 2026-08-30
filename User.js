const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        referralCode: {
            type: String,
            default: null,
            trim: true
        },

        balance: {
            type: Number,
            default: 0
        },

        totalIncome: {
            type: Number,
            default: 0
        },

        totalDeposit: {
            type: Number,
            default: 0
        },

        totalWithdrawal: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["active", "frozen"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
