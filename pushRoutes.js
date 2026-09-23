const express = require("express");

const PushSubscription =
    require("./PushSubscription");

const router =
    express.Router();


/* =========================================================
   USER AUTHENTICATION
========================================================= */

function requireAuth(req, res, next) {

    if (
        !req.session ||
        !req.session.userId
    ) {

        return res.status(401).json({

            success:
                false,

            message:
                "FINORA authentication required."
        });
    }


    next();
}


/* =========================================================
   SAVE / UPDATE DEVICE PUSH SUBSCRIPTION
========================================================= */

router.post(
    "/subscribe",
    requireAuth,
    async (req, res) => {

        try {

            const subscription =
                req.body;


            if (
                !subscription ||
                !subscription.endpoint ||
                !subscription.keys ||
                !subscription.keys.p256dh ||
                !subscription.keys.auth
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid FINORA push subscription."
                });
            }


            const savedSubscription =
                await PushSubscription.findOneAndUpdate(

                    {
                        endpoint:
                            subscription.endpoint
                    },

                    {
                        userId:
                            req.session.userId,

                        endpoint:
                            subscription.endpoint,

                        keys: {

                            p256dh:
                                subscription.keys.p256dh,

                            auth:
                                subscription.keys.auth
                        }
                    },

                    {
                        new:
                            true,

                        upsert:
                            true,

                        setDefaultsOnInsert:
                            true
                    }
                );


            return res.status(200).json({

                success:
                    true,

                message:
                    "FINORA device notifications enabled.",

                subscriptionId:
                    savedSubscription._id
            });

        } catch (error) {

            console.error(
                "❌ FINORA SAVE PUSH SUBSCRIPTION ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not register this device for notifications."
            });
        }
    }
);


/* =========================================================
   REMOVE DEVICE PUSH SUBSCRIPTION
========================================================= */

router.delete(
    "/unsubscribe",
    requireAuth,
    async (req, res) => {

        try {

            const endpoint =
                req.body &&
                req.body.endpoint;


            if (!endpoint) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Push subscription endpoint is required."
                });
            }


            await PushSubscription.deleteOne({

                userId:
                    req.session.userId,

                endpoint:
                    endpoint
            });


            return res.status(200).json({

                success:
                    true,

                message:
                    "FINORA device notifications disabled."
            });

        } catch (error) {

            console.error(
                "❌ FINORA REMOVE PUSH SUBSCRIPTION ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not disable device notifications."
            });
        }
    }
);


module.exports =
    router;
