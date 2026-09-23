const express = require("express");
const mongoose = require("mongoose");

const Deposit = require("./Deposit");
const Transaction = require("./Transaction");
const User = require("./user");
const Notification = require("./Notification");
const requireAdmin = require("./adminAuth");

const {
    processFirstDepositReferralCommission
} = require("./referralCommissionProcessor");
const {
    sendPushToUser
} = require("./pushService");

const router = express.Router();


/* =========================================================
   FINORA ADMIN DEPOSIT ROUTES

   PURPOSE:

   ADMIN APPROVAL
      ↓
   DEPOSIT APPROVED
      ↓
   USER WALLET CREDITED ONCE
      ↓
   TOTAL DEPOSIT UPDATED
      ↓
   TRANSACTION COMPLETED
      ↓
   FIRST-DEPOSIT REFERRAL PROCESSOR
      ↓
   USER NOTIFICATION
      ↓
   ADMIN NOTIFICATION

   ADMIN REJECTION
      ↓
   DEPOSIT REJECTED
      ↓
   NO WALLET CREDIT
      ↓
   NO REFERRAL COMMISSION
      ↓
   TRANSACTION REJECTED
      ↓
   USER NOTIFICATION
      ↓
   ADMIN NOTIFICATION

   IMPORTANT:

   - Admin authentication required
   - MongoDB transaction used
   - Wallet cannot be credited twice
   - Referral cannot be processed twice
   - Approval does NOT activate the user
   - User and admin notifications are separated
========================================================= */


/* =========================================================
   GET ALL DEPOSITS

   Admin can view:
   - pending
   - approved
   - rejected

   Optional query:
   ?status=pending
   ?status=approved
   ?status=rejected
========================================================= */

router.get(
    "/",
    requireAdmin,
    async (req, res) => {

        try {

            const filter = {};

            const requestedStatus =
                String(
                    req.query.status || ""
                ).trim().toLowerCase();


            if (
                requestedStatus &&
                ["pending", "approved", "rejected"].includes(
                    requestedStatus
                )
            ) {

                filter.status =
                    requestedStatus;
            }


            const deposits =
                await Deposit.find(filter)
                    .populate(
                        "user",
                        "_id fullName phone email balance totalDeposit totalWithdrawal totalIncome referralCode referredByCode status"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            return res.json({

                success: true,

                deposits

            });


        } catch (error) {

            console.error(
                "❌ ADMIN GET DEPOSITS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load deposits."

            });
        }
    }
);


/* =========================================================
   APPROVE DEPOSIT

   POST:
   /api/admin/deposits/:id/approve

   FLOW:

   1. Find pending deposit
   2. Find user
   3. Credit wallet exactly once
   4. Increase totalDeposit
   5. Mark deposit approved
   6. Mark walletCredited true
   7. Complete deposit transaction
   8. Process first-deposit referral commission
   9. Create USER notification
   10. Create ADMIN notification
   11. Commit everything together
========================================================= */

