const mongoose = require("mongoose");


/* =========================================================
   FINORA WITHDRAWAL MODEL

   USER
      ↓
   WITHDRAWAL REQUEST
      ↓
   PENDING
      ↓
   PROCESSING / ADMIN REVIEW
      ↓
   APPROVED / COMPLETED
   OR
   REJECTED / FAILED

   IMPORTANT:
   - Withdrawal amount is the amount deducted from wallet.
   - 15% fee is calculated from the withdrawal amount.
   - User receives the remaining 85%.
   - Registered phone number is stored at the time of request.
   - Network is detected from the registered phone number.
========================================================= */


const withdrawalSchema = new mongoose.Schema(
    {

        /* =================================================
           USER REQUESTING THE WITHDRAWAL
        ================================================= */

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        /* =================================================
           REQUESTED WITHDRAWAL AMOUNT

           Example:
           UGX 10,000 requested
        ================================================= */

        amount: {
            type: Number,
            required: true,
            min: 4000
        },


        /* =================================================
           WITHDRAWAL FEE

           FINORA RATE:
           15%

           Example:
           10,000 × 15% = 1,500
        ================================================= */

        fee: {
            type: Number,
            required: true,
            min: 0
        },


        /* =================================================
           AMOUNT USER RECEIVES

           Example:
           10,000 - 1,500 = 8,500
        ================================================= */

        netAmount: {
            type: Number,
            required: true,
            min: 0
        },


        /* =================================================
           REGISTERED MOBILE MONEY NUMBER

           This comes from the user's FINORA account.
           It is NOT entered manually during withdrawal.
        ================================================= */

        phoneNumber: {
            type: String,
            required: true,
            trim: true
        },


        /* =================================================
           AUTOMATICALLY DETECTED NETWORK
        ================================================= */

        network: {
            type: String,
            enum: [
                "MTN",
                "Airtel"
            ],
            required: true
        },


        /* =================================================
           WITHDRAWAL STATUS

           pending:
               Request submitted and waiting for processing.

           approved:
               Withdrawal approved for payout.

           completed:
               Payout has been completed.

           rejected:
               Withdrawal rejected.

           failed:
               Payout/processing failed.
        ================================================= */

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "completed",
                "rejected",
                "failed"
            ],
            default: "pending",
            index: true
        },


        /* =================================================
           PROCESSING INFORMATION
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


        /* =================================================
           REJECTION / FAILURE REASON
        ================================================= */

        rejectionReason: {
            type: String,
            default: null,
            trim: true
        },


        /* =================================================
           PAYOUT REFERENCE

           This can later hold the MTN/Airtel payout
           transaction reference when a real payout
           system is connected.
        ================================================= */

        payoutReference: {
            type: String,
            default: null,
            trim: true
        },


        /* =================================================
           WALLET DEDUCTION PROTECTION

           false = wallet has not been deducted
           true  = wallet has already been deducted

           This prevents accidental double deduction.
        ================================================= */

        walletDeducted: {
            type: Boolean,
            default: false,
            index: true
        },


        walletDeductedAt: {
            type: Date,
            default: null
        },


        /* =================================================
           TRANSACTION LINK

           Links this withdrawal to its FINORA transaction
           record.
        ================================================= */

        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
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
   Quickly find withdrawals belonging to one user.
*/

withdrawalSchema.index({
    user: 1,
    createdAt: -1
});


/*
   Quickly find withdrawals waiting for processing.
*/

withdrawalSchema.index({
    status: 1,
    createdAt: -1
});


/* =========================================================
   EXPORT FINORA WITHDRAWAL MODEL
========================================================= */

module.exports =
    mongoose.model(
        "Withdrawal",
        withdrawalSchema
    );
