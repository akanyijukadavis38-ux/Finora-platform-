const express = require("express");
const mongoose = require("mongoose");

const Withdrawal = require("./Withdrawal");
const Transaction = require("./Transaction");
const User = require("./user");
const Notification = require("./Notification");
const requireAdmin = require("./adminAuth");
const {
    sendPushToUser
} = require("./pushService");
const router = express.Router();


/* =========================================================
   GET WITHDRAWALS
========================================================= */

router.get("/", requireAdmin, async (req, res) => {

    try {

        const status =
            req.query.status || "all";

        const filter =
            status === "all"
                ? {}
                : { status };


        const withdrawals =
            await Withdrawal.find(filter)
                .populate(
                    "user",
                    "fullName phone email balance totalWithdrawal status"
                )
                .sort({
                    createdAt: -1
                })
                .lean();


        return res.json({
            success: true,
            withdrawals
        });

    } catch (error) {

        console.error(
            "ADMIN WITHDRAWALS FETCH ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load withdrawals."
        });
    }
});


/* =========================================================
   GET SINGLE WITHDRAWAL
========================================================= */

router.get("/:id", requireAdmin, async (req, res) => {

    try {

        const withdrawal =
            await Withdrawal.findById(
                req.params.id
            )
            .populate(
                "user",
                "fullName phone email balance totalDeposit totalWithdrawal totalIncome status referralCode referredByCode createdAt"
            )
            .lean();


        if (!withdrawal) {

            return res.status(404).json({
                success: false,
                message: "Withdrawal not found."
            });
        }


        return res.json({
            success: true,
            withdrawal
        });

    } catch (error) {

        console.error(
            "ADMIN SINGLE WITHDRAWAL FETCH ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load withdrawal."
        });
    }
});


/* =========================================================
   APPROVE WITHDRAWAL
========================================================= */

router.post("/:id/approve", requireAdmin, async (req, res) => {

    const session =
        await mongoose.startSession();


    try {

        session.startTransaction();


        const withdrawal =
            await Withdrawal.findById(
                req.params.id
            ).session(session);


        if (!withdrawal) {

            throw new Error(
                "Withdrawal not found."
            );
        }


        if (
            withdrawal.status === "approved" ||
            withdrawal.status === "completed"
        ) {

            await session.commitTransaction();

            return res.json({
                success: true,
                alreadyProcessed: true,
                message: "Withdrawal has already been approved."
            });
        }


        if (
            withdrawal.status !== "pending"
        ) {

            throw new Error(
                "Only pending withdrawals can be approved."
            );
        }


        const user =
            await User.findById(
                withdrawal.user
            ).session(session);


        if (!user) {

            throw new Error(
                "Withdrawal user not found."
            );
        }


        if (
            user.status === "frozen"
        ) {

            throw new Error(
                "Frozen accounts cannot have withdrawals approved."
            );
        }


        if (
            withdrawal.walletDeducted !== true
        ) {

            throw new Error(
                "Withdrawal wallet deduction is not confirmed."
            );
        }


        if (
            withdrawal.amount <= 0 ||
            withdrawal.netAmount < 0
        ) {

            throw new Error(
                "Invalid withdrawal amount."
            );
        }


        withdrawal.status =
            "approved";

        withdrawal.processedAt =
            new Date();

        withdrawal.processedBy =
            req.admin.username;


        await withdrawal.save({
            session
        });


        let transaction = null;


        if (
            withdrawal.transactionId
        ) {

            transaction =
                await Transaction.findById(
                    withdrawal.transactionId
                ).session(session);
        }


        if (
            transaction
        ) {

            transaction.status =
                "approved";

            transaction.description =
                "FINORA Withdrawal Approved";

            await transaction.save({
                session
            });

        } else {

            transaction =
                new Transaction({

                    user:
                        user._id,

                    type:
                        "withdrawal",

                    amount:
                        withdrawal.amount,

                    direction:
                        "debit",

                    status:
                        "approved",

                    description:
                        "FINORA Withdrawal Approved",

                    reference:
                        `WD-${withdrawal._id}`,

                    relatedId:
                        withdrawal._id
                });


            await transaction.save({
                session
            });


            withdrawal.transactionId =
                transaction._id;


            await withdrawal.save({
                session
            });
        }


        const notification =
            new Notification({

                userId:
                    user._id,

                type:
                    "withdrawal",

                title:
                    "Withdrawal Approved",

                message:
                    `Your UGX ${withdrawal.amount.toLocaleString()} withdrawal has been approved. UGX ${withdrawal.netAmount.toLocaleString()} is the amount scheduled for payout to your ${withdrawal.network} number ${withdrawal.phoneNumber}.`,

                isRead:
                    false
            });


        await notification.save({
            session
        });

await session.commitTransaction();


/* =================================================
   WITHDRAWAL APPROVED DEVICE PUSH
=================================================

   The withdrawal database transaction has already
   committed successfully.

   Push failure must NOT affect the withdrawal.
================================================= */
console.log(
  "🔔 FINORA WITHDRAWAL PUSH REACHED:",
  notification._id?.toString(),
  notification.userId?.toString(),
  notification.type,
  notification.title
);
try {

    await sendPushToUser(
        notification.userId,
        notification
    );

} catch (pushError) {

    console.error(
        "❌ FINORA WITHDRAWAL APPROVED PUSH FAILED:",
        pushError
    );

}


return res.json({

    success: true,

    message:
        "Withdrawal approved successfully.",
        

            withdrawal
        });


    } catch (error) {

        await session.abortTransaction();


        console.error(
            "ADMIN WITHDRAWAL APPROVAL ERROR:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Failed to approve withdrawal."
        });

    } finally {

        await session.endSession();
    }
});


