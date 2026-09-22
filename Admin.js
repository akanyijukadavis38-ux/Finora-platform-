const mongoose = require("mongoose");

/* =========================================================
FINORA ADMIN MODEL

SECURITY FOUNDATION

IMPORTANT:

- Admin passwords are NEVER stored as plain text.
- passwordHash stores the bcrypt-generated hash.
- Admin accounts are separate from normal FINORA users.
- Recovery keys are NEVER stored as plain text.
- recoveryKeyHash stores only the secure hash.
- sessionVersion is used to invalidate all Admin sessions
  when the Admin logs out.
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
       RECOVERY KEY HASH

       NEVER STORE THE ACTUAL RECOVERY KEY.

       Only the secure hash is stored in MongoDB.
    ================================================= */

    recoveryKeyHash: {
        type: String,
        default: null,
        select: false
    },


    /* =================================================
       RECOVERY KEY VERSION

       Changes whenever a new recovery key is issued.

       This helps ensure that an old recovery key cannot
       remain valid after a successful password recovery.
    ================================================= */

    recoveryKeyVersion: {
        type: Number,
        default: 1
    },


    /* =================================================
       GLOBAL ADMIN SESSION VERSION

       All Admin login sessions are tied to this version.

       When the Admin logs out globally, this number is
       increased. Existing Admin sessions then become
       invalid on every device.

       Normal FINORA user sessions are NOT affected.
    ================================================= */

    sessionVersion: {
        type: Number,
        default: 1
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
