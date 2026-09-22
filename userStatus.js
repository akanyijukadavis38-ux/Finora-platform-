const Deposit = require("./Deposit");
const Investment = require("./investment");

const MIN_QUALIFYING_DEPOSIT = 10000;

async function getEffectiveUserStatus(user) {
if (!user) {
return "inactive";
}

if (user.status === "frozen") {
    return "frozen";
}

const [approvedDeposit, investment] =
    await Promise.all([
        Deposit.findOne({
            user: user._id,
            status: "approved",
            amount: {
                $gte: MIN_QUALIFYING_DEPOSIT
            }
        })
        .select("_id")
        .lean(),

        Investment.findOne({
            user: user._id
        })
        .select("_id")
        .lean()
    ]);

if (
    approvedDeposit &&
    investment
) {
    return "active";
}

return "inactive";

}

module.exports = {
getEffectiveUserStatus,
MIN_QUALIFYING_DEPOSIT
};
