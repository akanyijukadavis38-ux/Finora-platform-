const express = require("express");
const bcrypt = require("bcrypt");
const User = require("./user");
const Investment = require("./investment");
const Admin = require("./Admin");
const Notification = require("./Notification");
const Transaction = require("./Transaction");
const ReferralCommission = require("./ReferralCommission");
const {
getEffectiveUserStatus
} = require("./userStatus");

const router = express.Router();

const FRONTEND_URL =
"https://finora-platform.pages.dev";

/* =========================================================
REAL FINORA DASHBOARD STATISTICS
========================================================= */

async function getDashboardStatistics(userId) {

const now =  
    new Date();  


/* =====================================================  
   UGANDA CURRENT DAY  

   Uganda = Africa/Kampala = UTC+3  

   Database timestamps remain real UTC instants.  
   This calculation only determines the beginning  
   of today's Uganda calendar day.  
===================================================== */  

const ugandaNow =  
    new Date(  
        now.getTime() +  
        (  
            3 *  
            60 *  
            60 *  
            1000  
        )  
    );  


const year =  
    ugandaNow.getUTCFullYear();  

const month =  
    ugandaNow.getUTCMonth();  

const day =  
    ugandaNow.getUTCDate();  


const startOfUgandaDay =  
    new Date(  
        Date.UTC(  
            year,  
            month,  
            day  
        ) -  
        (  
            3 *  
            60 *  
            60 *  
            1000  
        )  
    );  


/* =====================================================  
   TOTAL INVESTED  

   This comes from actual Investment records.  
   Deposits are NOT treated as investments.  
===================================================== */  

const investmentSummary =  
    await Investment.aggregate([  

        {  
            $match: {  
                user:  
                    userId  
            }  
        },  

        {  
            $group: {  

                _id:  
                    null,  

                totalInvested: {  
                    $sum:  
                        "$amount"  
                },  

                activeInvestments: {  
                    $sum: {  
                        $cond: [  
                            {  
                                $eq: [  
                                    "$status",  
                                    "active"  
                                ]  
                            },  
                            1,  
                            0  
                        ]  
                    }  
                }  
            }  
        }  
    ]);  


const totalInvested =  
    investmentSummary.length > 0  
        ? Number(  
            investmentSummary[0].totalInvested  
        ) || 0  
        : 0;  


const activeInvestments =  
    investmentSummary.length > 0  
        ? Number(  
            investmentSummary[0].activeInvestments  
        ) || 0  
        : 0;  


/* =====================================================  
   TOTAL EARNINGS  

   Only actual completed earning transactions count.  
===================================================== */  

const earningsSummary =  
    await Transaction.aggregate([  

        {  
            $match: {  

                user:  
                    userId,  

                type:  
                    "earning",  

                direction:  
                    "credit",  

                status:  
                    "completed"  
            }  
        },  

        {  
            $group: {  

                _id:  
                    null,  

                totalEarnings: {  
                    $sum:  
                        "$amount"  
                }  
            }  
        }  
    ]);  


const totalEarnings =  
    earningsSummary.length > 0  
        ? Number(  
            earningsSummary[0].totalEarnings  
        ) || 0  
        : 0;  


/* =====================================================  
   TODAY'S EARNINGS  

   Only completed earning transactions created  
   from midnight today in Uganda time.  
===================================================== */  

const todayEarningsSummary =  
    await Transaction.aggregate([  

        {  
            $match: {  

                user:  
                    userId,  

                type:  
                    "earning",  

                direction:  
                    "credit",  

                status:  
                    "completed",  

                createdAt: {  
                    $gte:  
                        startOfUgandaDay  
                }  
            }  
        },  

        {  
            $group: {  

                _id:  
                    null,  

                todayEarnings: {  
                    $sum:  
                        "$amount"  
                }  
            }  
        }  
    ]);  


const todayEarnings =  
    todayEarningsSummary.length > 0  
        ? Number(  
            todayEarningsSummary[0].todayEarnings  
        ) || 0  
        : 0;  

/* =====================================================
   REFERRAL BONUS BY LEVEL

   Only actual credited commissions count.

   LEVEL 1 = 15%
   LEVEL 2 = 5%
   LEVEL 3 = 2%
===================================================== */

const referralSummary =
    await ReferralCommission.aggregate([

        {
            $match: {

                recipient:
                    userId,

                status:
                    "credited"
            }
        },

        {
            $group: {

                _id:
                    "$level",

                amount: {
                    $sum:
                        "$amount"
                }
            }
        }

    ]);


let levelOneReferralIncome = 0;
let levelTwoReferralIncome = 0;
let levelThreeReferralIncome = 0;


for (
    const commission
    of referralSummary
) {

    const amount =
        Number(
            commission.amount
        ) || 0;


    if (
        commission._id === 1
    ) {

        levelOneReferralIncome +=
            amount;

    }


    if (
        commission._id === 2
    ) {

        levelTwoReferralIncome +=
            amount;

    }


    if (
        commission._id === 3
    ) {

        levelThreeReferralIncome +=
            amount;

    }

}


const referralIncome =
    levelOneReferralIncome +
    levelTwoReferralIncome +
    levelThreeReferralIncome;

return {

    totalEarnings:
        totalEarnings,

    todayEarnings:
        todayEarnings,

    totalInvested:
        totalInvested,

    referralIncome:
        referralIncome,

    levelOneReferralIncome:
        levelOneReferralIncome,

    levelTwoReferralIncome:
        levelTwoReferralIncome,

    levelThreeReferralIncome:
        levelThreeReferralIncome,

    activeInvestments:
        activeInvestments

};

}

