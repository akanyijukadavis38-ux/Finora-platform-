const express = require("express");

const Transaction = require("./Transaction");
const User = require("./user");

const router = express.Router();


/* =========================================================
   GET USER TRANSACTIONS

   GET /api/transactions

   Used by:
   1. Dashboard Recent Transactions
   2. Records / Transaction History

   Both use the SAME transaction data.
========================================================= */

router.get(
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
               READ OPTIONAL LIMIT
               
               Dashboard can request 2 or 3.
               Records page can request a larger amount.
            ----------------------------------------- */

            let limit =
                Number(req.query.limit);


            if (
                !Number.isFinite(limit) ||
                limit < 1
            ) {

                limit = 50;
            }


            limit =
                Math.min(
                    Math.floor(limit),
                    100
                );


            /* -----------------------------------------
               LOAD TRANSACTIONS
            ----------------------------------------- */

            const transactions =
                await Transaction.find({
                    user:
                        user._id
                })
                .sort({
                    createdAt: -1
                })
                .limit(limit)
                .lean();


            /* -----------------------------------------
               RETURN TRANSACTIONS
            ----------------------------------------- */

            return res.status(200).json({

                success: true,

                transactions

            });

        } catch (error) {

            console.error(
                "❌ FINORA GET TRANSACTIONS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load your transaction records."
            });
        }
    }
);


module.exports = router;
