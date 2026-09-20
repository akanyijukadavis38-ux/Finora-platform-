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
   4. Wallet deduction + investment + transaction
      are completed atomically
   5. Investment is created as ACTIVE
   6. Investment transaction is created as COMPLETED

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
               READ INVESTMENT AMOUNT
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
               ONLY ALLOW UP TO 2 DECIMAL PLACES
            ----------------------------------------- */

            if (
                Math.round(amount * 100) / 100 !== amount
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Investment amount can have a maximum of 2 decimal places."
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


            /* =================================================
               ATOMIC DATABASE TRANSACTION

               Wallet deduction,
               investment creation,
               transaction creation,
               and user save must all succeed together.

               If anything fails, MongoDB rolls everything back.
            ================================================= */

            const session =
                await User.startSession();


            let investment;


            try {

                await session.withTransaction(
                    async () => {

                        /* -----------------------------------------
                           DEDUCT WALLET
                        ----------------------------------------- */

                        user.balance -= amount;


                        /* -----------------------------------------
                           CREATE INVESTMENT
                        ----------------------------------------- */

                        const investments =
                            await Investment.create(
                                [
                                    {

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
                                    }
                                ],
                                {
                                    session
                                }
                            );


                        investment =
                            investments[0];


                        /* -----------------------------------------
                           CREATE TRANSACTION RECORD

                           This is the SAME investment record
                           that appears in Transaction History.
                        ----------------------------------------- */

                        await Transaction.create(
                            [
                                {

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
                                }
                            ],
                            {
                                session
                            }
                        );


                        /* -----------------------------------------
                           SAVE UPDATED WALLET
                        ----------------------------------------- */

                        await user.save({
                            session
                        });
                    }
                );

            } finally {

                await session.endSession();
            }


            /* -----------------------------------------
               SAFETY CHECK
            ----------------------------------------- */

            if (!investment) {

                return res.status(500).json({

                    success: false,

                    message:
                        "FINORA could not complete the investment."
                });
            }


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
               LOAD USER INVESTMENTS
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