/* =========================================================
REGISTER
========================================================= */

router.post("/register", async (req, res) => {

try {  

    const {  
        fullName,  
        phone,  
        email,  
        password,  
        confirmPassword,  
        referralCode  
    } = req.body;  


    if (  
        !fullName ||  
        !phone ||  
        !email ||  
        !password ||  
        !confirmPassword  
    ) {  

        return res.status(400).json({  
            success: false,  
            message:  
                "Please fill in all required fields."  
        });  

    }  


    const cleanName =  
        String(fullName).trim();  

    const cleanPhone =  
        String(phone).trim();  

    const cleanEmail =  
        String(email)  
            .trim()  
            .toLowerCase();  

    const cleanReferralCode =  
        referralCode  
            ? String(referralCode)  
                .trim()  
                .toUpperCase()  
            : null;  


    if (  
        cleanName.length < 2  
    ) {  

        return res.status(400).json({  
            success: false,  
            message:  
                "Full name is too short."  
        });  

    }  


    if (  
        !/^07[0-9]{8}$/.test(  
            cleanPhone  
        )  
    ) {  

        return res.status(400).json({  
            success: false,  
            message:  
                "Please enter a valid Ugandan phone number."  
        });  

    }  


    if (  
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(  
            cleanEmail  
        )  
    ) {  

        return res.status(400).json({  
            success: false,  
            message:  
                "Please enter a valid email address."  
        });  

    }  


    if (  
        password.length < 6  
    ) {  

        return res.status(400).json({  
            success: false,  
            message:  
                "Password must be at least 6 characters."  
        });  

    }  


    if (  
        password !==  
        confirmPassword  
    ) {  

        return res.status(400).json({  
            success: false,  
            message:  
                "Passwords do not match."  
        });  

    }  


    /* =================================================  
       REFERRER  
    ================================================= */  

    if (  
        cleanReferralCode  
    ) {  

        const referringUser =  
            await User.findOne({  
                referralCode:  
                    cleanReferralCode  
            });  


        if (  
            !referringUser  
        ) {  

            return res.status(400).json({  
                success: false,  
                message:  
                    "Invalid referral code."  
            });  

        }  

    }  


    /* =================================================  
       EXISTING EMAIL  
    ================================================= */  

    const existingEmail =  
        await User.findOne({  
            email:  
                cleanEmail  
        });  


    if (  
        existingEmail  
    ) {  

        return res.status(409).json({  
            success: false,  
            message:  
                "An account with this email already exists."  
        });  

    }  


    /* =================================================  
       EXISTING PHONE  
    ================================================= */  

    const existingPhone =  
        await User.findOne({  
            phone:  
                cleanPhone  
        });  


    if (  
        existingPhone  
    ) {  

        return res.status(409).json({  
            success: false,  
            message:  
                "An account with this phone number already exists."  
        });  

    }  


    /* =================================================  
       HASH PASSWORD  
    ================================================= */  

    const hashedPassword =  
        await bcrypt.hash(  
            password,  
            12  
        );  


    /* =================================================  
       CREATE USER  
    ================================================= */  

    const user =  
        new User({  

            fullName:  
                cleanName,  

            phone:  
                cleanPhone,  

            email:  
                cleanEmail,  

            password:  
                hashedPassword,  

            referredByCode:  
                cleanReferralCode ||  
                null,  

            status:  
                "inactive"  

        });

await user.save();

/* =================================================
ADMIN NOTIFICATION — NEW USER REGISTERED
========================================================= */

const admin =
await Admin.findOne({
status: "active"
}).select("_id");

if (admin) {

await Notification.create({  

    adminId:  
        admin._id,  

    type:  
        "new_user_registered",  

    title:  
        "New User Registered",  

    message:  
        `A new user, ${user.fullName}, has registered on FINORA.`,  

    isRead:  
        false  

});

}

/* =================================================
SESSION
========================================================= */

req.session.userId =  
        user._id.toString();  

    req.session.authenticated =  
        true;  


    await new Promise(  
        (resolve, reject) => {  

            req.session.save(  
                error => {  

                    if (error) {  
                        return reject(error);  
                    }  

                    resolve();  

                }  
            );  

        }  
    );  


    /* =================================================  
       SUCCESS RESPONSE  

       New account is inactive until the user has:  
       1. Approved qualifying deposit  
       2. Investment  
    ================================================= */  

    return res.status(201).json({  

        success:  
            true,  

        message:  
            "FINORA account created successfully.",  

        user: {  

            id:  
                user._id,  

            fullName:  
                user.fullName,  

            full_name:  
                user.fullName,  

            phone:  
                user.phone,  

            email:  
                user.email,  

            referralCode:  
                user.referralCode,  

            referral_code:  
                user.referralCode,  

            referredByCode:  
                user.referredByCode ||  
                null,  

            referred_by_code:  
                user.referredByCode ||  
                null,  

            balance:  
                user.balance,  

            walletBalance:  
                user.balance,  

            wallet_balance:  
                user.balance,  

            totalIncome:  
                0,  

            totalEarnings:  
                0,  

            total_earnings:  
                0,  

            totalDeposit:  
                user.totalDeposit,  

            totalInvested:  
                0,  

            total_invested:  
                0,  

            totalWithdrawal:  
                user.totalWithdrawal,  

            referralIncome:  
                0,  

            referral_income:  
                0,  

            activeInvestments:  
                0,  

            active_investments:  
                0,  

            todayEarnings:  
                0,  

            today_earnings:  
                0,  

            dailyIncome:  
                0,  

            daily_income:  
                0,  

            status:  
                "inactive",  

            createdAt:  
                user.createdAt  

        }  

    });  


} catch (error) {  

    console.error(  
        "❌ FINORA REGISTER ERROR:",  
        error  
    );  


    if (  
        error &&  
        error.code === 11000  
    ) {  

        const duplicateFields =  
            Object.keys(  
                error.keyPattern ||  
                error.keyValue ||  
                {}  
            );  


        if (  
            duplicateFields.includes(  
                "email"  
            )  
        ) {  

            return res.status(409).json({  

                success:  
                    false,  

                message:  
                    "An account with this email already exists."  

            });  

        }  


        if (  
            duplicateFields.includes(  
                "phone"  
            )  
        ) {  

            return res.status(409).json({  

                success:  
                    false,  

                message:  
                    "An account with this phone number already exists."  

            });  

        }  


        if (  
            duplicateFields.includes(  
                "referralCode"  
            )  
        ) {  

            return res.status(409).json({  

                success:  
                    false,  

                message:  
                    "Please try creating the account again."  

            });  

        }  

    }  


    return res.status(500).json({  

        success:  
            false,  

        message:  
            "FINORA could not create your account."  

    });  

}

});