/* =========================================================
   REJECT WITHDRAWAL
========================================================= */

router.post("/:id/reject", requireAdmin, async (req, res) => {

    const session =
        await mongoose.startSession();


    try {

        session.startTransaction();


        const withdrawal =
            await Withdrawal.findById(
                req.params.id
            ).session(session);


        if (!withdrawal) {

            throw new Error(
                "Withdrawal not found."
            );
        }


        if (
            withdrawal.status === "rejected"
        ) {

            await session.commitTransaction();

            return res.json({
                success: true,
                alreadyProcessed: true,
                message: "Withdrawal has already been rejected."
            });
        }


        if (
            withdrawal.status === "approved" ||
            withdrawal.status === "completed"
        ) {

            throw new Error(
                "Approved or completed withdrawals cannot be rejected."
            );
        }


        if (
            withdrawal.status !== "pending"
        ) {

            throw new Error(
                "Only pending withdrawals can be rejected."
            );
        }


        const user =
            await User.findById(
                withdrawal.user
            ).session(session);


        if (!user) {

            throw new Error(
                "Withdrawal user not found."
            );
        }


        const reason =
            typeof req.body.reason === "string" &&
            req.body.reason.trim()
                ? req.body.reason.trim()
                : "Withdrawal rejected by Admin.";


        if (
            withdrawal.walletDeducted === true
        ) {

            user.balance =
                Number(
                    user.balance || 0
                ) +
                Number(
                    withdrawal.amount || 0
                );


            user.totalWithdrawal =
                Math.max(
                    0,
                    Number(
                        user.totalWithdrawal || 0
                    ) -
                    Number(
                        withdrawal.amount || 0
                    )
                );


            await user.save({
                session
            });


            withdrawal.walletDeducted =
                false;

            withdrawal.walletDeductedAt =
                null;
        }


        withdrawal.status =
            "rejected";

        withdrawal.rejectionReason =
            reason;

        withdrawal.processedAt =
            new Date();

        withdrawal.processedBy =
            req.admin.username;


        await withdrawal.save({
            session
        });


        let transaction = null;


        if (
            withdrawal.transactionId
        ) {

            transaction =
                await Transaction.findById(
                    withdrawal.transactionId
                ).session(session);
        }


        if (
            transaction
        ) {

            transaction.status =
                "rejected";

            transaction.description =
                "FINORA Withdrawal Rejected";

            await transaction.save({
                session
            });

        } else {

            transaction =
                new Transaction({

                    user:
                        user._id,

                    type:
                        "withdrawal",

                    amount:
                        withdrawal.amount,

                    direction:
                        "debit",

                    status:
                        "rejected",

                    description:
                        "FINORA Withdrawal Rejected",

                    reference:
                        `WD-${withdrawal._id}`,

                    relatedId:
                        withdrawal._id
                });


            await transaction.save({
                session
            });


            withdrawal.transactionId =
                transaction._id;


            await withdrawal.save({
                session
            });
        }


        const notification =
            new Notification({

                userId:
                    user._id,

                type:
                    "withdrawal",

                title:
                    "Withdrawal Rejected",

                message:
                    `Your UGX ${withdrawal.amount.toLocaleString()} withdrawal was rejected. The full UGX ${withdrawal.amount.toLocaleString()} has been returned to your FINORA wallet. Reason: ${reason}`,

                isRead:
                    false
            });


        await notification.save({
            session
        });

await session.commitTransaction();


/* =================================================
   WITHDRAWAL REJECTED DEVICE PUSH
=================================================

   The rejection/refund transaction has already
   committed successfully.

   Push failure must NOT affect the refund.
================================================= */

try {

    await sendPushToUser(
        notification.userId,
        notification
    );

} catch (pushError) {

    console.error(
        "❌ FINORA WITHDRAWAL REJECTED PUSH FAILED:",
        pushError
    );

}


return res.json({

    success: true,

    message:
        "Withdrawal rejected and wallet refunded successfully.",
        

            withdrawal
        });


    } catch (error) {

        await session.abortTransaction();


        console.error(
            "ADMIN WITHDRAWAL REJECTION ERROR:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Failed to reject withdrawal."
        });

    } finally {

        await session.endSession();
    }
});


module.exports = router;
