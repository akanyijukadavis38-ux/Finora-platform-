const Admin = require("./Admin");


/* =========================================================
   FINORA ADMIN AUTHENTICATION MIDDLEWARE

   PURPOSE:
   Protect every Admin API endpoint and Admin page.

   IMPORTANT:
   - A normal FINORA user session must NOT grant Admin access.
   - Admin authentication is separate.
   - Disabled Admin accounts are denied access.
   - Global Admin session version is checked.
   - Changing the session version invalidates Admin sessions
     on every device.
========================================================= */

async function requireAdmin(req, res, next) {

    try {

        /* -----------------------------------------
           CHECK ADMIN SESSION
        ----------------------------------------- */

        if (
            !req.session ||
            !req.session.adminId
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Admin authentication required."
            });
        }


        /* -----------------------------------------
           FIND ADMIN
        ----------------------------------------- */

        const admin =
            await Admin.findById(
                req.session.adminId
            );


        if (!admin) {

            return res.status(401).json({

                success: false,

                message:
                    "Admin account could not be found."
            });
        }


        /* -----------------------------------------
           CHECK ADMIN STATUS
        ----------------------------------------- */

        if (
            admin.status !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This Admin account is disabled."
            });
        }


        /* -----------------------------------------
           CHECK GLOBAL SESSION VERSION

           Every Admin login stores the current
           Admin sessionVersion inside the session.

           If the Admin logs out globally, the
           database version changes and every older
           Admin session becomes invalid.
        ----------------------------------------- */

        if (
            typeof req.session.adminSessionVersion !==
                "number"
        ) {

            req.session.destroy(
                () => {}
            );

            return res.status(401).json({

                success: false,

                message:
                    "Admin session expired. Please log in again."
            });
        }


        if (
            req.session.adminSessionVersion !==
            admin.sessionVersion
        ) {

            req.session.destroy(
                () => {}
            );

            return res.status(401).json({

                success: false,

                message:
                    "Admin session expired. Please log in again."
            });
        }


        /* -----------------------------------------
           ATTACH ADMIN TO REQUEST
        ----------------------------------------- */

        req.admin = admin;


        /* -----------------------------------------
           CONTINUE
        ----------------------------------------- */

        next();

    } catch (error) {

        console.error(
            "❌ FINORA ADMIN AUTH ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "FINORA could not verify Admin access."
        });
    }
}


module.exports = requireAdmin;