/* =========================================================
LOGIN
========================================================= */

router.post("/login", async (req, res) => {

try {  

    const {  
        identifier,  
        password  
    } = req.body;  


    if (  
        !identifier ||  
        !password  
    ) {  

        return res.status(400).json({  

            success:  
                false,  

            message:  
                "Please enter your email/phone and password."  

        });  

    }  


    const cleanIdentifier =  
        String(identifier)  
            .trim()  
            .toLowerCase();  


    let user;  


    if (  
        cleanIdentifier.includes("@")  
    ) {  

        user =  
            await User.findOne({  
                email:  
                    cleanIdentifier  
            });  

    } else {  

        user =  
            await User.findOne({  
                phone:  
                    String(  
                        identifier  
                    ).trim()  
            });  

    }  


    if (!user) {  

        return res.status(401).json({  

            success:  
                false,  

            message:  
                "Invalid login credentials."  

        });  

    }  


    /* =================================================  
       FROZEN ACCOUNT  
    ================================================= */  

    if (  
        user.status === "frozen"  
    ) {  

        return res.status(403).json({  

            success:  
                false,  

            message:  
                "Your FINORA account has been frozen."  

        });  

    }  


    /* =================================================  
       PASSWORD  
    ================================================= */  

    const passwordMatches =  
        await bcrypt.compare(  
            password,  
            user.password  
        );  


    if (!passwordMatches) {  

        return res.status(401).json({  

            success:  
                false,  

            message:  
                "Invalid login credentials."  

        });  

    }  


    /* =================================================  
       ENSURE REFERRAL CODE  
    ================================================= */  

    if (  
        !user.referralCode  
    ) {  

        await user.save();  

    }  


    /* =================================================  
       SESSION  
    ================================================= */  

    req.session.userId =  
        user._id.toString();  

    req.session.authenticated =  
        true;  


    await new Promise(  
        (resolve, reject) => {  

            req.session.save(  
                error => {  

                    if (error) {  
                        return reject(error);  
                    }  

                    resolve();  

                }  
            );  

        }  
    );  


    /* =================================================  
       LOAD REAL DASHBOARD STATISTICS  
    ================================================= */  

    const [  
        statistics,  
        effectiveStatus  
    ] =  
        await Promise.all([  

            getDashboardStatistics(  
                user._id  
            ),  

            getEffectiveUserStatus(  
                user  
            )  

        ]);  


    /* =================================================  
       RESPONSE  
    ================================================= */  

    return res.status(200).json({  

        success:  
            true,  

        message:  
            "FINORA login successful.",  

        user: {  

            id:  
                user._id,  

            fullName:  
                user.fullName,  

            full_name:  
                user.fullName,  

            phone:  
                user.phone,  

            email:  
                user.email,  

            referralCode:  
                user.referralCode,  

            referral_code:  
                user.referralCode,  

            referredByCode:  
                user.referredByCode ||  
                null,  

            referred_by_code:  
                user.referredByCode ||  
                null,  

            balance:  
                Number(  
                    user.balance  
                ) || 0,  

            walletBalance:  
                Number(  
                    user.balance  
                ) || 0,  

            wallet_balance:  
                Number(  
                    user.balance  
                ) || 0,  

            totalIncome:  
                statistics.totalEarnings,  

            totalEarnings:  
                statistics.totalEarnings,  

            total_earnings:  
                statistics.totalEarnings,  

            totalDeposit:  
                Number(  
                    user.totalDeposit  
                ) || 0,  

            totalInvested:  
                statistics.totalInvested,  

            total_invested:  
                statistics.totalInvested,  

            totalWithdrawal:  
                Number(  
                    user.totalWithdrawal  
                ) || 0,  

            referralIncome:  
                statistics.referralIncome,  

            referral_income:  
                statistics.referralIncome,  

            activeInvestments:  
                statistics.activeInvestments,  

            active_investments:  
                statistics.activeInvestments,  

            todayEarnings:  
                statistics.todayEarnings,  

            today_earnings:  
                statistics.todayEarnings,  

            dailyIncome:  
                statistics.todayEarnings,  

            daily_income:  
                statistics.todayEarnings,  

            status:  
                effectiveStatus,  

            createdAt:  
                user.createdAt  

        }  

    });  


} catch (error) {  

    console.error(  
        "❌ FINORA LOGIN ERROR:",  
        error  
    );  

    return res.status(500).json({  

        success:  
            false,  

        message:  
            "FINORA could not log you in."  

    });  

}

});

