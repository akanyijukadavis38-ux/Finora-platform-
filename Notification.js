const mongoose = require("mongoose");


const notificationSchema = new mongoose.Schema(
    {

        /*
        =========================================================
        USER RECIPIENT
        =========================================================
        Used when the notification belongs to a normal FINORA user.
        Optional because admin notifications will use adminId instead.
        */

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },


        /*
        =========================================================
        ADMIN RECIPIENT
        =========================================================
        Used when the notification belongs to the FINORA admin.
        */

        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
            index: true
        },


        /*
        =========================================================
        NOTIFICATION TYPE
        =========================================================
        Examples:
        user_registered
        deposit_submitted
        deposit_approved
        deposit_rejected
        withdrawal_submitted
        withdrawal_approved
        withdrawal_rejected
        */

        type: {
            type: String,
            required: true,
            trim: true,
            index: true
        },


        /*
        =========================================================
        TITLE
        =========================================================
        */

        title: {
            type: String,
            required: true,
            trim: true
        },


        /*
        =========================================================
        MESSAGE
        =========================================================
        */

        message: {
            type: String,
            required: true,
            trim: true
        },


        /*
        =========================================================
        READ STATUS
        =========================================================
        */

        isRead: {
            type: Boolean,
            default: false,
            index: true
        }

    },

    {
        timestamps: true
    }
);


/*
=========================================================
INDEXES
=========================================================
*/


notificationSchema.index({
    userId: 1,
    createdAt: -1
});


notificationSchema.index({
    adminId: 1,
    createdAt: -1
});


notificationSchema.index({
    adminId: 1,
    isRead: 1,
    createdAt: -1
});


notificationSchema.index({
    userId: 1,
    isRead: 1,
    createdAt: -1
});


/*
=========================================================
MODEL
=========================================================
*/

module.exports =
    mongoose.model(
        "Notification",
        notificationSchema
    );
