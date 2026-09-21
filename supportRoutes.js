const express = require("express");

const Support = require("./Support");
const User = require("./user");

const router = express.Router();


/* =========================================================
   CREATE SUPPORT REQUEST

   POST /api/support

   USER PROVIDES:
      category
      subject
      message

   SYSTEM PROVIDES:
      authenticated user
      status
      timestamps
========================================================= */

router.post(
    "/",
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
               READ REQUEST DATA
            ----------------------------------------- */

            const category =
                String(
                    req.body.category || ""
                ).trim();

            const subject =
                String(
                    req.body.subject || ""
                ).trim();

            const message =
                String(
                    req.body.message || ""
                ).trim();


            /* -----------------------------------------
               VALIDATE CATEGORY
            ----------------------------------------- */

            const allowedCategories = [
                "deposit",
                "investment",
                "withdrawal",
                "referral",
                "account",
                "other"
            ];


            if (
                !allowedCategories.includes(
                    category
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please select a valid support category."
                });
            }


            /* -----------------------------------------
               VALIDATE SUBJECT
            ----------------------------------------- */

            if (
                !subject
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a support subject."
                });
            }


            if (
                subject.length > 120
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Support subject is too long."
                });
            }


            /* -----------------------------------------
               VALIDATE MESSAGE
            ----------------------------------------- */

            if (
                !message
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your support message."
                });
            }


            if (
                message.length > 1000
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Support message is too long."
                });
            }


            /* -----------------------------------------
               CREATE SUPPORT TICKET
            ----------------------------------------- */

            const supportRequest =
                await Support.create({

                    user:
                        user._id,

                    category:
                        category,

                    subject:
                        subject,

                    message:
                        message,

                    status:
                        "open"
                });


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            return res.status(201).json({

                success: true,

                message:
                    "Your FINORA support request has been submitted successfully.",

                supportRequest: {

                    id:
                        supportRequest._id,

                    category:
                        supportRequest.category,

                    subject:
                        supportRequest.subject,

                    message:
                        supportRequest.message,

                    status:
                        supportRequest.status,

                    createdAt:
                        supportRequest.createdAt
                }

            });

        } catch (error) {

            console.error(
                "❌ FINORA CREATE SUPPORT REQUEST ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not submit your support request."
            });
        }
    }
);


/* =========================================================
   GET MY SUPPORT REQUESTS

   GET /api/support/mine

   Returns only requests belonging to the
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
               LOAD USER SUPPORT REQUESTS
            ----------------------------------------- */

            const supportRequests =
                await Support.find({
                    user:
                        user._id
                })
                .sort({
                    createdAt: -1
                })
                .lean();


            /* -----------------------------------------
               RETURN REQUESTS
            ----------------------------------------- */

            return res.status(200).json({

                success: true,

                supportRequests:
                    supportRequests

            });

        } catch (error) {

            console.error(
                "❌ FINORA GET MY SUPPORT REQUESTS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load your support requests."
            });
        }
    }
);


module.exports = router;
