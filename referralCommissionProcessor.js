const mongoose = require("mongoose");

const User = require("./user");
const Deposit = require("./Deposit");
const ReferralCommission = require("./ReferralCommission");
const Transaction = require("./Transaction");
const Notification = require("./Notification");


/* =========================================================
   FINORA REFERRAL COMMISSION PROCESSOR

   IMPORTANT:

   This processor is designed to be called AFTER an
   Admin approves a deposit and the user's wallet has
   already been credited.

   ONLY THE USER'S FIRST APPROVED DEPOSIT can generate
   referral commissions.

   LEVEL 1 = 15%
   LEVEL 2 = 5%
   LEVEL 3 = 2%

   SECOND / THIRD / LATER DEPOSITS:
   NO referral commission.

   Each commission creates:
      1. ReferralCommission record
      2. Wallet credit
      3. Transaction History record
      4. Notification

========================================================= */


/* =========================================================
   COMMISSION RATES
========================================================= */

const COMMISSION_RATES = {
    1: 15,
    2: 5,
    3: 2
};


/* =========================================================
   PROCESS FIRST-DEPOSIT REFERRAL COMMISSION
========================================================= */

async function processFirstDepositReferralCommission(
    depositId,
    existingSession = null
) {

    let session = existingSession;

    let ownSession = false;


    try {

        /* =================================================
           CREATE OUR OWN SESSION WHEN ONE WAS NOT PROVIDED
        ================================================= */

        if (!session) {

            session =
                await mongoose.startSession();

            ownSession = true;

            session.startTransaction();
        }


        /* =================================================
           LOAD THE DEPOSIT
        ================================================= */

        const deposit =
            await Deposit.findById(
                depositId
            ).session(session);


        if (!deposit) {

            throw new Error(
                "FINORA referral processor: deposit not found."
            );
        }


        /* =================================================
           DEPOSIT MUST BE APPROVED
        ================================================= */

        if (
            deposit.status !== "approved"
        ) {

            throw new Error(
                "FINORA referral processor: deposit is not approved."
            );
        }


        /* =================================================
           WALLET MUST ALREADY BE CREDITED

           Deposit flow:

           APPROVED
              ↓
           WALLET CREDIT
              ↓
           REFERRAL PROCESSING
        ================================================= */

        if (
            deposit.walletCredited !== true
        ) {

            throw new Error(
                "FINORA referral processor: deposit wallet has not been credited yet."
            );
        }


        /* =================================================
           DUPLICATE-PROCESSING PROTECTION

           If already processed, stop immediately.
        ================================================= */

        if (
            deposit.referralProcessed === true
        ) {

            if (ownSession) {

                await session.commitTransaction();
            }

            return {

                success: true,

                processed: false,

                reason:
                    "Referral commission already processed."
            };
        }


        /* =================================================
           FIND THE REFERRED USER
        ================================================= */

        const referredUser =
            await User.findById(
                deposit.user
            ).session(session);


        if (!referredUser) {

            throw new Error(
                "FINORA referral processor: referred user not found."
            );
        }


        /* =================================================
           CHECK WHETHER THIS IS THE USER'S FIRST
           APPROVED DEPOSIT
        ================================================= */

        const previousApprovedDeposit =
            await Deposit.findOne({

                user:
                    referredUser._id,

                status:
                    "approved",

                _id: {
                    $ne:
                        deposit._id
                }

            }).session(session);


        /* =================================================
           SECOND / LATER APPROVED DEPOSIT

           No referral commission.

           Mark this deposit as processed so it cannot
           be checked repeatedly.
        ================================================= */

        if (
            previousApprovedDeposit
        ) {

            deposit.referralProcessed =
                true;

            deposit.referralProcessedAt =
                new Date();

            await deposit.save({
                session
            });


            if (ownSession) {

                await session.commitTransaction();
            }


            return {

                success: true,

                processed: false,

                firstDeposit: false,

                reason:
                    "This is not the user's first approved deposit."
            };
        }


        /* =================================================
           NO REFERRAL CODE

           The deposit is the first one, but the user
           has no referrer.

           No commission is created.
        ================================================= */

        if (
            !referredUser.referredByCode
        ) {

            deposit.referralProcessed =
                true;

            deposit.referralProcessedAt =
                new Date();

            await deposit.save({
                session
            });


            if (ownSession) {

                await session.commitTransaction();
            }


            return {

                success: true,

                processed: false,

                firstDeposit: true,

                reason:
                    "First approved deposit has no referral chain."
            };
        }


        /* =================================================
           BUILD REFERRAL CHAIN

           LEVEL 1
           referredUser → direct referrer

           LEVEL 2
           direct referrer → their referrer

           LEVEL 3
           level 2 referrer → their referrer
        ================================================= */

        const referralChain = [];


        /* =================================================
           LEVEL 1
        ================================================= */

        const level1User =
            await User.findOne({

                referralCode:
                    referredUser.referredByCode

            }).session(session);


        if (level1User) {

            referralChain.push({

                user:
                    level1User,

                level:
                    1,

                rate:
                    COMMISSION_RATES[1]
            });
        }


        /* =================================================
           LEVEL 2
        ================================================= */

        let level2User = null;


        if (
            level1User &&
            level1User.referredByCode
        ) {

            level2User =
                await User.findOne({

                    referralCode:
                        level1User.referredByCode

                }).session(session);


            if (level2User) {

                referralChain.push({

                    user:
                        level2User,

                    level:
                        2,

                    rate:
                        COMMISSION_RATES[2]
                });
            }
        }


        /* =================================================
           LEVEL 3
        ================================================= */

        let level3User = null;


        if (
            level2User &&
            level2User.referredByCode
        ) {

            level3User =
                await User.findOne({

                    referralCode:
                        level2User.referredByCode

                }).session(session);


            if (level3User) {

                referralChain.push({

                    user:
                        level3User,

                    level:
                        3,

                    rate:
                        COMMISSION_RATES[3]
                });
            }
        }


        /* =================================================
           PROCESS EACH REFERRAL LEVEL
        ================================================= */

        const commissions = [];


        for (
            const referral
            of referralChain
        ) {

            const recipient =
                referral.user;

            const level =
                referral.level;

            const rate =
                referral.rate;


            /* ---------------------------------------------
               FROZEN ACCOUNT PROTECTION
            --------------------------------------------- */

            if (
                recipient.status === "frozen"
            ) {

                continue;
            }


            /* ---------------------------------------------
               CALCULATE COMMISSION
            --------------------------------------------- */

            const commissionAmount =
                Math.round(
                    (
                        deposit.amount *
                        rate
                    ) / 100
                );


            if (
                commissionAmount <= 0
            ) {

                continue;
            }


            /* ---------------------------------------------
               DUPLICATE PROTECTION

               The ReferralCommission model also has a
               unique index on:

               deposit + recipient + level
            --------------------------------------------- */

            const existingCommission =
                await ReferralCommission.findOne({

                    deposit:
                        deposit._id,

                    recipient:
                        recipient._id,

                    level:
                        level

                }).session(session);


            if (
                existingCommission
            ) {

                continue;
            }


            /* ---------------------------------------------
               CREDIT RECIPIENT WALLET
            --------------------------------------------- */

            recipient.balance =
                Number(
                    recipient.balance || 0
                ) +
                commissionAmount;


            recipient.totalIncome =
                Number(
                    recipient.totalIncome || 0
                ) +
                commissionAmount;


            await recipient.save({
                session
            });


            /* ---------------------------------------------
               CREATE REFERRAL COMMISSION RECORD
            --------------------------------------------- */

            const referralCommission =
                new ReferralCommission({

                    recipient:
                        recipient._id,

                    referredUser:
                        referredUser._id,

                    deposit:
                        deposit._id,

                    level:
                        level,

                    rate:
                        rate,

                    depositAmount:
                        deposit.amount,

                    amount:
                        commissionAmount,

                    status:
                        "credited",

                    creditedAt:
                        new Date()
                });


            await referralCommission.save({
                session
            });


            /* ---------------------------------------------
               CREATE TRANSACTION HISTORY RECORD
            --------------------------------------------- */

            const transaction =
                new Transaction({

                    user:
                        recipient._id,

                    type:
                        "referral",

                    amount:
                        commissionAmount,

                    direction:
                        "credit",

                    status:
                        "completed",

                    description:
                        `FINORA Level ${level} Referral Commission`,

                    reference:
                        `REF-${deposit._id}-L${level}`,

                    relatedId:
                        deposit._id
                });


            await transaction.save({
                session
            });


            /* ---------------------------------------------
               CREATE REFERRAL NOTIFICATION
            --------------------------------------------- */

            const notification =
                new Notification({

                    userId:
                        recipient._id,

                    type:
                        "referral_commission",

                    title:
                        "Referral Commission Credited",

                    message:
                        `UGX ${commissionAmount.toLocaleString()} Level ${level} referral commission has been credited to your FINORA wallet.`,

                    isRead:
                        false
                });


            await notification.save({
                session
            });


            /* ---------------------------------------------
               SAVE RESULT
            --------------------------------------------- */

            commissions.push({

                recipient:
                    recipient._id,

                level:
                    level,

                rate:
                    rate,

                amount:
                    commissionAmount
            });
        }


        /* =================================================
           MARK DEPOSIT REFERRAL PROCESSING COMPLETE
        ================================================= */

        deposit.referralProcessed =
            true;

        deposit.referralProcessedAt =
            new Date();


        await deposit.save({
            session
        });


        /* =================================================
           COMMIT OUR TRANSACTION
        ================================================= */

        if (ownSession) {

            await session.commitTransaction();
        }


        /* =================================================
           SUCCESS
        ================================================= */

        return {

            success: true,

            processed: true,

            firstDeposit: true,

            commissions:
                commissions
        };


    } catch (error) {

        /* =================================================
           ROLLBACK OUR TRANSACTION
        ================================================= */

        if (
            ownSession &&
            session
        ) {

            await session.abortTransaction();
        }


        console.error(
            "❌ FINORA REFERRAL COMMISSION PROCESSOR ERROR:",
            error
        );


        throw error;


    } finally {

        /* =================================================
           CLOSE OUR SESSION
        ================================================= */

        if (
            ownSession &&
            session
        ) {

            await session.endSession();
        }
    }
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    processFirstDepositReferralCommission

};

 
