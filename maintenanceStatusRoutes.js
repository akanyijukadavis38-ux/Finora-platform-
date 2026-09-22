const express = require("express");

const SystemSettings =
    require("./SystemSettings");

const router =
    express.Router();


/* =========================================================
   PUBLIC FINORA MAINTENANCE STATUS

   This endpoint exposes ONLY the maintenance status
   and the message intended for normal users.

   No admin information is returned.
========================================================= */

router.get(
    "/",
    async (req, res) => {

        try {

            const settings =
                await SystemSettings.findOne()
                    .select(
                        "maintenanceEnabled maintenanceMessage"
                    )
                    .lean();


            return res.status(200).json({

                success:
                    true,

                maintenance:
                    settings
                        ? settings.maintenanceEnabled === true
                        : false,

                message:
                    settings
                        ? settings.maintenanceMessage
                        : "FINORA is currently undergoing scheduled maintenance. Please check back shortly."
            });

        } catch (error) {

            console.error(
                "❌ FINORA MAINTENANCE STATUS ERROR:",
                error
            );


            /*
               If the maintenance status cannot be read,
               fail safely by reporting maintenance as false.
               This endpoint does not control access itself.
            */

            return res.status(200).json({

                success:
                    true,

                maintenance:
                    false,

                message:
                    ""
            });
        }
    }
);


module.exports =
    router;
