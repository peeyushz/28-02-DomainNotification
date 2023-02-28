const cron = require("node-cron");
const connectDB = require("../../database/dbConnection");
const domainModel = require("../../models/domainModel");
const planPurchaseModel = require("../../models/planPurchaseModel");
const userModel = require("../../models/userModel");
const mongoose = require("mongoose");
var dotenv = require("dotenv");
const { getExpiry, ensContract } = require("../domain/domain");
const ObjectId = mongoose.Types.ObjectId;
dotenv.config();
const { sendMail } = require("../alerts/sendMail");
const { sendSMS } = require("../alerts/sendSMS");
const { sendWhatsapp } = require("../alerts/sendWhatsapp");

// cron.schedule('*/30 * * * * *', async() => {
// // const gracePeriod = async () => {
//     const epochTime = Math.floor(new Date().getTime()/1000);
//     connectDB();
//     console.log("checking");

//     const subscribedUsers = await planPurchaseModel.find({ isActive: true });

//     subscribedUsers.forEach(async (user) => {

//         const domains = await domainModel.find({ userId: user.userId, areNotificationsEnabled: true });

//         domains.forEach((domain) => {
//             domain.alerts.forEach(async (alert) => {
//                 if (domain.alertTime && domain.labelHash) {
//                     // const date = new Date();
//                     // const alertTime = nedomain.alertTime
//                     // const expiryDate = getExpiry(domain.labelHash);
//                     // console.log(ensContract.methods)
//                     // console.log(process.env.ENS_CONTRACT_MAINNET);
//                     ensContract.options.address = "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85"
//                     const expiryDate = await ensContract.methods.nameExpires(domain.labelHash).call();
//                     console.log(epochTime, domain.alertTime);
//                     if(expiryDate > domain.expiryDate){
//                         await domainModel.findOneAndUpdate({_id: domain._id},{expiryDate: expiryDate, alertTime: expiryDate-(domain.expiryDate-domain.alertTime)});
//                     }
//                     else{
//                         if (alert == "sms") {
//                             // setInterval(async function () {
//                                 if (
//                                     // date.getHours() == alertHour &&
//                                     // date.getMinutes() == alertMinutes &&
//                                     epochTime===domain.alertTime
//                                     // date.getDate() >= alertDate &&
//                                     // "0" + (date.getMonth() + 1).toString() >= alertMonth &&
//                                     // date.getFullYear() >= alertYear
//                                 ) {
//                                     // sendSMS(userDetails.countryCode+userDetails.phoneNo.toString())

//                                     console.log("Sending SMS");
//                                     await domainModel.findOneAndUpdate({ _id: domain._id }, { status: "Complete", alertTime: alertTime+86400 });
//                                 }
//                             // }, 30000);
//                         } else if (alert == "whatsapp") {
//                             // setInterval(async function () {
//                                 // var date = new Date();
//                                 if (
//                                     // date.getHours() == alertHour &&
//                                     // date.getMinutes() == alertMinutes &&
//                                     epochTime===domain.alertTime
//                                     // date.getDate() >= alertDate &&
//                                     // "0" + (date.getMonth() + 1).toString() >= alertMonth &&
//                                     // date.getFullYear() >= alertYear
//                                 ) {
//                                     // sendWhatsapp(userDetails.countryCode+userDetails.whatsappNo.toString())
//                                     console.log("Sending Whatsapp Message");
//                                     await domainModel.findOneAndUpdate({ _id: domain._id }, { status: "Complete", alertTime: alertTime+86400 });
//                                 }
//                             // }, 30000);
//                         } else if (alert == "email") {
//                             // setInterval(async function () {
//                                 // var date = new Date();
//                                 if (
//                                     // date.getHours() == alertHour &&
//                                     // date.getMinutes() == alertMinutes &&
//                                     epochTime===domain.alertTime
//                                     // date.getDate() >= alertDate &&
//                                     // "0" + (date.getMonth() + 1).toString() >= alertMonth &&
//                                     // date.getFullYear() >= alertYear
//                                 ) {
//                                     // sendMail(userDetails.email)
//                                     console.log("Sending Email");
//                                     await domainModel.findOneAndUpdate({ _id: domain._id }, { status: "Complete", alertTime: alertTime+86400 });
//                                 }
//                             // }, 30000);
//                         }
//                     }
//                 }
//             });
//         });
//     });
// // };
// });
// alerts();

cron.schedule('* * * * *',async () => {
        const epochTime = Math.floor(new Date().getTime()/1000);
        const details = await planPurchaseModel.aggregate([
            {
                $match: {
                    isActive: true,
                },
            },
            {
                $addFields: {
                    user: {
                        $toObjectId: "$userId",
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            {
                $lookup: {
                    from: "domains",
                    localField: "userId",
                    foreignField: "userId",
                    as: "domains",
                },
            },
            {
                $project: {
                    name: {
                        $arrayElemAt: ["$userDetails.name", 0],
                    },
                    email: {
                        $arrayElemAt: ["$userDetails.email", 0],
                    },
                    mobile: {
                        $arrayElemAt: ["$userDetails.phoneNo", 0],
                    },
                    whatsapp: {
                        $arrayElemAt: ["$userDetails.whatsappNo", 0],
                    },
                    countryCode: {
                        $arrayElemAt: ["$userDetails.countryCode", 0],
                    },
                    domains: 1,
                },
            },
            {
                $unwind: {
                    path: "$domains",
                },
            },
        ]);
        details.map(async (item) => {
            ensContract.options.address = "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85";
            const expiryDate = await ensContract.methods.nameExpires(item.domains.labelHash).call();
            if (expiryDate > item.domains.expiryDate) {
                await domainModel.findOneAndUpdate(
                    { _id: item.domains._id },
                    { expiryDate: expiryDate, alertTime: expiryDate - (item.domains.expiryDate - item.domains.alertTime) }
                    );
                } else {
                item.domains.alerts.forEach(async (alert) => {
                    if (alert == "sms" && epochTime === item.domains.alertTime) {
                            // sendSMS(item.countryCode+item.mobile.toString());?
// console.log("Sending SMS");
                            await domainModel.findOneAndUpdate({ _id: item.domains._id }, { status: "Complete", alertTime: item.domains.alertTime + 86400 });
                    } else if (alert == "whatsapp" && epochTime === item.domains.alertTime) {
                            // sendWhatsapp(item.countryCode+item.whatsapp.toString())
                            // console.log("Sending Whatsapp Message");
                            await domainModel.findOneAndUpdate({ _id: item.domains._id }, { status: "Complete", alertTime: item.domains.alertTime + 86400 });
                    } else if (alert == "email" && epochTime === item.domains.alertTime) {
                            sendMail(item.email);
                            await domainModel.findOneAndUpdate({ _id: item.domains._id }, { status: "Complete", alertTime: item.domains.alertTime + 86400 });
                    }
                });
            }
        });
    }
)

// sendAlert();
