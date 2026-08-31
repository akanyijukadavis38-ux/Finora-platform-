const mongoose = require("mongoose");


/* =========================================================
   GENERATE UNIQUE-LOOKING FINORA REFERRAL CODE
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
        /* =================================================
           FULL NAME
        ================================================= */

        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2
        },


        /* =================================================
           PHONE
        ================================================= */

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },


        /* =================================================
           EMAIL
        ================================================= */

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },


        /* =================================================
           PASSWORD
        ================================================= */

        password: {
            type: String,
            required: true,
            minlength: 6
        },


        /* =================================================
           USER'S OWN REFERRAL CODE

           EVERY USER GETS ONE AUTOMATICALLY.
        ================================================= */

        referralCode: {
            type: String,
            unique: true,
            trim: true,
            index: true
        },


        /* =================================================
           CODE OF THE PERSON WHO REFERRED THIS USER

           This is DIFFERENT from the user's own code.
        ================================================= */

        referredByCode: {
            type: String,
            default: null,
            trim: true,
            index: true
        },


        /* =================================================
           WALLET BALANCE
        ================================================= */

        balance: {
            type: Number,
            default: 0
        },


        /* =================================================
           TOTAL INCOME
        ================================================= */

        totalIncome: {
            type: Number,
            default: 0
        },


        /* =================================================
           TOTAL DEPOSIT
        ================================================= */

        totalDeposit: {
            type: Number,
            default: 0
        },


        /* =================================================
           TOTAL WITHDRAWAL
        ================================================= */

        totalWithdrawal: {
            type: Number,
            default: 0
        },


        /* =================================================
           ACCOUNT STATUS
        ================================================= */

        status: {
            type: String,
            enum: [
                "active",
                "frozen"
            ],
            default: "active"
        }
    },


    {
        timestamps: true
    }
);


/* =========================================================
   AUTOMATIC REFERRAL CODE
========================================================= */

userSchema.pre(
    "validate",
    async function(next) {

        try {

            /*
               If the user already has a referral code,
               leave it unchanged.
            */

            if (this.referralCode) {
                return next();
            }


            /*
               Generate a code that does not already
               exist in MongoDB.
            */

            let code;
            let exists = true;


            while (exists) {

                code =
                    generateReferralCode();


                exists =
                    await mongoose.models.User.exists({
                        referralCode: code
                    });
            }


            this.referralCode =
                code;


            next();

        } catch (error) {

            next(error);
        }
    }
);


module.exports =
    mongoose.model(
        "User",
        userSchema
    );
