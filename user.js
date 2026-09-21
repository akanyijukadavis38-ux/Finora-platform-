const mongoose = require("mongoose");


/* =========================================================
   FINORA REFERRAL CODE GENERATOR
========================================================= */

function generateReferralCode() {

    const randomPart =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    return `FIN${randomPart}`;
}


/* =========================================================
   USER SCHEMA
========================================================= */

const userSchema = new mongoose.Schema(
    {

        /* -----------------------------------------
           BASIC ACCOUNT INFORMATION
        ----------------------------------------- */

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


        /* -----------------------------------------
           PASSWORD RESET
        ----------------------------------------- */

        resetPasswordToken: {
            type: String,
            default: null
        },

        resetPasswordExpires: {
            type: Date,
            default: null
        },


        /* -----------------------------------------
           REFERRAL SYSTEM
        ----------------------------------------- */

        referralCode: {
            type: String,
            unique: true,
            trim: true,
            index: true
        },

        referredByCode: {
            type: String,
            default: null,
            trim: true,
            index: true
        },


        /* -----------------------------------------
           WALLET
        ----------------------------------------- */

        balance: {
            type: Number,
            default: 0
        },


        /* -----------------------------------------
           FINANCIAL TOTALS
        ----------------------------------------- */

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


        /* -----------------------------------------
           ACCOUNT STATUS

           LIFECYCLE:

           REGISTERED
                ↓
           INACTIVE
                ↓
           SUCCESSFUL DEPOSIT
                ↓
           FIRST INVESTMENT
                ↓
           ACTIVE

           FROZEN is an administrative state and
           overrides normal account activity.
        ----------------------------------------- */

        status: {
            type: String,

            enum: [
                "inactive",
                "active",
                "frozen"
            ],

            default: "inactive"
        }

    },

    {
        timestamps: true
    }
);


/* =========================================================
   AUTOMATIC FINORA REFERRAL CODE
========================================================= */

userSchema.pre(
    "validate",
    async function(next) {

        try {

            /* -----------------------------------------
               KEEP EXISTING REFERRAL CODE
            ----------------------------------------- */

            if (this.referralCode) {

                return next();

            }


            /* -----------------------------------------
               GENERATE UNIQUE CODE
            ----------------------------------------- */

            let code;

            for (
                let attempt = 0;
                attempt < 10;
                attempt++
            ) {

                code =
                    generateReferralCode();


                const exists =
                    await mongoose.models.User.exists(
                        {
                            referralCode:
                                code
                        }
                    );


                if (!exists) {

                    this.referralCode =
                        code;

                    return next();

                }

            }


            return next(
                new Error(
                    "Unable to generate a unique FINORA referral code."
                )
            );

        } catch (error) {

            return next(error);

        }

    }
);


/* =========================================================
   EXPORT USER MODEL
========================================================= */

module.exports =
    mongoose.model(
        "User",
        userSchema
    );
