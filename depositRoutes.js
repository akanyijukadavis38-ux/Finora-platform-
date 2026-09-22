const express = require("express");
const Deposit = require("./Deposit");
const Transaction = require("./Transaction");
const User = require("./user");
const Notification = require("./Notification");
const Admin = require("./Admin");


const router = express.Router();


/* =========================================================
   FINORA DEPOSIT SETTINGS
========================================================= */

const MIN_DEPOSIT = 10000;

const MERCHANT_CODES = {
    MTN: "26127911",
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
   A matching Transaction record is also created.

   NOTIFICATIONS:
   - User receives deposit submitted notification.
   - Active admin receives new deposit notification.

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
               CREATE MATCHING TRANSACTION RECORD
            ----------------------------------------- */

            const transaction =
                await Transaction.create({

                    user:
                        user._id,

                    type:
                        "deposit",

                    amount:
                        amount,

                    direction:
                        "credit",

                    status:
                        "pending",

                    description:
                        "FINORA Mobile Money deposit",

                    reference:
                        paymentReference,

                    relatedId:
                        deposit._id
                });


            /* -----------------------------------------
               FIND ACTIVE ADMIN
            ----------------------------------------- */

            const admin =
                await Admin.findOne({
                    status: "active"
                })
                .select("_id")
                .lean();


            /* -----------------------------------------
               CREATE USER DEPOSIT NOTIFICATION
            ----------------------------------------- */

            await Notification.create({

                userId:
                    user._id,

                type:
                    "deposit_submitted",

                title:
                    "Deposit Submitted",

                message:
                    `Your UGX ${amount.toLocaleString()} deposit has been submitted and is pending verification.`,

                isRead:
                    false
            });


            /* -----------------------------------------
               CREATE ADMIN DEPOSIT NOTIFICATION
            ----------------------------------------- */

            if (
                admin
            ) {

                await Notification.create({

                    adminId:
                        admin._id,

                    type:
                        "deposit_submitted",

                    title:
                        "New Deposit Request",

                    message:
                        `${user.fullName} (${user.phone}) submitted a UGX ${amount.toLocaleString()} deposit via ${paymentMethod}. Payment reference: ${paymentReference}.`,

                    isRead:
                        false
                });
            }


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
                },

                transaction: {

                    id:
                        transaction._id,

                    type:
                        transaction.type,

                    amount:
                        transaction.amount,

                    direction:
                        transaction.direction,

                    status:
                        transaction.status,

                    reference:
                        transaction.reference,

                    createdAt:
                        transaction.createdAt
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


module.exports =
    router;