/* =========================================================
GET CURRENT USER
========================================================= */

router.get("/me", async (req, res) => {

try {  

    console.log(  
        "🔐 FINORA /api/users/me SESSION:",  
        req.session  
    );  


    if (  
        !req.session ||  
        !req.session.userId  
    ) {  

        return res.status(401).json({  

            success:  
                false,  

            message:  
                "No authenticated FINORA session."  

        });  

    }  


    const user =  
        await User.findById(  
            req.session.userId  
        ).select("-password");  


    if (!user) {  

        return res.status(401).json({  

            success:  
                false,  

            message:  
                "FINORA user account could not be found."  

        });  

    }  


    if (  
        user.status === "frozen"  
    ) {  

        req.session.destroy(  
            () => {}  
        );  

        return res.status(403).json({  

            success:  
                false,  

            message:  
                "Your FINORA account has been frozen."  

        });  

    }  


    if (  
        !user.referralCode  
    ) {  

        await user.save();  

    }  


    /* =================================================  
       LOAD REAL DASHBOARD STATISTICS + STATUS  
    ================================================= */  

    const [  
        statistics,  
        effectiveStatus  
    ] =  
        await Promise.all([  

            getDashboardStatistics(  
                user._id  
            ),  

            getEffectiveUserStatus(  
                user  
            )  

        ]);  


    /* =================================================  
       RESPONSE  
    ================================================= */  

    return res.status(200).json({  

        success:  
            true,  

        user: {  

            id:  
                user._id,  

            fullName:  
                user.fullName,  

            full_name:  
                user.fullName,  

            phone:  
                user.phone,  

            email:  
                user.email,  

            referralCode:  
                user.referralCode,  

            referral_code:  
                user.referralCode,  

            referredByCode:  
                user.referredByCode ||  
                null,  

            referred_by_code:  
                user.referredByCode ||  
                null,  

            referralLink:  
                `${FRONTEND_URL}/?ref=${encodeURIComponent(  
                    user.referralCode  
                )}`,  

            /* =========================================  
               AVAILABLE WALLET  
            ========================================= */  

            balance:  
                Number(  
                    user.balance  
                ) || 0,  

            walletBalance:  
                Number(  
                    user.balance  
                ) || 0,  

            wallet_balance:  
                Number(  
                    user.balance  
                ) || 0,  


            /* =========================================  
               TOTAL EARNINGS  
            ========================================= */  

            totalIncome:  
                statistics.totalEarnings,  

            totalEarnings:  
                statistics.totalEarnings,  

            total_earnings:  
                statistics.totalEarnings,  


            /* =========================================  
               TOTAL DEPOSIT  
            ========================================= */  

            totalDeposit:  
                Number(  
                    user.totalDeposit  
                ) || 0,  


            /* =========================================  
               TOTAL INVESTED  
            ========================================= */  

            totalInvested:  
                statistics.totalInvested,  

            total_invested:  
                statistics.totalInvested,  


            /* =========================================  
               TOTAL WITHDRAWAL  
            ========================================= */  

            totalWithdrawal:  
                Number(  
                    user.totalWithdrawal  
                ) || 0,  


            /* =========================================  
               TOTAL REFERRAL BONUS  
            ========================================= */  

            referralIncome:  
                statistics.referralIncome,  

            referral_income:  
                statistics.referralIncome,  
levelOneReferralIncome:
    statistics.levelOneReferralIncome,

level_one_referral_income:
    statistics.levelOneReferralIncome,

levelTwoReferralIncome:
    statistics.levelTwoReferralIncome,

level_two_referral_income:
    statistics.levelTwoReferralIncome,

levelThreeReferralIncome:
    statistics.levelThreeReferralIncome,

level_three_referral_income:
    statistics.levelThreeReferralIncome,

            /* =========================================  
               ACTIVE INVESTMENTS  
            ========================================= */  

            activeInvestments:  
                statistics.activeInvestments,  

            active_investments:  
                statistics.activeInvestments,  


            /* =========================================  
               TODAY'S EARNINGS  
            ========================================= */  

            todayEarnings:  
                statistics.todayEarnings,  

            today_earnings:  
                statistics.todayEarnings,  

            dailyIncome:  
                statistics.todayEarnings,  

            daily_income:  
                statistics.todayEarnings,  


            status:  
                effectiveStatus,  

            createdAt:  
                user.createdAt  

        }  

    });  


} catch (error) {  

    console.error(  
        "❌ FINORA /api/users/me ERROR:",  
        error  
    );  

    return res.status(500).json({  

        success:  
            false,  

        message:  
            "FINORA could not load your account."  

    });  

}

});

