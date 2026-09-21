const express = require("express");
const bcrypt = require("bcryptjs");

const Admin = require("./Admin");
const requireAdmin = require("./adminAuth");

const router = express.Router();


/* =========================================================
   FINORA ADMIN LOGIN

   POST /api/admin/login

   Admin provides:
      username OR email
      password

   System:
      verifies Admin
      verifies password
      creates Admin session
========================================================= */

router.post(
    "/login",
    async (req, res) => {

        try {

            const identifier =
                String(
                    req.body.identifier || ""
                )
                .trim()
                .toLowerCase();

            const password =
                String(
                    req.body.password || ""
                );


            /* -----------------------------------------
               VALIDATE INPUT
            ----------------------------------------- */

            if (
                !identifier ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Admin username/email and password are required."
                });
            }


            /* -----------------------------------------
               FIND ADMIN
            ----------------------------------------- */

            const admin =
                await Admin.findOne({

                    $or: [
                        {
                            username:
                                identifier
                        },
                        {
                            email:
                                identifier
                        }
                    ]

                })
                .select("+passwordHash");


            if (!admin) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Admin credentials."
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
               VERIFY PASSWORD
            ----------------------------------------- */

            const passwordMatches =
                await bcrypt.compare(
                    password,
                    admin.passwordHash
                );


            if (!passwordMatches) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Admin credentials."
                });
            }


            /* -----------------------------------------
               CREATE ADMIN SESSION
            ----------------------------------------- */

            req.session.adminId =
                admin._id.toString();


            /* -----------------------------------------
               UPDATE LAST LOGIN
            ----------------------------------------- */

            admin.lastLogin =
                new Date();

            await admin.save();


            /* -----------------------------------------
               SAVE SESSION
            ----------------------------------------- */

            await new Promise(
                (resolve, reject) => {

                    req.session.save(
                        (error) => {

                            if (error) {
                                return reject(error);
                            }

                            resolve();
                        }
                    );

                }
            );


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            return res.status(200).json({

                success: true,

                message:
                    "Admin login successful.",

                admin: {

                    id:
                        admin._id,

                    username:
                        admin.username,

                    email:
                        admin.email,

                    status:
                        admin.status,

                    lastLogin:
                        admin.lastLogin
                }
            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN LOGIN ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA Admin login failed."
            });
        }
    }
);


/* =========================================================
   CHECK ADMIN SESSION

   GET /api/admin/me
========================================================= */

router.get(
    "/me",
    requireAdmin,
    async (req, res) => {

        return res.status(200).json({

            success: true,

            admin: {

                id:
                    req.admin._id,

                username:
                    req.admin.username,

                email:
                    req.admin.email,

                status:
                    req.admin.status,

                lastLogin:
                    req.admin.lastLogin
            }
        });
    }
);


/* =========================================================
   ADMIN LOGOUT

   POST /api/admin/logout
========================================================= */

router.post(
    "/logout",
    requireAdmin,
    async (req, res) => {

        try {

            req.session.destroy(
                (error) => {

                    if (error) {

                        console.error(
                            "❌ FINORA ADMIN LOGOUT ERROR:",
                            error
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Admin logout failed."
                        });
                    }


                    return res.status(200).json({

                        success: true,

                        message:
                            "Admin logged out successfully."
                    });

                }
            );

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN LOGOUT ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Admin logout failed."
            });
        }
    }
);


module.exports = router;
