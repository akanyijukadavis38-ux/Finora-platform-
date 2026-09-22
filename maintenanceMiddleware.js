const SystemSettings =
    require("./SystemSettings");


/* =========================================================
   FINORA MAINTENANCE MODE MIDDLEWARE

   Blocks normal FINORA user API requests when maintenance
   mode is enabled.

   IMPORTANT:
   Admin routes are NOT placed behind this middleware.
   The daily earning processor is also NOT affected.
========================================================= */

async function maintenanceMiddleware(
    req,
    res,
    next
) {

    try {

        const settings =
            await SystemSettings.findOne()
                .select(
                    "maintenanceEnabled maintenanceMessage"
                )
                .lean();


        /*
           No settings document means maintenance is OFF.
        */

        if (
            !settings ||
            settings.maintenanceEnabled !== true
        ) {

            return next();
        }


        return res.status(503).json({

            success:
                false,

            maintenance:
                true,

            message:
                settings.maintenanceMessage ||
                "FINORA is currently undergoing scheduled maintenance. Please check back shortly."
        });

    } catch (error) {

        console.error(
            "❌ FINORA MAINTENANCE CHECK ERROR:",
            error
        );


        /*
           If the system cannot determine the maintenance
           status, do NOT lock users out accidentally.
           Allow the existing request to continue.
        */

        return next();
    }
}


module.exports =
    maintenanceMiddleware;
