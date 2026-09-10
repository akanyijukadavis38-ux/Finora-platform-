const mongoose = require("mongoose");


/* =========================================================
   FINORA DEPOSIT MODEL

   USER
      ↓
   DEPOSIT SUBMITTED
      ↓
   PENDING
      ↓
   ADMIN REVIEW
      ↓
   APPROVED / REJECTED

   APPROVED:
      ↓
   WALLET CREDIT
      ↓
   FIRST-DEPOSIT REFERRAL PROCESSING
========================================================= */


const depositSchema = new mongoose.Schema(
    {

        /* =================================================
           USER WHO MADE THE DEPOSIT
        ================================================= */

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        /* =================================================
           DEPOSIT AMOUNT

           FINORA MINIMUM:
           UGX 10,000
        ================================================= */

        amount: {
            type: Number,
            required: true,
            min: 10000
        },


        /* =================================================
           PAYMENT METHOD
        ================================================= */

        paymentMethod: {
            type: String,
            enum: [
                "MTN",
                "Airtel"
            ],
            required: true
        },


        /* =================================================
           FINORA MERCHANT CODE USED
        ================================================= */

        merchantCode: {
            type: String,
            enum: [
                "52200475",
                "7157334"
            ],
            required: true
        },


        /* =================================================
           MOBILE MONEY TRANSACTION REFERENCE

           User enters the transaction/reference number
           received after completing payment.
        ================================================= */

        paymentReference: {
            type: String,
            required: true,
            trim: true
        },


        /* =================================================
           DEPOSIT STATUS
        ================================================= */

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected"
            ],
            default: "pending",
            index: true
        },


        /* =================================================
           ADMIN PROCESSING INFORMATION
        ================================================= */

        processedAt: {
            type: Date,
            default: null
        },


        processedBy: {
            type: String,
            default: null,
            trim: true
        },


        rejectionReason: {
            type: String,
            default: null,
            trim: true
        },


        /* =================================================
           WALLET CREDIT PROTECTION

           false = wallet has not been credited
           true  = wallet has already been credited

           This prevents accidental double-crediting.
        ================================================= */

        walletCredited: {
            type: Boolean,
            default: false,
            index: true
        },


        walletCreditedAt: {
            type: Date,
            default: null
        },


        /* =================================================
           FIRST-DEPOSIT REFERRAL PROCESSING

           Only the user's FIRST APPROVED DEPOSIT can
           generate referral commissions.

           This flag prevents duplicate processing.
        ================================================= */

        referralProcessed: {
            type: Boolean,
            default: false,
            index: true
        },


        referralProcessedAt: {
            type: Date,
            default: null
        }

    },


    {
        timestamps: true
    }
);


/* =========================================================
   DATABASE INDEXES
========================================================= */


/*
   Quickly find all deposits belonging to one user.
*/

depositSchema.index({
    user: 1,
    createdAt: -1
});


/*
   Quickly find pending deposits for admin processing.
*/

depositSchema.index({
    status: 1,
    createdAt: -1
});


/* =========================================================
   EXPORT FINORA DEPOSIT MODEL
========================================================= */

module.exports =
    mongoose.model(
        "Deposit",
        depositSchema
    );
