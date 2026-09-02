const express = require("express");

const Investment = require("./investment");
const User = require("./user");

const router = express.Router();


/* =========================================================
   GET MY INVESTMENTS

   GET /api/investments/mine

   Returns only investments belonging to the
   currently authenticated FINORA user.
========================================================= */

router.get(
    "/mine",
    async (req, res) => {

        try {

            /* -----------------------------------------
               CHECK SESSION
            ----------------------------------------- */

            if (
                !req.session ||
                !req.session.userId
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "No authenticated FINORA session."
                });
            }


            /* -----------------------------------------
               FIND USER
            ----------------------------------------- */

            const user =
                await User.findById(
                    req.session.userId
                );


            if (!user) {

                req.session.destroy(
                    () => {}
                );

                return res.status(401).json({

                    success: false,

                    message:
                        "FINORA user account could not be found."
                });
            }


            /* -----------------------------------------
               CHECK ACCOUNT STATUS
            ----------------------------------------- */

            if (
                user.status === "frozen"
            ) {

                req.session.destroy(
                    () => {}
                );

                return res.status(403).json({

                    success: false,

                    message:
                        "Your FINORA account has been frozen."
                });
            }


            /* -----------------------------------------
               LOAD USER INVESTMENTS
            ----------------------------------------- */

            const investments =
                await Investment.find({
                    user: user._id
                })
                .sort({
                    createdAt: -1
                })
                .lean();


            /* -----------------------------------------
               RETURN INVESTMENTS
            ----------------------------------------- */

            return res.status(200).json({

                success: true,

                investments

            });

        } catch (error) {

            console.error(
                "❌ FINORA GET MY INVESTMENTS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load your investments."
            });
        }
    }
);


module.exports = router;