/* =========================================================
GET REAL TEAM
========================================================= */

router.get("/team", async (req, res) => {

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
                "No authenticated FINORA session."  

        });  

    }  


    /* =================================================  
       CURRENT USER  
    ================================================= */  

    const currentUser =  
        await User.findById(  
            req.session.userId  
        ).select(  
            "_id fullName referralCode status createdAt"  
        );  


    if (!currentUser) {  

        return res.status(401).json({  

            success:  
                false,  

            message:  
                "FINORA user account could not be found."  

        });  

    }  


    if (  
        currentUser.status === "frozen"  
    ) {  

        req.session.destroy(  
            () => {}  
        );  

        return res.status(403).json({  

            success:  
                false,  

            message:  
                "Your FINORA account has been frozen."  

        });  

    }  


    /* =================================================  
       LEVEL 1  
    ================================================= */  

    const levelOneUsers =  
        currentUser.referralCode  
            ? await User.find({  
                referredByCode:  
                    currentUser.referralCode  
            })  
                .select(  
                    "_id fullName phone referralCode referredByCode totalDeposit status createdAt"  
                )  
                .sort({  
                    createdAt:  
                        -1  
                })  
            : [];  


    /* =================================================  
       LEVEL 2  
    ================================================= */  

    const levelOneCodes =  
        levelOneUsers  
            .map(  
                user =>  
                    user.referralCode  
            )  
            .filter(Boolean);  


    const levelTwoUsers =  
        levelOneCodes.length > 0  
            ? await User.find({  
                referredByCode: {  
                    $in:  
                        levelOneCodes  
                }  
            })  
                .select(  
                    "_id fullName phone referralCode referredByCode totalDeposit status createdAt"  
                )  
                .sort({  
                    createdAt:  
                        -1  
                })  
            : [];  


    /* =================================================  
       LEVEL 3  
    ================================================= */  

    const levelTwoCodes =  
        levelTwoUsers  
            .map(  
                user =>  
                    user.referralCode  
            )  
            .filter(Boolean);  


    const levelThreeUsers =  
        levelTwoCodes.length > 0  
            ? await User.find({  
                referredByCode: {  
                    $in:  
                        levelTwoCodes  
                }  
            })  
                .select(  
                    "_id fullName phone referralCode referredByCode totalDeposit status createdAt"  
                )  
                .sort({  
                    createdAt:  
                        -1  
                })  
            : [];  


    /* =================================================  
       FORMAT MEMBERS  
    ================================================= */  

    const formatMember =  
        async (user, level) => {  

            const totalDeposit =  
                Number(  
                    user.totalDeposit  
                ) || 0;  


            const effectiveStatus =  
                await getEffectiveUserStatus(  
                    user  
                );  


            return {  

                id:  
                    user._id,  

                fullName:  
                    user.fullName,  

                full_name:  
                    user.fullName,  

                phone:  
                    user.phone || "",  

                referralCode:  
                    user.referralCode,  

                referral_code:  
                    user.referralCode,  

                referredByCode:  
                    user.referredByCode ||  
                    null,  

                referred_by_code:  
                    user.referredByCode ||  
                    null,  

                totalDeposit:  
                    totalDeposit,  

                total_deposit:  
                    totalDeposit,  

                status:  
                    effectiveStatus,  

                level,  

                createdAt:  
                    user.createdAt  

            };  

        };  


    /* =================================================  
       BUILD COMPLETE TEAM  
    ================================================= */  

    const members = [  

        ...await Promise.all(  
            levelOneUsers.map(  
                user =>  
                    formatMember(  
                        user,  
                        1  
                    )  
            )  
        ),  

        ...await Promise.all(  
            levelTwoUsers.map(  
                user =>  
                    formatMember(  
                        user,  
                        2  
                    )  
            )  
        ),  

        ...await Promise.all(  
            levelThreeUsers.map(  
                user =>  
                    formatMember(  
                        user,  
                        3  
                    )  
            )  
        )  

    ];  


    /* =================================================  
       RESPONSE  
    ================================================= */  

    return res.status(200).json({  

        success:  
            true,  

        team:  
            members,  

        members:  
            members,  

        summary: {  

            total:  
                members.length,  

            levelOne:  
                levelOneUsers.length,  

            levelTwo:  
                levelTwoUsers.length,  

            levelThree:  
                levelThreeUsers.length  

        },  

        commissionRates: {  

            levelOne:  
                15,  

            levelTwo:  
                5,  

            levelThree:  
                2  

        }  

    });  


} catch (error) {  

    console.error(  
        "❌ FINORA /api/users/team ERROR:",  
        error  
    );  


    return res.status(500).json({  

        success:  
            false,  

        message:  
            "FINORA could not load your team."  

    });  

}

});

