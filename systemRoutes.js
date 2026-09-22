const express = require("express");

const SystemSettings =
    require("./SystemSettings");

const requireAdmin =
    require("./adminAuth");

const router =
    express.Router();


/* =========================================================
   GET SYSTEM SETTINGS
   ADMIN ONLY
========================================================= */

router.get(
    "/",
    requireAdmin,
    async (req, res) => {

        try {

            let settings =
                await SystemSettings.findOne();

            if (!settings) {

                settings =
                    await SystemSettings.create({
                        maintenanceEnabled:
                            false
                    });
            }


            return res.status(200).json({

                success:
                    true,

                settings: {

                    maintenanceEnabled:
                        settings.maintenanceEnabled,

                    maintenanceMessage:
                        settings.maintenanceMessage
                }
            });

        } catch (error) {

            console.error(
                "❌ FINORA GET SYSTEM SETTINGS ERROR:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not load system settings."
            });
        }
    }
);


/* =========================================================
   UPDATE MAINTENANCE MODE
   ADMIN ONLY
========================================================= */

router.patch(
    "/maintenance",
    requireAdmin,
    async (req, res) => {

        try {

            const {
                enabled,
                message
            } = req.body;


            if (
                typeof enabled !==
                "boolean"
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Maintenance status must be true or false."
                });
            }


            let maintenanceMessage =
                "FINORA is currently undergoing scheduled maintenance. Please check back shortly.";


            if (
                typeof message ===
                    "string" &&
                message.trim()
            ) {

                maintenanceMessage =
                    message.trim();
            }


            let settings =
                await SystemSettings.findOne();


            if (!settings) {

                settings =
                    new SystemSettings();
            }


            settings.maintenanceEnabled =
                enabled;

            settings.maintenanceMessage =
                maintenanceMessage;


            await settings.save();


            return res.status(200).json({

                success:
                    true,

                message:
                    enabled
                        ? "FINORA maintenance mode enabled."
                        : "FINORA maintenance mode disabled.",

                settings: {

                    maintenanceEnabled:
                        settings.maintenanceEnabled,

                    maintenanceMessage:
                        settings.maintenanceMessage
                }
            });

        } catch (error) {

            console.error(
                "❌ FINORA UPDATE MAINTENANCE ERROR:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not update maintenance mode."
            });
        }
    }
);


module.exports =
    router;
