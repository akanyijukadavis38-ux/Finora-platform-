const mongoose = require("mongoose");


/* =========================================================
   FINORA USER SCHEMA
========================================================= */

const userSchema = new mongoose.Schema(
    {

        /* =====================================================
           BASIC INFORMATION
        ===================================================== */

        fullName: {
            type: String,
            required: true,
            trim: true
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


        /* =====================================================
           SECURITY
        ===================================================== */

        passwordHash: {
            type: String,
            required: true
        },


        /* =====================================================
           REFERRAL SYSTEM
        ===================================================== */

        referralCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        referredBy: {
            type: String,
            default: null,
            uppercase: true,
            trim: true
        },


        /* =====================================================
           ACCOUNT
        ===================================================== */

        accountNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },


        /* =====================================================
           WALLET
        ===================================================== */

        walletBalance: {
            type: Number,
            default: 0,
            min: 0
        },

        cumulativeIncome: {
            type: Number,
            default: 0,
            min: 0
        },


        /* =====================================================
           ACCOUNT STATUS
        ===================================================== */

        accountStatus: {
            type: String,
            enum: [
                "active",
                "frozen",
                "suspended"
            ],
            default: "active"
        }

    },

    {
        timestamps: true
    }
);


/* =========================================================
   FINORA USER MODEL
========================================================= */

const User =
    mongoose.model(
        "User",
        userSchema
    );


module.exports = User;
