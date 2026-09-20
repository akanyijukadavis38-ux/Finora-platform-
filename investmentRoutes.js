const express = require("express");

const Investment = require("./investment");
const User = require("./user");
const Transaction = require("./Transaction");

const router = express.Router();


/* =========================================================
   FINORA INVEST SETTINGS
========================================================= */

const MIN_INVESTMENT = 10000;
const DAILY_RATE = 10;
const INVESTMENT_DURATION = 20;


/* =========================================================
   CREATE INVEST

   POST /api/investments

   USER:
   1. Must be authenticated
   2. Enters any amount >= UGX 10,000
   3. Amount must be available in wallet
   4. Amount is deducted from wallet
   5. Invest record is created as ACTIVE
   6. Transaction record is created for RECORDS

   IMPORTANT:
   Invest money comes only from the user's
   existing FINORA wallet balance.
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
               READ INVEST AMOUNT
            ----------------------------------------- */

            const amount =
                Number(req.body.amount);


            /* -----------------------------------------
               VALIDATE AMOUNT
            ----------------------------------------- */

            if (
                !Number.isFinite(amount)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid investment amount."
                });
            }


            if (
                amount < MIN_INVESTMENT
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Minimum investment is UGX 10,000."
                });
            }


            /* -----------------------------------------
               CHECK WALLET BALANCE
            ----------------------------------------- */

            if (
                amount > user.balance
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Insufficient wallet balance."
                });
            }


            /* -----------------------------------------
               CALCULATE DAILY EARNINGS
            ----------------------------------------- */

            const dailyEarnings =
                amount *
                (DAILY_RATE / 100);


            /* -----------------------------------------
               CALCULATE DATES
            ----------------------------------------- */

            const startDate =
                new Date();

            const endDate =
                new Date(startDate);

            endDate.setDate(
                endDate.getDate() +
                INVESTMENT_DURATION
            );


            /* -----------------------------------------
               DEDUCT FROM WALLET
            ----------------------------------------- */

            user.balance -= amount;


            /* -----------------------------------------
               CREATE INVEST
            ----------------------------------------- */

            const investment =
                await Investment.create({

                    user:
                        user._id,

                    amount:
                        amount,

                    dailyRate:
                        DAILY_RATE,

                    dailyEarnings:
                        dailyEarnings,

                    duration:
                        INVESTMENT_DURATION,

                    earned:
                        0,

                    daysCompleted:
                        0,

                    daysRemaining:
                        INVESTMENT_DURATION,

                    startDate:
                        startDate,

                    endDate:
                        endDate,

                    status:
                        "active"
                });


            /* -----------------------------------------
               CREATE TRANSACTION RECORD

               This connects INVEST with
               RECORDS / TRANSACTION HISTORY.
            ----------------------------------------- */

            await Transaction.create({

                user:
                    user._id,

                type:
                    "investment",

                amount:
                    amount,

                direction:
                    "debit",

                status:
                    "completed",

                description:
                    "FINORA investment",

                relatedId:
                    investment._id
            });


            /* -----------------------------------------
               SAVE UPDATED WALLET
            ----------------------------------------- */

            await user.save();


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            return res.status(201).json({

                success: true,

                message:
                    "Investment created successfully.",

                investment: {

                    id:
                        investment._id,

                    amount:
                        investment.amount,

                    dailyRate:
                        investment.dailyRate,

                    dailyEarnings:
                        investment.dailyEarnings,

                    duration:
                        investment.duration,

                    earned:
                        investment.earned,

                    daysCompleted:
                        investment.daysCompleted,

                    daysRemaining:
                        investment.daysRemaining,

                    startDate:
                        investment.startDate,

                    endDate:
                        investment.endDate,

                    status:
                        investment.status
                },

                walletBalance:
                    user.balance
            });

        } catch (error) {

            console.error(
                "❌ FINORA CREATE INVEST ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not create your investment."
            });
        }
    }
);


/* =========================================================
   GET MY INVESTMENTS

   GET /api/investments/mine

   This is the data used by MINE /
   MY INVESTMENTS.
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
               LOAD USER INVESTS
            ----------------------------------------- */

            const investments =
                await Investment.find({
                    user:
                        user._id
                })
                .sort({
                    createdAt: -1
                })
                .lean();


            /* -----------------------------------------
               RETURN INVESTS
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
