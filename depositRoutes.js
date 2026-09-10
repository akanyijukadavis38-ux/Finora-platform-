const express = require("express");

const Deposit = require("./Deposit");
const User = require("./user");

const router = express.Router();


/* =========================================================
   FINORA DEPOSIT SETTINGS
========================================================= */

const MIN_DEPOSIT = 10000;

const MERCHANT_CODES = {
    MTN: "52200475",
    Airtel: "7157334"
};


/* =========================================================
   SUBMIT DEPOSIT

   POST /api/deposits

   USER:
   1. Selects MTN or Airtel
   2. Enters amount
   3. Completes Mobile Money payment
   4. Enters transaction/reference number
   5. Submits deposit

   RESULT:
   Deposit is created as PENDING.

   IMPORTANT:
   No wallet money is added here.
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

            const amount =
                Number(req.body.amount);

            const paymentMethod =
                String(
                    req.body.paymentMethod || ""
                ).trim();

            const paymentReference =
                String(
                    req.body.paymentReference || ""
                ).trim();


            /* -----------------------------------------
               VALIDATE AMOUNT
            ----------------------------------------- */

            if (
                !Number.isFinite(amount)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid deposit amount."
                });
            }


            if (
                amount < MIN_DEPOSIT
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Minimum deposit is UGX 10,000."
                });
            }


            /* -----------------------------------------
               VALIDATE PAYMENT METHOD
            ----------------------------------------- */

            if (
                !Object.prototype.hasOwnProperty.call(
                    MERCHANT_CODES,
                    paymentMethod
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please select MTN or Airtel Mobile Money."
                });
            }


            /* -----------------------------------------
               VALIDATE PAYMENT REFERENCE
            ----------------------------------------- */

            if (
                !paymentReference
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your Mobile Money transaction reference."
                });
            }


            if (
                paymentReference.length < 4 ||
                paymentReference.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid payment reference."
                });
            }


            /* -----------------------------------------
               GET CORRECT MERCHANT CODE
            ----------------------------------------- */

            const merchantCode =
                MERCHANT_CODES[
                    paymentMethod
                ];


            /* -----------------------------------------
               CHECK DUPLICATE PAYMENT REFERENCE
            ----------------------------------------- */

            const existingDeposit =
                await Deposit.findOne({
                    paymentReference:
                        paymentReference
                });


            if (
                existingDeposit
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This payment reference has already been submitted."
                });
            }


            /* -----------------------------------------
               CREATE PENDING DEPOSIT
            ----------------------------------------- */

            const deposit =
                await Deposit.create({

                    user:
                        user._id,

                    amount:
                        amount,

                    paymentMethod:
                        paymentMethod,

                    merchantCode:
                        merchantCode,

                    paymentReference:
                        paymentReference,

                    status:
                        "pending",

                    walletCredited:
                        false,

                    referralProcessed:
                        false
                });


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            return res.status(201).json({

                success: true,

                message:
                    "Deposit submitted successfully and is pending verification.",

                deposit: {

                    id:
                        deposit._id,

                    amount:
                        deposit.amount,

                    paymentMethod:
                        deposit.paymentMethod,

                    merchantCode:
                        deposit.merchantCode,

                    paymentReference:
                        deposit.paymentReference,

                    status:
                        deposit.status,

                    createdAt:
                        deposit.createdAt
                }
            });

        } catch (error) {

            console.error(
                "❌ FINORA CREATE DEPOSIT ERROR:",
                error
            );


            /* -----------------------------------------
               MONGOOSE DUPLICATE KEY
            ----------------------------------------- */

            if (
                error.code === 11000
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This payment reference has already been submitted."
                });
            }


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not submit your deposit."
            });
        }
    }
);


/* =========================================================
   GET MY DEPOSITS

   GET /api/deposits/mine

   Returns deposits belonging only to the authenticated
   FINORA user.
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
               LOAD USER DEPOSITS
            ----------------------------------------- */

            const deposits =
                await Deposit.find({
                    user:
                        user._id
                })
                .sort({
                    createdAt: -1
                })
                .lean();


            /* -----------------------------------------
               RETURN DEPOSITS
            ----------------------------------------- */

            return res.status(200).json({

                success: true,

                deposits:
                    deposits
            });

        } catch (error) {

            console.error(
                "❌ FINORA GET MY DEPOSITS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load your deposits."
            });
        }
    }
);


module.exports = router;
