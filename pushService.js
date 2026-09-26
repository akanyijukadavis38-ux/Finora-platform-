/* =========================================================
   FINORA PUSH SERVICE
   CENTRAL DEVICE PUSH NOTIFICATION SENDER
========================================================= */

const webpush =
    require("web-push");

const PushSubscription =
    require("./PushSubscription");


/* =========================================================
   VAPID CONFIGURATION
========================================================= */

webpush.setVapidDetails(

    process.env.VAPID_SUBJECT,

    process.env.VAPID_PUBLIC_KEY,

    process.env.VAPID_PRIVATE_KEY

);


/* =========================================================
   SEND PUSH TO ONE USER
========================================================= */

async function sendPushToUser(
    userId,
    notification
) {

    if (!userId) {

        console.warn(
            "⚠️ FINORA PUSH: No userId supplied."
        );

        return {
            sent: 0,
            removed: 0,
            failed: 0
        };

    }


    if (!notification) {

        console.warn(
            "⚠️ FINORA PUSH: No notification supplied."
        );

        return {
            sent: 0,
            removed: 0,
            failed: 0
        };

    }


    /* =====================================================
       FIND ALL USER DEVICES
    ===================================================== */

    const subscriptions =
        await PushSubscription.find({

            userId:
                userId

        });


    if (
        subscriptions.length === 0
    ) {

        console.log(
            "FINORA PUSH: No registered devices for user:",
            userId.toString()
        );

        return {
            sent: 0,
            removed: 0,
            failed: 0
        };

    }


    /* =====================================================
       CREATE UNIQUE NOTIFICATION ID
    ===================================================== */

    const notificationId =
        notification._id
            ? notification._id.toString()
            : `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`;


    /* =====================================================
       PUSH PAYLOAD
    ===================================================== */

    const payload =
        JSON.stringify({

            title:
                notification.title ||
                "FINORA",

            body:
                notification.message ||
                "You have a new FINORA notification.",

            notificationId:
                notificationId,

            /*
             * IMPORTANT:
             * Every FINORA notification gets its own
             * unique Android/browser notification tag.
             *
             * This prevents a new notification from
             * replacing an older one.
             */
            tag:
                `finora-${notificationId}`,

            url:
                "/dashboard.html",

            icon:
                "/finora-icon.png",

            badge:
                "/finora-badge.png"

        });


    let sent =
        0;

    let removed =
        0;

    let failed =
        0;


    /* =====================================================
       SEND TO EVERY DEVICE
    ===================================================== */

    for (
        const savedSubscription
        of subscriptions
    ) {

        try {

            await webpush.sendNotification(

                {
                    endpoint:
                        savedSubscription.endpoint,

                    keys: {

                        p256dh:
                            savedSubscription.keys.p256dh,

                        auth:
                            savedSubscription.keys.auth

                    }

                },

                payload

            );


            sent++;


            console.log(
                "✅ FINORA PUSH SENT:",
                notification.type,
                "ID:",
                notificationId,
                "→",
                userId.toString()
            );


        } catch (error) {

            failed++;


            console.error(
                "❌ FINORA PUSH SEND FAILED:",
                error.statusCode || "",
                error.message || error
            );


            /* =================================================
               REMOVE DEAD / EXPIRED DEVICE
            ================================================= */

            if (
                error.statusCode === 404 ||
                error.statusCode === 410
            ) {

                try {

                    await PushSubscription.deleteOne({

                        _id:
                            savedSubscription._id

                    });


                    removed++;


                    console.log(
                        "🗑️ FINORA PUSH: Removed expired device subscription."
                    );


                } catch (deleteError) {

                    console.error(
                        "❌ FINORA PUSH: Could not remove expired subscription:",
                        deleteError
                    );

                }

            }

        }

    }


    return {

        sent:
            sent,

        removed:
            removed,

        failed:
            failed

    };

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    sendPushToUser

};
