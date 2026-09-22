const express = require("express");

const Withdrawal = require("./Withdrawal");
const Transaction = require("./Transaction");
const User = require("./user");
const Notification = require("./Notification");
const Deposit = require("./Deposit");
const Investment = require("./investment");

const router = express.Router();


/* =========================================================
   FINORA WITHDRAWAL SETTINGS
========================================================= */

const MIN_WITHDRAWAL = 4000;
const WITHDRAWAL_RATE = 0.15;

/*
   IMPORTANT:
   This limit is an internal system rule.
   It is intentionally NOT exposed on the user-facing page.
*/

const MAX_WITHDRAWALS = 2;


/* =========================================================
   NETWORK DETECTION
=========================================================

   Current FINORA Uganda ranges:

   MTN:
      031
      039
      076
      077
      078
      079

   Airtel:
      070
      074
      075

   The number must be a valid 10-digit
   Uganda domestic number.

   UCC remains the authority for Uganda's
   national numbering plan.
========================================================= */

function detectNetwork(phone) {

    const normalized =
        String(phone || "")
            .replace(/\s+/g, "")
            .replace(/^\+256/, "0")
            .replace(/^256/, "0");


    if (
        !/^0\d{9}$/.test(normalized)
    ) {

        return null;
    }


    const prefix =
        normalized.substring(0, 3);


    const mtnPrefixes = [
        "031",
        "039",
        "076",
        "077",
        "078",
        "079"
    ];


    const airtelPrefixes = [
        "070",
        "074",
        "075"
    ];


    if (
        mtnPrefixes.includes(prefix)
    ) {

        return "MTN";
    }


    if (
        airtelPrefixes.includes(prefix)
    ) {

        return "Airtel";
    }


    return null;
}


/* =========================================================
   NORMALIZE PHONE NUMBER
========================================================= */

function normalizePhone(phone) {

    return String(phone || "")
        .replace(/\s+/g, "")
        .replace(/^\+256/, "0")
        .replace(/^256/, "0");
}