/* =========================================================
CHANGE PASSWORD
========================================================= */

router.post(
"/change-password",
async (req, res) => {

try {  

        if (  
            !req.session ||  
            !req.session.userId  
        ) {  

            return res.status(401).json({  

                success:  
                    false,  

                message:  
                    "You must be logged in to change your password."  

            });  

        }  


        const user =  
            await User.findById(  
                req.session.userId  
            );  


        if (!user) {  

            return res.status(401).json({  

                success:  
                    false,  

                message:  
                    "FINORA user account could not be found."  

            });  

        }  


        if (  
            user.status === "frozen"  
        ) {  

            req.session.destroy(  
                () => {}  
            );  

            return res.status(403).json({  

                success:  
                    false,  

                message:  
                    "Your FINORA account has been frozen."  

            });  

        }  


        const {  
            currentPassword,  
            newPassword,  
            confirmPassword  
        } = req.body;  


        if (  
            !currentPassword ||  
            !newPassword ||  
            !confirmPassword  
        ) {  

            return res.status(400).json({  

                success:  
                    false,  

                message:  
                    "Please fill in all password fields."  

            });  

        }  


        if (  
            String(  
                newPassword  
            ).length < 6  
        ) {  

            return res.status(400).json({  

                success:  
                    false,  

                message:  
                    "New password must be at least 6 characters."  

            });  

        }  


        if (  
            newPassword !==  
            confirmPassword  
        ) {  

            return res.status(400).json({  

                success:  
                    false,  

                message:  
                    "New passwords do not match."  

            });  

        }  


        const passwordMatches =  
            await bcrypt.compare(  
                currentPassword,  
                user.password  
            );  


        if (!passwordMatches) {  

            return res.status(401).json({  

                success:  
                    false,  

                message:  
                    "Current password is incorrect."  

            });  

        }  


        const samePassword =  
            await bcrypt.compare(  
                newPassword,  
                user.password  
            );  


        if (  
            samePassword  
        ) {  

            return res.status(400).json({  

                success:  
                    false,  

                message:  
                    "New password must be different from your current password."  

            });  

        }  


        const hashedPassword =  
            await bcrypt.hash(  
                newPassword,  
                12  
            );  


        user.password =  
            hashedPassword;  


        await user.save();  


        return res.status(200).json({  

            success:  
                true,  

            message:  
                "FINORA password changed successfully."  

        });  


    } catch (error) {  

        console.error(  
            "❌ FINORA CHANGE PASSWORD ERROR:",  
            error  
        );  


        return res.status(500).json({  

            success:  
                false,  

            message:  
                "FINORA could not change your password right now."  

        });  

    }  

}

);

