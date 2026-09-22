const express = require("express");

const Notification =
    require("./Notification");
const requireAdmin =
    require("./adminAuth");
const router =
    express.Router();


/* =========================================================
   AUTHENTICATION
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
   GET USER NOTIFICATIONS
========================================================= */

router.get(
    "/",
    requireAuth,
    async (req, res) => {

        try {

            const notifications =
                await Notification.find({

                    userId:
                        req.session.userId

                })
                .sort({
                    createdAt:
                        -1
                })
                .limit(50)
                .lean();


            const unreadCount =
                await Notification.countDocuments({

                    userId:
                        req.session.userId,

                    isRead:
                        false
                });


            return res.status(200).json({

                success:
                    true,

                notifications,

                unreadCount
            });

        } catch (error) {

            console.error(
                "❌ FINORA GET NOTIFICATIONS ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not load your notifications."
            });
        }
    }
);
/* =========================================================
   GET ADMIN NOTIFICATIONS
========================================================= */

router.get(
    "/admin",
    requireAdmin,
    async (req, res) => {

        try {

            const notifications =
                await Notification.find({

                    adminId:
                        req.admin._id

                })
                .sort({
                    createdAt:
                        -1
                })
                .limit(100)
                .lean();


            const unreadCount =
                await Notification.countDocuments({

                    adminId:
                        req.admin._id,

                    isRead:
                        false
                });


            return res.status(200).json({

                success:
                    true,

                notifications,

                unreadCount
            });

        } catch (error) {

            console.error(
                "❌ FINORA GET ADMIN NOTIFICATIONS ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not load admin notifications."
            });
        }
    }
);

/* =========================================================
   MARK ONE NOTIFICATION AS READ
========================================================= */

router.patch(
    "/:notificationId/read",
    requireAuth,
    async (req, res) => {

        try {

            const notification =
                await Notification.findOneAndUpdate(

                    {
                        _id:
                            req.params.notificationId,

                        userId:
                            req.session.userId
                    },

                    {
                        isRead:
                            true
                    },

                    {
                        new:
                            true
                    }
                );


            if (!notification) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "FINORA notification not found."
                });
            }


            return res.status(200).json({

                success:
                    true,

                notification
            });

        } catch (error) {

            console.error(
                "❌ FINORA MARK NOTIFICATION ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not update this notification."
            });
        }
    }
);


/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
========================================================= */

router.patch(
    "/read-all",
    requireAuth,
    async (req, res) => {

        try {

            await Notification.updateMany(

                {
                    userId:
                        req.session.userId,

                    isRead:
                        false
                },

                {
                    isRead:
                        true
                }
            );


            return res.status(200).json({

                success:
                    true,

                message:
                    "FINORA notifications marked as read."
            });

        } catch (error) {

            console.error(
                "❌ FINORA MARK ALL NOTIFICATIONS ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not update your notifications."
            });
        }
    }
);


module.exports =
    router;
