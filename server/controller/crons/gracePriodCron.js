const cron = require("node-cron");
const connectDB = require("../../database/dbConnection");
const domainModel = require("../../models/domainModel");
const planPurchaseModel = require("../../models/planPurchaseModel");
const userModel = require("../../models/userModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
// const { sendMail } = require("./sendMail");
// const { sendSMS } = require("./sendSMS");
// const { sendWhatsapp } = require("./sendWhatsapp");

cron.schedule('0 0 * * *', async() => {
// const gracePeriod = async () => {
    const domains = await planPurchaseModel.aggregate([
        {
            $match: {
                isActive: true,
            },
        },
        {
            $lookup: {
                from: "domains",
                localField: "userId",
                foreignField: "userId",
                as: "domain",
            },
        },
        {
            $unwind: {
                path: "$domain",
            },
        },
    ]);
    domains.forEach(async (domain) => {
        const epochTime = Math.floor(new Date().getTime()/1000);
        if (epochTime > domain.domain.expiryDate) {
            await domainModel.findOneAndUpdate({ _id: domain.domain._id }, { status: "Grace Period", alertTime: domain.domain.expiryDate + 7516800 });
        }
    });
// };
});
cron.schedule('* * * * *', async() => {
// const planExpired = async () => {
    const subscribedUsers = await planPurchaseModel.find({ isActive: true });
    subscribedUsers.forEach(async (user) => {
        const epochTime = Math.floor(new Date().getTime()/1000);
        if (user.planExpiryTime < epochTime) {
            await planPurchaseModel.findOneAndUpdate({ _id: user._id }, { isActive: false });
        }
    });
// };
})
// planExpired()