/* =========================================================
FORGOT PASSWORD
========================================================= */

router.post(
"/forgot-password",
async (req, res) => {

try {  

        const {  
            identifier,  
            newPassword,  
            confirmPassword  
        } = req.body;  


        if (  
            !identifier ||  
            !newPassword ||  
            !confirmPassword  
        ) {  

            return res.status(400).json({  

                success:  
                    false,  

                message:  
                    "Please fill in all required fields."  

            });  

        }  


        const cleanIdentifier =  
            String(  
                identifier  
            ).trim();  


        if (  
            String(  
                newPassword  
            ).length < 6  
        ) {  

            return res.status(400).json({  

                success:  
                    false,  

                message:  
                    "New password must be at least 6 characters."  

            });  

        }  


        if (  
            newPassword !==  
            confirmPassword  
        ) {  

            return res.status(400).json({  

                success:  
                    false,  

                message:  
                    "New passwords do not match."  

            });  

        }  


        let user;  


        if (  
            cleanIdentifier.includes("@")  
        ) {  

            user =  
                await User.findOne({  
                    email:  
                        cleanIdentifier.toLowerCase()  
                });  

        } else {  

            user =  
                await User.findOne({  
                    phone:  
                        cleanIdentifier  
                });  

        }  


        if (!user) {  

            return res.status(404).json({  

                success:  
                    false,  

                message:  
                    "No FINORA account was found with that email or phone number."  

            });  

        }  


        if (  
            user.status === "frozen"  
        ) {  

            return res.status(403).json({  

                success:  
                    false,  

                message:  
                    "Your FINORA account has been frozen."  

            });  

        }  


        const samePassword =  
            await bcrypt.compare(  
                newPassword,  
                user.password  
            );  


        if (  
            samePassword  
        ) {  

            return res.status(400).json({  

                success:  
                    false,  

                message:  
                    "New password must be different from your current password."  

            });  

        }  


        const hashedPassword =  
            await bcrypt.hash(  
                newPassword,  
                12  
            );  


        user.password =  
            hashedPassword;  


        user.resetPasswordToken =  
            null;  

        user.resetPasswordExpires =  
            null;  


        await user.save();  


        return res.status(200).json({  

            success:  
                true,  

            message:  
                "Your FINORA password has been recovered successfully. Please log in to your account."  

        });  


    } catch (error) {  

        console.error(  
            "❌ FINORA FORGOT PASSWORD ERROR:",  
            error  
        );  


        return res.status(500).json({  

            success:  
                false,  

            message:  
                "FINORA could not recover your password right now."  

        });  

    }  

}

);

/* =========================================================
LOGOUT
========================================================= */

router.post(
"/logout",
(req, res) => {

req.session.destroy(  
        error => {  

            if (error) {  

                console.error(  
                    "❌ FINORA LOGOUT ERROR:",  
                    error  
                );  

                return res.status(500).json({  

                    success:  
                        false,  

                    message:  
                        "FINORA could not log you out."  

                });  

            }  


            res.clearCookie(  
                "finora.sid",  
                {  
                    httpOnly:  
                        true,  

                    secure:  
                        true,  

                    sameSite:  
                        "none",  

                    path:  
                        "/"  
                }  
            );  


            return res.status(200).json({  

                success:  
                    true,  

                message:  
                    "FINORA logout successful."  

            });  

        }  
    );  

}

);

/* =========================================================
EXPORT
========================================================= */

module.exports =
router;