router.post(
    "/:id/approve",
    requireAdmin,
    async (req, res) => {

        const depositId =
            req.params.id;


        /* =================================================
           VALIDATE OBJECT ID
        ================================================= */

        if (
            !mongoose.Types.ObjectId.isValid(
                depositId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid deposit ID."

            });
        }


        const session =
            await mongoose.startSession();


        try {

            session.startTransaction();


            /* =================================================
               LOAD DEPOSIT
            ================================================= */

            const deposit =
                await Deposit.findById(
                    depositId
                ).session(session);


            if (!deposit) {

                throw new Error(
                    "Deposit not found."
                );
            }


            /* =================================================
               IDEMPOTENCY CHECK

               If already approved and wallet credited,
               approval has already been completed.

               DO NOT CREDIT AGAIN.
            ================================================= */

            if (
                deposit.status === "approved" &&
                deposit.walletCredited === true
            ) {

                await session.abortTransaction();


                return res.json({

                    success: true,

                    alreadyProcessed: true,

                    message:
                        "Deposit has already been approved and credited."

                });
            }


            /* =================================================
               REJECTED DEPOSITS CANNOT BE APPROVED
            ================================================= */

            if (
                deposit.status === "rejected"
            ) {

                throw new Error(
                    "A rejected deposit cannot be approved."
                );
            }


            /* =================================================
               ONLY PENDING DEPOSITS CAN BE APPROVED
            ================================================= */

            if (
                deposit.status !== "pending"
            ) {

                throw new Error(
                    "Only pending deposits can be approved."
                );
            }


            /* =================================================
               SAFETY CHECK

               A pending deposit must never already have
               walletCredited=true.
            ================================================= */

            if (
                deposit.walletCredited === true
            ) {

                throw new Error(
                    "Deposit has an inconsistent wallet-credit state."
                );
            }


            /* =================================================
               LOAD USER
            ================================================= */

            const user =
                await User.findById(
                    deposit.user
                ).session(session);


            if (!user) {

                throw new Error(
                    "Deposit owner not found."
                );
            }


            /* =================================================
               DO NOT CREDIT FROZEN USERS
            ================================================= */

            if (
                user.status === "frozen"
            ) {

                throw new Error(
                    "Cannot approve a deposit for a frozen user."
                );
            }


            /* =================================================
               CREDIT USER WALLET

               THIS IS THE ONLY WALLET CREDIT FOR THE DEPOSIT.
            ================================================= */

            const depositAmount =
                Number(
                    deposit.amount
                );


            if (
                !Number.isFinite(
                    depositAmount
                ) ||
                depositAmount < 10000
            ) {

                throw new Error(
                    "Invalid deposit amount."
                );
            }


            user.balance =
                Number(
                    user.balance || 0
                ) +
                depositAmount;


            user.totalDeposit =
                Number(
                    user.totalDeposit || 0
                ) +
                depositAmount;


            await user.save({
                session
            });


            /* =================================================
               MARK DEPOSIT APPROVED
            ================================================= */

            deposit.status =
                "approved";

            deposit.processedAt =
                new Date();

            deposit.processedBy =
                req.admin.username;

            deposit.rejectionReason =
                null;

            deposit.walletCredited =
                true;

            deposit.walletCreditedAt =
                new Date();


            await deposit.save({
                session
            });


            /* =================================================
               UPDATE EXISTING DEPOSIT TRANSACTION
            ================================================= */

            const depositTransaction =
                await Transaction.findOne({

                    user:
                        user._id,

                    type:
                        "deposit",

                    relatedId:
                        deposit._id

                }).session(session);


            if (
                depositTransaction
            ) {

                depositTransaction.status =
                    "completed";

                depositTransaction.description =
                    "FINORA Mobile Money deposit approved and credited";

                depositTransaction.reference =
                    deposit.paymentReference;


                await depositTransaction.save({
                    session
                });

            } else {

                /* ---------------------------------------------
                   SAFETY FALLBACK
                --------------------------------------------- */

                const transaction =
                    new Transaction({

                        user:
                            user._id,

                        type:
                            "deposit",

                        amount:
                            depositAmount,

                        direction:
                            "credit",

                        status:
                            "completed",

                        description:
                            "FINORA Mobile Money deposit approved and credited",

                        reference:
                            deposit.paymentReference,

                        relatedId:
                            deposit._id
                    });


                await transaction.save({
                    session
                });
            }


            /* =================================================
               FIRST-DEPOSIT REFERRAL COMMISSION
            ================================================= */

            const referralResult =
                await processFirstDepositReferralCommission(
                    deposit._id,
                    session
                );


            /* =================================================
               USER NOTIFICATION
            ================================================= */

            const userNotification =
                new Notification({

                    userId:
                        user._id,

                    type:
                        "deposit_approved",

                    title:
                        "Deposit Approved",

                    message:
                        `UGX ${depositAmount.toLocaleString()} deposit has been approved and credited to your FINORA wallet.`,

                    isRead:
                        false
                });


            await userNotification.save({
                session
            });


            /* =================================================
               ADMIN NOTIFICATION

               This notification belongs to the admin,
               NOT the depositing user.
            ================================================= */

            const adminNotification =
                new Notification({

                    adminId:
                        req.admin._id,

                    type:
                        "deposit_approved",

                    title:
                        "Deposit Approved",

                    message:
                        `UGX ${depositAmount.toLocaleString()} deposit from ${user.fullName} (${user.phone}) was approved and credited.`,

                    isRead:
                        false
                });


            await adminNotification.save({
                session
            });

/* =================================================
   COMMIT EVERYTHING
================================================= */

await session.commitTransaction();


/* =================================================
   REFERRAL COMMISSION DEVICE PUSH
=================================================

   IMPORTANT:

   The database transaction has now successfully
   committed.

   Only now do we send device push notifications.

   If a push fails, the approved deposit and
   referral commissions remain successful.
================================================= */

if (
    referralResult &&
    Array.isArray(
        referralResult.commissions
    )
) {

    for (
        const commission
        of referralResult.commissions
    ) {

        if (
            !commission.notification
        ) {
            continue;
        }

        try {

            await sendPushToUser(

                commission.recipient,

                commission.notification

            );

        } catch (pushError) {

            console.error(
                "❌ FINORA REFERRAL COMMISSION PUSH FAILED:",
                pushError
            );

        }

    }

}
/* =================================================
   DEPOSIT APPROVED DEVICE PUSH
================================================= */

try {

    await sendPushToUser(
        userNotification.userId,
        userNotification
    );

} catch (pushError) {

    console.error(
        "❌ FINORA DEPOSIT APPROVED PUSH FAILED:",
        pushError
    );

}

/* =================================================
   SUCCESS RESPONSE
================================================= */

            return res.json({

                success: true,

                message:
                    "Deposit approved and wallet credited successfully.",

                deposit: {

                    id:
                        deposit._id,

                    amount:
                        depositAmount,

                    status:
                        deposit.status,

                    walletCredited:
                        deposit.walletCredited,

                    referralProcessed:
                        deposit.referralProcessed

                },

                referral:
                    referralResult

            });


        } catch (error) {

            /* =================================================
               ROLLBACK

               If anything fails, including notification
               creation, the complete operation is rolled back.
            ================================================= */

            try {

                await session.abortTransaction();

            } catch (abortError) {

                console.error(
                    "❌ ADMIN DEPOSIT APPROVAL ROLLBACK ERROR:",
                    abortError
                );
            }


            console.error(
                "❌ ADMIN APPROVE DEPOSIT ERROR:",
                error
            );


            return res.status(400).json({

                success: false,

                message:
                    error.message ||
                    "Failed to approve deposit."

            });

        } finally {

            await session.endSession();
        }
    }
);


