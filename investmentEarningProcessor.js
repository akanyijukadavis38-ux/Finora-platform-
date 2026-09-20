const User = require("./user");
const Investment = require("./investment");
const Transaction = require("./Transaction");


/* =========================================================
   FINORA DAILY EARNING PROCESSOR
========================================================= */

const ONE_DAY_MS =
    24 *
    60 *
    60 *
    1000;


/* =========================================================
   PROCESS ONE DUE INVESTMENT
========================================================= */

async function processInvestment(
    investmentId
) {

    const session =
        await User.startSession();


    try {

        let processed = false;


        await session.withTransaction(
            async () => {

                /* =============================================
                   RELOAD INVESTMENT INSIDE TRANSACTION
                ============================================= */

                const investment =
                    await Investment.findOne({
                        _id:
                            investmentId,

                        status:
                            "active"
                    }).session(session);


                if (!investment) {
                    return;
                }


                /* =============================================
                   CHECK WHETHER EARNING IS ACTUALLY DUE
                ============================================= */

                if (
                    !investment.nextEarningAt
                ) {
                    return;
                }


                const now =
                    new Date();


                if (
                    investment.nextEarningAt >
                    now
                ) {
                    return;
                }


                /* =============================================
                   USER
                ============================================= */

                const user =
                    await User.findById(
                        investment.user
                    ).session(session);


                if (!user) {

                    throw new Error(
                        `User not found for investment ${investment._id}`
                    );
                }


                /* =============================================
                   FROZEN ACCOUNTS
                ============================================= */

                if (
                    user.status === "frozen"
                ) {

                    return;
                }


                /* =============================================
                   CALCULATE CURRENT EARNING
                ============================================= */

                const earning =
                    Math.round(
                        Number(
                            investment.dailyEarnings
                        ) *
                        100
                    ) / 100;


                if (
                    !Number.isFinite(
                        earning
                    ) ||
                    earning <= 0
                ) {

                    throw new Error(
                        `Invalid daily earning for investment ${investment._id}`
                    );
                }


                /* =============================================
                   CURRENT DAY NUMBER
                ============================================= */

                const nextDay =
                    Number(
                        investment.daysCompleted
                    ) + 1;


                if (
                    nextDay >
                    investment.duration
                ) {

                    investment.status =
                        "completed";

                    investment.daysRemaining =
                        0;

                    investment.nextEarningAt =
                        null;

                    await investment.save({
                        session
                    });

                    return;
                }


                /* =============================================
                   CREDIT USER WALLET
                ============================================= */

                user.balance =
                    Math.round(
                        (
                            Number(
                                user.balance
                            ) +
                            earning
                        ) *
                        100
                    ) / 100;


                user.totalIncome =
                    Math.round(
                        (
                            Number(
                                user.totalIncome
                            ) +
                            earning
                        ) *
                        100
                    ) / 100;


                /* =============================================
                   UPDATE INVESTMENT
                ============================================= */

                investment.earned =
                    Math.round(
                        (
                            Number(
                                investment.earned
                            ) +
                            earning
                        ) *
                        100
                    ) / 100;


                investment.daysCompleted =
                    nextDay;


                investment.daysRemaining =
                    Math.max(
                        Number(
                            investment.duration
                        ) -
                        nextDay,
                        0
                    );


                /* =============================================
                   NEXT EARNING TIME
                ============================================= */

                const nextEarningDate =
                    new Date(
                        investment.nextEarningAt
                            .getTime() +
                        ONE_DAY_MS
                    );


                if (
                    nextDay >=
                    investment.duration
                ) {

                    investment.status =
                        "completed";

                    investment.daysRemaining =
                        0;

                    investment.nextEarningAt =
                        null;

                } else {

                    investment.nextEarningAt =
                        nextEarningDate;
                }


                /* =============================================
                   CREATE DAILY EARNING TRANSACTION
                ============================================= */

                const transaction =
                    new Transaction({

                        user:
                            user._id,

                        type:
                            "earning",

                        amount:
                            earning,

                        direction:
                            "credit",

                        status:
                            "completed",

                        description:
                            "FINORA Daily Earnings",

                        reference:
                            `EARN-${investment._id}-${nextDay}`,

                        relatedId:
                            investment._id
                    });


                await transaction.save({
                    session
                });


                /* =============================================
                   SAVE USER + INVESTMENT
                ============================================= */

                await user.save({
                    session
                });


                await investment.save({
                    session
                });


                processed = true;
            }
        );


        return processed;


    } finally {

        await session.endSession();

    }
}


/* =========================================================
   PROCESS ALL DUE INVESTMENTS
========================================================= */

async function processDueInvestmentEarnings() {

    const now =
        new Date();


    const dueInvestments =
        await Investment.find({

            status:
                "active",

            nextEarningAt: {
                $ne:
                    null,

                $lte:
                    now
            }

        })
        .select("_id")
        .limit(100);


    if (
        dueInvestments.length === 0
    ) {

        return {
            checked:
                0,

            processed:
                0
        };
    }


    let processedCount =
        0;


    for (
        const investment
        of dueInvestments
    ) {

        try {

            const processed =
                await processInvestment(
                    investment._id
                );


            if (processed) {

                processedCount++;
            }

        } catch (error) {

            console.error(
                "❌ FINORA DAILY EARNING FAILED:",
                investment._id,
                error
            );

        }
    }


    return {

        checked:
            dueInvestments.length,

        processed:
            processedCount
    };
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    processDueInvestmentEarnings
};
