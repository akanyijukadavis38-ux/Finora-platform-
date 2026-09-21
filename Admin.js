const mongoose = require("mongoose");


/* =========================================================
   FINORA ADMIN MODEL

   SECURITY FOUNDATION

   IMPORTANT:
   - Admin passwords are NEVER stored as plain text.
   - passwordHash stores the bcrypt-generated hash.
   - Admin accounts are separate from normal FINORA users.
========================================================= */

const adminSchema = new mongoose.Schema(
    {

        /* =================================================
           ADMIN USERNAME
        ================================================= */

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 50,
            index: true
        },


        /* =================================================
           ADMIN EMAIL
        ================================================= */

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },


        /* =================================================
           PASSWORD HASH

           NEVER STORE THE ACTUAL PASSWORD.
        ================================================= */

        passwordHash: {
            type: String,
            required: true,
            select: false
        },


        /* =================================================
           ADMIN ACCOUNT STATUS
        ================================================= */

        status: {
            type: String,
            enum: [
                "active",
                "disabled"
            ],
            default: "active",
            index: true
        },


        /* =================================================
           LAST SUCCESSFUL LOGIN
        ================================================= */

        lastLogin: {
            type: Date,
            default: null
        }

    },

    {
        timestamps: true
    }
);


/* =========================================================
   EXPORT ADMIN MODEL
========================================================= */

module.exports =
    mongoose.model(
        "Admin",
        adminSchema
    );
