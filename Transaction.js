const mongoose = require("mongoose");


/* =========================================================
   FINORA TRANSACTION MODEL
========================================================= */

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: [
                "deposit",
                "investment",
                "withdrawal",
                "referral",
                "earning"
            ],
            required: true,
            index: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        direction: {
            type: String,
            enum: [
                "credit",
                "debit"
            ],
            required: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "completed",
                "rejected",
                "failed"
            ],
            default: "completed",
            index: true
        },

        description: {
            type: String,
            default: ""
        },

        reference: {
            type: String,
            default: ""
        },

        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        }
    },

    {
        timestamps: true
    }
);


/* =========================================================
   INDEXES
========================================================= */

transactionSchema.index({
    user: 1,
    createdAt: -1
});


module.exports =
    mongoose.model(
        "Transaction",
        transactionSchema
    );