/* =========================================================
   REJECT DEPOSIT

   POST:
   /api/admin/deposits/:id/reject

   Expected body:

   {
       "reason": "Payment reference could not be verified."
   }

   FLOW:

   1. Find pending deposit
   2. Mark rejected
   3. Save admin username
   4. Save rejection reason
   5. Update transaction to rejected
   6. NO wallet credit
   7. NO referral commission
   8. Notify user
   9. Notify admin
========================================================= */

router.post(
    "/:id/reject",
    requireAdmin,
    async (req, res) => {

        const depositId =
            req.params.id;


        /* =================================================
           VALIDATE OBJECT ID
        ================================================= */

        if (
            !mongoose.Types.ObjectId.isValid(
                depositId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid deposit ID."

            });
        }


        /* =================================================
           READ REJECTION REASON
        ================================================= */

        const rejectionReason =
            String(
                req.body?.reason || ""
            ).trim();


        if (
            !rejectionReason
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A rejection reason is required."

            });
        }


        if (
            rejectionReason.length > 500
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Rejection reason must not exceed 500 characters."

            });
        }


        const session =
            await mongoose.startSession();


        try {

            session.startTransaction();


            /* =================================================
               LOAD DEPOSIT
            ================================================= */

            const deposit =
                await Deposit.findById(
                    depositId
                ).session(session);


            if (!deposit) {

                throw new Error(
                    "Deposit not found."
                );
            }


            /* =================================================
               IDEMPOTENCY CHECK

               Already rejected = nothing more to do.
            ================================================= */

            if (
                deposit.status === "rejected"
            ) {

                await session.abortTransaction();


                return res.json({

                    success: true,

                    alreadyProcessed: true,

                    message:
                        "Deposit has already been rejected."

                });
            }


            /* =================================================
               APPROVED DEPOSIT CANNOT BE REJECTED
            ================================================= */

            if (
                deposit.status === "approved"
            ) {

                throw new Error(
                    "An approved deposit cannot be rejected."
                );
            }


            /* =================================================
               ONLY PENDING DEPOSITS CAN BE REJECTED
            ================================================= */

            if (
                deposit.status !== "pending"
            ) {

                throw new Error(
                    "Only pending deposits can be rejected."
                );
            }


            /* =================================================
               SAFETY CHECK

               Pending deposit must not have credited wallet.
            ================================================= */

            if (
                deposit.walletCredited === true
            ) {

                throw new Error(
                    "Cannot reject a deposit that has already credited the wallet."
                );
            }


            /* =================================================
               LOAD USER
            ================================================= */

            const user =
                await User.findById(
                    deposit.user
                ).session(session);


            if (!user) {

                throw new Error(
                    "Deposit owner not found."
                );
            }


            /* =================================================
               MARK DEPOSIT REJECTED
            ================================================= */

            deposit.status =
                "rejected";

            deposit.processedAt =
                new Date();

            deposit.processedBy =
                req.admin.username;

            deposit.rejectionReason =
                rejectionReason;

            deposit.walletCredited =
                false;

            deposit.walletCreditedAt =
                null;

            deposit.referralProcessed =
                false;

            deposit.referralProcessedAt =
                null;


            await deposit.save({
                session
            });


            /* =================================================
               UPDATE EXISTING DEPOSIT TRANSACTION
            ================================================= */

            const depositTransaction =
                await Transaction.findOne({

                    user:
                        user._id,

                    type:
                        "deposit",

                    relatedId:
                        deposit._id

                }).session(session);


            if (
                depositTransaction
            ) {

                depositTransaction.status =
                    "rejected";

                depositTransaction.description =
                    `FINORA Mobile Money deposit rejected: ${rejectionReason}`;

                depositTransaction.reference =
                    deposit.paymentReference;


                await depositTransaction.save({
                    session
                });

            } else {

                /* ---------------------------------------------
                   SAFETY FALLBACK
                --------------------------------------------- */

                const transaction =
                    new Transaction({

                        user:
                            user._id,

                        type:
                            "deposit",

                        amount:
                            deposit.amount,

                        direction:
                            "credit",

                        status:
                            "rejected",

                        description:
                            `FINORA Mobile Money deposit rejected: ${rejectionReason}`,

                        reference:
                            deposit.paymentReference,

                        relatedId:
                            deposit._id
                    });


                await transaction.save({
                    session
                });
            }


            /* =================================================
               USER NOTIFICATION
            ================================================= */

            const userNotification =
                new Notification({

                    userId:
                        user._id,

                    type:
                        "deposit_rejected",

                    title:
                        "Deposit Rejected",

                    message:
                        `Your UGX ${Number(deposit.amount).toLocaleString()} deposit was rejected. Reason: ${rejectionReason}`,

                    isRead:
                        false
                });


            await userNotification.save({
                session
            });


            /* =================================================
               ADMIN NOTIFICATION

               This notification belongs to the admin,
               NOT the depositing user.
            ================================================= */

            const adminNotification =
                new Notification({

                    adminId:
                        req.admin._id,

                    type:
                        "deposit_rejected",

                    title:
                        "Deposit Rejected",

                    message:
                        `UGX ${Number(deposit.amount).toLocaleString()} deposit from ${user.fullName} (${user.phone}) was rejected. Reason: ${rejectionReason}`,

                    isRead:
                        false
                });


            await adminNotification.save({
                session
            });


            /* =================================================
               COMMIT
            ================================================= */

            await session.commitTransaction();
/* =================================================
   DEPOSIT REJECTED DEVICE PUSH
================================================= */

try {

    await sendPushToUser(
        userNotification.userId,
        userNotification
    );

} catch (pushError) {

    console.error(
        "❌ FINORA DEPOSIT REJECTED PUSH FAILED:",
        pushError
    );

}

            /* =================================================
               SUCCESS
            ================================================= */

            return res.json({

                success: true,

                message:
                    "Deposit rejected successfully.",

                deposit: {

                    id:
                        deposit._id,

                    amount:
                        deposit.amount,

                    status:
                        deposit.status,

                    walletCredited:
                        deposit.walletCredited,

                    rejectionReason:
                        deposit.rejectionReason

                }

            });


        } catch (error) {

            try {

                await session.abortTransaction();

            } catch (abortError) {

                console.error(
                    "❌ ADMIN DEPOSIT REJECTION ROLLBACK ERROR:",
                    abortError
                );
            }


            console.error(
                "❌ ADMIN REJECT DEPOSIT ERROR:",
                error
            );


            return res.status(400).json({

                success: false,

                message:
                    error.message ||
                    "Failed to reject deposit."

            });

        } finally {

            await session.endSession();
        }
    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports =
    router;
