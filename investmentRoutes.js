const express = require("express");
const router = express.Router();

const User = require("./user");
const Investment = require("./investment");
const Deposit = require("./Deposit");
const Transaction = require("./Transaction");
const Notification = require("./Notification");

const MIN_INVESTMENT = 10000;
const DAILY_RATE = 10;
const INVESTMENT_DURATION = 20;

router.post("/", async (req, res) => {
const session = await User.startSession();

try {
    if (
        !req.session ||
        !req.session.userId
    ) {
        return res.status(401).json({
            success: false,
            message: "Please log in to invest."
        });
    }

    let createdInvestment;

    await session.withTransaction(async () => {
        const user = await User.findById(
            req.session.userId
        ).session(session);

        if (!user) {
            const error = new Error(
                "User account not found."
            );

            error.statusCode = 401;
            throw error;
        }

        if (user.status === "frozen") {
            const error = new Error(
                "Your FINORA account is frozen."
            );

            error.statusCode = 403;
            throw error;
        }

        const amount = Number(req.body.amount);

        if (!Number.isFinite(amount)) {
            const error = new Error(
                "Please enter a valid investment amount."
            );

            error.statusCode = 400;
            throw error;
        }

        if (amount < MIN_INVESTMENT) {
            const error = new Error(
                `Minimum investment is UGX ${MIN_INVESTMENT.toLocaleString("en-UG")}.`
            );

            error.statusCode = 400;
            throw error;
        }

        const decimalAmount =
            Math.round(amount * 100) / 100;

        if (
            Math.abs(
                amount - decimalAmount
            ) > 0.000001
        ) {
            const error = new Error(
                "Investment amount can have a maximum of two decimal places."
            );

            error.statusCode = 400;
            throw error;
        }

        const approvedDeposit =
            await Deposit.findOne({
                user: user._id,
                status: "approved",
                amount: {
                    $gte: MIN_INVESTMENT
                }
            })
            .sort({
                createdAt: 1
            })
            .session(session);

        if (!approvedDeposit) {
            const error = new Error(
                `You must first make a successful deposit of at least UGX ${MIN_INVESTMENT.toLocaleString("en-UG")} before investing.`
            );

            error.statusCode = 400;
            throw error;
        }

        if (amount > user.balance) {
            const error = new Error(
                "Insufficient wallet balance."
            );

            error.statusCode = 400;
            throw error;
        }

        const startDate = new Date();

        const endDate = new Date(
            startDate.getTime() +
            (
                INVESTMENT_DURATION *
                24 *
                60 *
                60 *
                1000
            )
        );

        const nextEarningAt = new Date(
            startDate.getTime() +
            (
                24 *
                60 *
                60 *
                1000
            )
        );

        const dailyEarnings =
            Math.round(
                (
                    amount *
                    (
                        DAILY_RATE / 100
                    )
                ) *
                100
            ) / 100;

        const investment =
            new Investment({
                user: user._id,
                amount: amount,
                dailyRate: DAILY_RATE,
                dailyEarnings: dailyEarnings,
                duration: INVESTMENT_DURATION,
                earned: 0,
                daysCompleted: 0,
                daysRemaining:
                    INVESTMENT_DURATION,
                startDate: startDate,
                endDate: endDate,
                nextEarningAt:
                    nextEarningAt,
                status: "active"
            });

        await investment.save({
            session
        });

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

        const transaction =
            new Transaction({
                user: user._id,
                type: "investment",
                amount: amount,
                direction: "debit",
                status: "completed",
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

        const notification =
            new Notification({
                userId: user._id,
                type:
                    "investment_created",
                title:
                    "Investment Created",
                message:
                    `Your UGX ${amount.toLocaleString()} investment has been created successfully and is now active.`,
                isRead: false
            });

        await notification.save({
            session
        });

        createdInvestment =
            investment;
    });

    const updatedUser =
        await User.findById(
            req.session.userId
        ).select("balance");

    return res.status(201).json({
        success: true,
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
        success: false,
        message:
            error.statusCode
                ? error.message
                : "FINORA could not create your investment."
    });

} finally {
    await session.endSession();
}

});

router.get("/mine", async (req, res) => {
try {
if (
!req.session ||
!req.session.userId
) {
return res.status(401).json({
success: false,
message: "Please log in."
});
}

    const user =
        await User.findById(
            req.session.userId
        );

    if (!user) {
        return res.status(401).json({
            success: false,
            message:
                "User account not found."
        });
    }

    if (user.status === "frozen") {
        return res.status(403).json({
            success: false,
            message:
                "Your FINORA account is frozen."
        });
    }

    const investments =
        await Investment.find({
            user: user._id
        }).sort({
            createdAt: -1
        });

    return res.status(200).json({
        success: true,
        investments
    });

} catch (error) {
    console.error(
        "❌ FINORA GET INVESTMENTS ERROR:",
        error
    );

    return res.status(500).json({
        success: false,
        message:
            "FINORA could not load your investments."
    });
}

});

module.exports = router;
