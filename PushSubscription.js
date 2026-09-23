const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        endpoint: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        keys: {
            p256dh: {
                type: String,
                required: true
            },

            auth: {
                type: String,
                required: true
            }
        }
    },
    {
        timestamps: true
    }
);


/*
=========================================================
USER + DEVICE LOOKUP
=========================================================
*/

pushSubscriptionSchema.index({
    userId: 1,
    createdAt: -1
});


module.exports =
    mongoose.model(
        "PushSubscription",
        pushSubscriptionSchema
    );
