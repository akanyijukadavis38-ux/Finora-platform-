const express = require("express");

const Transaction = require("./Transaction");
const User = require("./user");
const Deposit = require("./Deposit");
const Withdrawal = require("./Withdrawal");
const ReferralCommission = require("./ReferralCommission");

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
               COLLECT RELATED IDS

               Transactions use relatedId to connect
               to deposits, withdrawals and referrals.
            ----------------------------------------- */

            const depositIds = [];
            const withdrawalIds = [];
            const referralIds = [];


            transactions.forEach(
                (transaction) => {

                    if (
                        !transaction.relatedId
                    ) {
                        return;
                    }

                    const type =
                        String(
                            transaction.type || ""
                        ).toLowerCase();


                    if (
                        type === "deposit"
                    ) {

                        depositIds.push(
                            transaction.relatedId
                        );

                    } else if (
                        type === "withdrawal"
                    ) {

                        withdrawalIds.push(
                            transaction.relatedId
                        );

                    } else if (
                        type === "referral"
                    ) {

                        referralIds.push(
                            transaction.relatedId
                        );
                    }
                }
            );


            /* -----------------------------------------
               LOAD RELATED RECORDS
            ----------------------------------------- */

            const [
                deposits,
                withdrawals,
                referralCommissions
            ] = await Promise.all([

                depositIds.length
                    ? Deposit.find({
                        _id: {
                            $in: depositIds
                        },
                        user: user._id
                    }).lean()
                    : [],

                withdrawalIds.length
                    ? Withdrawal.find({
                        _id: {
                            $in: withdrawalIds
                        },
                        user: user._id
                    }).lean()
                    : [],

                referralIds.length
                    ? ReferralCommission.find({
                        _id: {
                            $in: referralIds
                        },
                        recipient: user._id
                    }).lean()
                    : []
            ]);


            /* -----------------------------------------
               CREATE QUICK LOOKUP MAPS
            ----------------------------------------- */

            const depositMap =
                new Map(
                    deposits.map(
                        (deposit) => [
                            String(deposit._id),
                            deposit
                        ]
                    )
                );


            const withdrawalMap =
                new Map(
                    withdrawals.map(
                        (withdrawal) => [
                            String(withdrawal._id),
                            withdrawal
                        ]
                    )
                );


            const referralMap =
                new Map(
                    referralCommissions.map(
                        (referral) => [
                            String(referral._id),
                            referral
                        ]
                    )
                );


            /* -----------------------------------------
               ENRICH TRANSACTIONS

               We keep the original transaction fields
               and add related information for the
               user-side Transaction History.
            ----------------------------------------- */

            const enrichedTransactions =
                transactions.map(
                    (transaction) => {

                        const type =
                            String(
                                transaction.type || ""
                            ).toLowerCase();


                        const result = {
                            ...transaction
                        };


                        /* ---------------------------------
                           DEPOSIT DETAILS
                        --------------------------------- */

                        if (
                            type === "deposit" &&
                            transaction.relatedId
                        ) {

                            const deposit =
                                depositMap.get(
                                    String(
                                        transaction.relatedId
                                    )
                                );


                            if (deposit) {

                                result.deposit = {

                                    paymentMethod:
                                        deposit.paymentMethod,

                                    paymentReference:
                                        deposit.paymentReference,

                                    status:
                                        deposit.status,

                                    walletCredited:
                                        deposit.walletCredited
                                };


                                result.paymentMethod =
                                    deposit.paymentMethod;


                                if (
                                    !result.reference &&
                                    deposit.paymentReference
                                ) {

                                    result.reference =
                                        deposit.paymentReference;
                                }
                            }
                        }


                        /* ---------------------------------
                           WITHDRAWAL DETAILS
                        --------------------------------- */

                        if (
                            type === "withdrawal" &&
                            transaction.relatedId
                        ) {

                            const withdrawal =
                                withdrawalMap.get(
                                    String(
                                        transaction.relatedId
                                    )
                                );


                            if (withdrawal) {

                                result.withdrawal = {

                                    phoneNumber:
                                        withdrawal.phoneNumber,

                                    network:
                                        withdrawal.network,

                                    fee:
                                        withdrawal.fee,

                                    netAmount:
                                        withdrawal.netAmount,

                                    status:
                                        withdrawal.status,

                                    payoutReference:
                                        withdrawal.payoutReference,

                                    walletDeducted:
                                        withdrawal.walletDeducted
                                };


                                result.phoneNumber =
                                    withdrawal.phoneNumber;


                                result.network =
                                    withdrawal.network;


                                result.fee =
                                    withdrawal.fee;


                                result.netAmount =
                                    withdrawal.netAmount;


                                if (
                                    !result.reference &&
                                    withdrawal.payoutReference
                                ) {

                                    result.reference =
                                        withdrawal.payoutReference;
                                }
                            }
                        }


                        /* ---------------------------------
                           REFERRAL DETAILS
                        --------------------------------- */

                        if (
                            type === "referral" &&
                            transaction.relatedId
                        ) {

                            const referral =
                                referralMap.get(
                                    String(
                                        transaction.relatedId
                                    )
                                );


                            if (referral) {

                                result.referralCommission = {

                                    level:
                                        referral.level,

                                    rate:
                                        referral.rate,

                                    depositAmount:
                                        referral.depositAmount,

                                    amount:
                                        referral.amount,

                                    status:
                                        referral.status,

                                    referredUser:
                                        referral.referredUser
                                };


                                result.level =
                                    referral.level;


                                result.rate =
                                    referral.rate;
                            }
                        }


                        return result;
                    }
                );


            /* -----------------------------------------
               RETURN TRANSACTIONS
            ----------------------------------------- */

            return res.status(200).json({

                success: true,

                transactions:
                    enrichedTransactions

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
