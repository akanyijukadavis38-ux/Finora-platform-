const express = require("express");

const ReferralCommission =
    require("./ReferralCommission");

const requireAdmin =
    require("./adminAuth");


const router =
    express.Router();


/* =========================================================
   GET ADMIN REFERRAL OVERVIEW

   Returns real referral commission statistics.
========================================================= */

router.get(
    "/overview",
    requireAdmin,
    async (req, res) => {

        try {

            const [
                totalStats,
                level1Stats,
                level2Stats,
                level3Stats,
                creditedStats,
                reversedStats
            ] = await Promise.all([

                ReferralCommission.aggregate([

                    {
                        $group: {
                            _id: null,

                            totalAmount: {
                                $sum: "$amount"
                            },

                            totalRecords: {
                                $sum: 1
                            }
                        }
                    }

                ]),

                ReferralCommission.aggregate([

                    {
                        $match: {
                            level: 1
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            amount: {
                                $sum: "$amount"
                            },

                            records: {
                                $sum: 1
                            }
                        }
                    }

                ]),

                ReferralCommission.aggregate([

                    {
                        $match: {
                            level: 2
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            amount: {
                                $sum: "$amount"
                            },

                            records: {
                                $sum: 1
                            }
                        }
                    }

                ]),

                ReferralCommission.aggregate([

                    {
                        $match: {
                            level: 3
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            amount: {
                                $sum: "$amount"
                            },

                            records: {
                                $sum: 1
                            }
                        }
                    }

                ]),

                ReferralCommission.aggregate([

                    {
                        $match: {
                            status: "credited"
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            amount: {
                                $sum: "$amount"
                            },

                            records: {
                                $sum: 1
                            }
                        }
                    }

                ]),

                ReferralCommission.aggregate([

                    {
                        $match: {
                            status: "reversed"
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            amount: {
                                $sum: "$amount"
                            },

                            records: {
                                $sum: 1
                            }
                        }
                    }

                ])

            ]);


            const total =
                totalStats[0] || {};

            const level1 =
                level1Stats[0] || {};

            const level2 =
                level2Stats[0] || {};

            const level3 =
                level3Stats[0] || {};

            const credited =
                creditedStats[0] || {};

            const reversed =
                reversedStats[0] || {};


            return res.status(200).json({

                success: true,

                overview: {

                    totalAmount:
                        Number(
                            total.totalAmount || 0
                        ),

                    totalRecords:
                        Number(
                            total.totalRecords || 0
                        ),

                    creditedAmount:
                        Number(
                            credited.amount || 0
                        ),

                    creditedRecords:
                        Number(
                            credited.records || 0
                        ),

                    reversedAmount:
                        Number(
                            reversed.amount || 0
                        ),

                    reversedRecords:
                        Number(
                            reversed.records || 0
                        ),

                    level1: {

                        amount:
                            Number(
                                level1.amount || 0
                            ),

                        records:
                            Number(
                                level1.records || 0
                            ),

                        rate: 15
                    },

                    level2: {

                        amount:
                            Number(
                                level2.amount || 0
                            ),

                        records:
                            Number(
                                level2.records || 0
                            ),

                        rate: 5
                    },

                    level3: {

                        amount:
                            Number(
                                level3.amount || 0
                            ),

                        records:
                            Number(
                                level3.records || 0
                            ),

                        rate: 2
                    }

                }

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN REFERRAL OVERVIEW ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load referral overview."

            });

        }

    }
);


/* =========================================================
   GET ADMIN REFERRAL COMMISSIONS

   Supports:

   ?level=1
   ?level=2
   ?level=3

   ?status=credited
   ?status=reversed

   ?search=name/phone/email
========================================================= */

router.get(
    "/",
    requireAdmin,
    async (req, res) => {

        try {

            const {
                level,
                status,
                search
            } = req.query;


            const filter = {};


            /* =================================================
               LEVEL FILTER
            ================================================= */

            if (
                level === "1" ||
                level === "2" ||
                level === "3"
            ) {

                filter.level =
                    Number(level);

            }


            /* =================================================
               STATUS FILTER
            ================================================= */

            if (
                status === "credited" ||
                status === "reversed"
            ) {

                filter.status =
                    status;

            }


            /* =================================================
               LOAD REFERRALS
            ================================================= */

            let query =
                ReferralCommission.find(
                    filter
                )
                .populate(
                    "recipient",
                    "fullName phone email referralCode referredByCode status"
                )
                .populate(
                    "referredUser",
                    "fullName phone email referralCode referredByCode status"
                )
                .populate(
                    "deposit",
                    "amount paymentMethod paymentReference status createdAt processedAt"
                )
                .sort({
                    createdAt: -1
                })
                .limit(200)
                .lean();


            let commissions =
                await query;


            /* =================================================
               SEARCH

               Search is performed against the populated
               recipient/referred-user information.
            ================================================= */

            if (
                search &&
                String(search).trim()
            ) {

                const searchText =
                    String(search)
                        .trim()
                        .toLowerCase();


                commissions =
                    commissions.filter(
                        item => {

                            const recipient =
                                item.recipient ||
                                {};

                            const referredUser =
                                item.referredUser ||
                                {};

                            const deposit =
                                item.deposit ||
                                {};


                            const searchableText =
                                [
                                    recipient.fullName,
                                    recipient.phone,
                                    recipient.email,
                                    recipient.referralCode,

                                    referredUser.fullName,
                                    referredUser.phone,
                                    referredUser.email,
                                    referredUser.referralCode,

                                    deposit.paymentReference
                                ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();


                            return searchableText.includes(
                                searchText
                            );

                        }
                    );

            }


            return res.status(200).json({

                success: true,

                count:
                    commissions.length,

                commissions

            });

        } catch (error) {

            console.error(
                "❌ FINORA ADMIN REFERRALS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "FINORA could not load referral records."

            });

        }

    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports =
    router;
