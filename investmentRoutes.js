const express = require("express");
const router = express.Router();

const User = require("./user");
const Investment = require("./investment");
const Transaction = require("./Transaction");


/* =========================================================
   FINORA INVESTMENT SETTINGS
========================================================= */

const MIN_INVESTMENT = 10000;
const DAILY_RATE = 10;
const INVESTMENT_DURATION = 20;


/* =========================================================
   CREATE INVESTMENT
   POST /api/investments
========================================================= */

router.post(
    "/",
    async (req, res) => {

        const session =
            await User.startSession();

        try {

            /* =================================================
               AUTHENTICATION
            ================================================= */

            if (
                !req.session ||
                !req.session.userId
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Please log in to invest."
                });
            }


            /* =================================================
               START TRANSACTION
            ================================================= */

            let createdInvestment;


            await session.withTransaction(
                async () => {

                    /* =========================================
                       GET CURRENT USER INSIDE TRANSACTION
                    ========================================= */

                    const user =
                        await User.findById(
                            req.session.userId
                        ).session(session);


                    if (!user) {

                        const error =
                            new Error(
                                "User account not found."
                            );

                        error.statusCode = 401;

                        throw error;
                    }


                    /* =========================================
                       ACCOUNT STATUS
                    ========================================= */

                    if (
                        user.status === "frozen"
                    ) {

                        const error =
                            new Error(
                                "Your FINORA account is frozen."
                            );

                        error.statusCode = 403;

                        throw error;
                    }


                    /* =========================================
                       AMOUNT
                    ========================================= */

                    const amount =
                        Number(req.body.amount);


                    if (
                        !Number.isFinite(amount)
                    ) {

                        const error =
                            new Error(
                                "Please enter a valid investment amount."
                            );

                        error.statusCode = 400;

                        throw error;
                    }


                    if (
                        amount < MIN_INVESTMENT
                    ) {

                        const error =
                            new Error(
                                `Minimum investment is UGX ${MIN_INVESTMENT.toLocaleString("en-UG")}.`
                            );

                        error.statusCode = 400;

                        throw error;
                    }


                    /* =========================================
                       MAXIMUM TWO DECIMAL PLACES
                    ========================================= */

                    if (
                        Math.round(
                            amount * 100
                        ) !==
                        Math.round(amount) * 100
                    ) {

                        /*
                           This condition intentionally does not
                           reject normal whole-number UGX amounts.

                           The actual decimal validation is below.
                        */
                    }


                    const decimalAmount =
                        Math.round(
                            amount * 100
                        ) / 100;


                    if (
                        Math.abs(
                            amount - decimalAmount
                        ) > 0.000001
                    ) {

                        const error =
                            new Error(
                                "Investment amount can have a maximum of two decimal places."
                            );

                        error.statusCode = 400;

                        throw error;
                    }


                    /* =========================================
                       WALLET CHECK
                    ========================================= */

                    if (
                        amount > user.balance
                    ) {

                        const error =
                            new Error(
                                "Insufficient wallet balance."
                            );

                        error.statusCode = 400;

                        throw error;
                    }


                    /* =========================================
                       INVESTMENT TIMING
                    ========================================= */

                    const startDate =
                        new Date();


                    const endDate =
                        new Date(
                            startDate.getTime() +
                            (
                                INVESTMENT_DURATION *
                                24 *
                                60 *
                                60 *
                                1000
                            )
                        );


                    const nextEarningAt =
                        new Date(
                            startDate.getTime() +
                            (
                                24 *
                                60 *
                                60 *
                                1000
                            )
                        );


                    /* =========================================
                       DAILY EARNING
                    ========================================= */

                    const dailyEarnings =
                        Math.round(
                            (
                                amount *
                                (
                                    DAILY_RATE /
                                    100
                                )
                            ) *
                            100
                        ) / 100;


                    /* =========================================
                       CREATE INVESTMENT
                    ========================================= */

                    const investment =
                        new Investment({

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

                            nextEarningAt:
                                nextEarningAt,

                            status:
                                "active"
                        });


                    await investment.save({
                        session
                    });


                    /* =========================================
                       DEDUCT INVESTMENT FROM WALLET
                    ========================================= */

                    user.balance =
                        Math.round(
                            (
                                user.balance -
                                amount
                            ) *
                            100
                        ) / 100;


                    await user.save({
                        session
                    });


                    /* =========================================
                       CREATE INVESTMENT TRANSACTION
                    ========================================= */

                    const transaction =
                        new Transaction({

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

                            reference:
                                `INV-${investment._id}`,

                            relatedId:
                                investment._id
                        });


                    await transaction.save({
                        session
                    });


                    createdInvestment =
                        investment;

                    /* =========================================
                       SAVE TRANSACTION ID
                       ONLY IF MODEL SUPPORTS IT
                    ========================================= */

                    /*
                       The Investment model currently does not
                       contain a transactionId field, so we do
                       not add an unsupported field here.
                    */
                }
            );


            /* =================================================
               RESPONSE
            ================================================= */

            const updatedUser =
                await User.findById(
                    req.session.userId
                ).select("balance");


            return res.status(201).json({

                success:
                    true,

                message:
                    "Investment created successfully.",

                investment:
                    createdInvestment,

                walletBalance:
                    updatedUser
                        ? updatedUser.balance
                        : null
            });


        } catch (error) {

            console.error(
                "❌ FINORA INVESTMENT ERROR:",
                error
            );


            return res.status(
                error.statusCode || 500
            ).json({

                success:
                    false,

                message:
                    error.statusCode
                        ? error.message
                        : "FINORA could not create your investment."
            });


        } finally {

            await session.endSession();

        }
    }
);


/* =========================================================
   GET MY INVESTMENTS
   GET /api/investments/mine
========================================================= */

router.get(
    "/mine",
    async (req, res) => {

        try {

            /* =================================================
               AUTHENTICATION
            ================================================= */

            if (
                !req.session ||
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Please log in."
                });
            }


            /* =================================================
               USER CHECK
            ================================================= */

            const user =
                await User.findById(
                    req.session.userId
                );


            if (!user) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "User account not found."
                });
            }


            if (
                user.status === "frozen"
            ) {

                return res.status(403).json({

                    success:
                        false,

                    message:
                        "Your FINORA account is frozen."
                });
            }


            /* =================================================
               GET INVESTMENTS
            ================================================= */

            const investments =
                await Investment.find({
                    user:
                        user._id
                })
                .sort({
                    createdAt:
                        -1
                });


            return res.status(200).json({

                success:
                    true,

                investments

            });


        } catch (error) {

            console.error(
                "❌ FINORA GET INVESTMENTS ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "FINORA could not load your investments."
            });
        }
    }
);


module.exports = router;