/* =========================================================
   CREATE WITHDRAWAL

   POST /api/withdrawals

   USER PROVIDES:
      amount

   SYSTEM PROVIDES:
      registered phone number
      network
      withdrawal fee
      net amount
      status
      transaction record

   IMPORTANT WALLET RULE:
      Deposited capital is NOT withdrawable.

      Withdrawals may only use the portion of
      the current wallet balance that is above
      the user's remaining deposited capital.

   Example:

      Approved deposits = UGX 20,000
      Investments       = UGX 10,000
      Wallet balance    = UGX 10,000

      Remaining capital = UGX 10,000
      Withdrawable      = UGX 0

      Therefore a UGX 4,000 withdrawal is rejected.

   If later:

      Wallet balance    = UGX 15,000
      Remaining capital = UGX 10,000

      Withdrawable      = UGX 5,000
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
               READ AMOUNT
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
                        "Please enter a valid withdrawal amount."
                });
            }


            if (
                amount < MIN_WITHDRAWAL
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Minimum withdrawal is UGX 4,000."
                });
            }


            /*
               Only allow amounts to two decimal places.
            */

            if (
                Math.round(amount * 100) !==
                amount * 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Withdrawal amount is invalid."
                });
            }


            /* -----------------------------------------
               CHECK REGISTERED PHONE
            ----------------------------------------- */

            const phoneNumber =
                normalizePhone(user.phone);


            if (
                !phoneNumber
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your registered Mobile Money number could not be found."
                });
            }


            /* -----------------------------------------
               DETECT NETWORK
            ----------------------------------------- */

            const network =
                detectNetwork(phoneNumber);


            if (
                !network
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your registered Mobile Money number could not be identified as MTN or Airtel."
                });
            }


            /* -----------------------------------------
               CHECK HIDDEN WITHDRAWAL LIMIT
            ----------------------------------------- */

            const withdrawalCount =
                await Withdrawal.countDocuments({
                    user: user._id,
                    status: {
                        $in: [
                            "pending",
                            "approved",
                            "completed"
                        ]
                    }
                });


            if (
                withdrawalCount >=
                MAX_WITHDRAWALS
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your withdrawal limit has been reached."
                });
            }


            /* -----------------------------------------
               CHECK CURRENT WALLET BALANCE
            ----------------------------------------- */

            const currentBalance =
                Number(user.balance || 0);


            if (
                amount > currentBalance
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Insufficient wallet balance."
                });
            }


            /* =================================================
               CHECK WITHDRAWABLE EARNED BALANCE
            =================================================

               Deposits represent capital.

               Investments consume deposited/invested
               capital first for FINORA's internal wallet
               accounting.

               Therefore:

                  Remaining capital =
                  approved deposits - investments

               Withdrawable balance =
                  current wallet - remaining capital

               Never allow the withdrawable balance
               to become negative.
            ================================================= */

            const depositResult =
                await Deposit.aggregate([

                    {
                        $match: {
                            user:
                                user._id,

                            status:
                                "approved"
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            totalDeposited: {
                                $sum: "$amount"
                            }
                        }
                    }

                ]);


            const investmentResult =
                await Investment.aggregate([

                    {
                        $match: {
                            user:
                                user._id
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            totalInvested: {
                                $sum: "$amount"
                            }
                        }
                    }

                ]);


            const totalDeposited =
                Number(
                    depositResult?.[0]
                        ?.totalDeposited || 0
                );


            const totalInvested =
                Number(
                    investmentResult?.[0]
                        ?.totalInvested || 0
                );


            const remainingCapital =
                Math.max(
                    0,
                    totalDeposited -
                    totalInvested
                );


            const withdrawableBalance =
                Math.max(
                    0,
                    currentBalance -
                    remainingCapital
                );


            /* -----------------------------------------
               BLOCK DEPOSITED CAPITAL
            ----------------------------------------- */

            if (
                amount >
                withdrawableBalance
            ) {

                const available =
                    Number(
                        withdrawableBalance.toFixed(2)
                    );


                let explanation;


                if (
                    available <= 0
                ) {

                    explanation =
                        "This amount is currently part of your deposited investment capital. Withdrawals are available from eligible earnings and referral income.";
                } else {

                    explanation =
                        `You requested ${`UGX ${amount.toLocaleString()}`}, but only ${`UGX ${available.toLocaleString()}`} is currently available from eligible earnings and referral income. The remaining wallet balance is deposited investment capital.`;
                }


                return res.status(403).json({

                    success: false,

                    code:
                        "CAPITAL_NOT_WITHDRAWABLE",

                    message:
                        explanation,

                    walletBalance:
                        currentBalance,

                    withdrawableBalance:
                        available,

                    remainingCapital:
                        Number(
                            remainingCapital.toFixed(2)
                        )
                });
            }


            /* -----------------------------------------
               CALCULATE FEE
            ----------------------------------------- */

            const fee =
                Number(
                    (
                        amount *
                        WITHDRAWAL_RATE
                    ).toFixed(2)
                );


            /* -----------------------------------------
               CALCULATE NET AMOUNT
            ----------------------------------------- */

            const netAmount =
                Number(
                    (
                        amount -
                        fee
                    ).toFixed(2)
                );


            if (
                netAmount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Withdrawal amount is invalid."
                });
            }


            /* -----------------------------------------
               DEDUCT WALLET BALANCE
            -----------------------------------------

               The full requested amount is deducted.

               Example:

               Requested:
               UGX 10,000

               Fee:
               UGX 1,500

               User receives:
               UGX 8,500

               Wallet deduction:
               UGX 10,000
            */

            user.balance =
                Number(
                    (
                        currentBalance -
                        amount
                    ).toFixed(2)
                );


            user.totalWithdrawal =
                Number(
                    (
                        Number(
                            user.totalWithdrawal || 0
                        ) +
                        amount
                    ).toFixed(2)
                );


            /* -----------------------------------------
               CREATE WITHDRAWAL RECORD
            ----------------------------------------- */

            const withdrawal =
                await Withdrawal.create({

                    user:
                        user._id,

                    amount:
                        amount,

                    fee:
                        fee,

                    netAmount:
                        netAmount,

                    phoneNumber:
                        phoneNumber,

                    network:
                        network,

                    status:
                        "pending",

                    walletDeducted:
                        true,

                    walletDeductedAt:
                        new Date()
                });


            /* -----------------------------------------
               CREATE TRANSACTION RECORD
            ----------------------------------------- */

            const transaction =
                await Transaction.create({

                    user:
                        user._id,

                    type:
                        "withdrawal",

                    amount:
                        amount,

                    direction:
                        "debit",

                    status:
                        "pending",

                    description:
                        "FINORA Mobile Money withdrawal",

                    reference:
                        `WD-${withdrawal._id}`,

                    relatedId:
                        withdrawal._id
                });


            /* -----------------------------------------
               LINK TRANSACTION TO WITHDRAWAL
            ----------------------------------------- */

            withdrawal.transactionId =
                transaction._id;


            await withdrawal.save();


            /* -----------------------------------------
               SAVE USER
            ----------------------------------------- */

            await user.save();


            /* -----------------------------------------
               CREATE WITHDRAWAL SUBMISSION NOTIFICATION
            ----------------------------------------- */

            await Notification.create({

                userId:
                    user._id,

                type:
                    "withdrawal_submitted",

                title:
                    "Withdrawal Submitted",

                message:
                    `Your UGX ${amount.toLocaleString()} withdrawal request has been submitted and is pending processing.`,

                isRead:
                    false
            });


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            return res.status(201).json({

                success: true,

                message:
                    "Withdrawal request submitted successfully and is pending processing.",

                withdrawal: {

                    id:
                        withdrawal._id,

                    amount:
                        withdrawal.amount,

                    fee:
                        withdrawal.fee,

                    netAmount:
                        withdrawal.netAmount,

                    phoneNumber:
                        withdrawal.phoneNumber,

                    network:
                        withdrawal.network,

                    status:
                        withdrawal.status,

                    createdAt:
                        withdrawal.createdAt
                },

                walletBalance:
                    user.balance
            });

        } catch (error) {

            console.error(
                "❌ FINORA CREATE WITHDRAWAL ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not submit your withdrawal."
            });
        }
    }
);


/* =========================================================
   GET MY WITHDRAWALS

   GET /api/withdrawals/mine
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
               LOAD USER WITHDRAWALS
            ----------------------------------------- */

            const withdrawals =
                await Withdrawal.find({
                    user:
                        user._id
                })
                .sort({
                    createdAt: -1
                })
                .lean();


            /* -----------------------------------------
               RETURN WITHDRAWALS
            ----------------------------------------- */

            return res.status(200).json({

                success: true,

                withdrawals:
                    withdrawals
            });

        } catch (error) {

            console.error(
                "❌ FINORA GET MY WITHDRAWALS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load your withdrawals."
            });
        }
    }
);


module.exports = router;
