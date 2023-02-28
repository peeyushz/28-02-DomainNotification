var axios = require('axios');
const dotenv = require('dotenv');
const CryptoJS = require('crypto-js');
const mongoose = require('mongoose');
const planModel = require("../../models/planModel");
const userModel = require("../../models/userModel");
const paymentModel = require("../../models/paymentModel");
const purchaseModel = require('../../models/planPurchaseModel');
const { isUserExists } = require("../user/user")
const Validator = require("../../helpers/validators")
const { countryCodes } = require("../../config/mobile");
const planPurchaseModel = require('../../models/planPurchaseModel');
dotenv.config();
const YOUR_DOMAIN = process.env.YOUR_DOMAIN
const BASE_URL = process.env.BASE_URL

const ObjectId = mongoose.Types.ObjectId;

const createPaymentUrl = async (purchaseObject) => {
    try {
        const obj = JSON.stringify(purchaseObject);
        const {data} = await axios.post('https://merchants.api.sandbox-utrust.com/api/stores/orders', obj, {
            headers: {
                'Authorization': process.env.UTRUST_KEY,
                'Content-Type': 'application/json',
            }
        });
        if (data.errors) {
            return false;
        } else {
            return data;
        }
    } catch (error) {
        return false;
    }
}

const orderIdGenerator = async () => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 15; i++) {
        result += characters.charAt(Math.floor(Math.random() * 62));
    }
    result = "order-" + result
    const isOrderIdExist = await paymentModel.find({ orderId: result }).countDocuments();
    if (isOrderIdExist > 0) {
        return await orderIdGenerator()
    }
    return result;

}

exports.createUtrustPayment = async (req, res) => {
    try {
        let data = Validator.checkValidation(req.body);
        if (data['success'] == true) {
            data = data['data'];
        } else {
            return res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: '' });
        }
        if (await isUserExists(req.user.id) && await userModel.find({_id:ObjectId(req.user.id), isEmailVerified:true}).countDocuments() > 0) {
            if (!Validator.varCharVerification(data.planid)) {
                return res.status(203).send({ success: false, msg: "Please select a plan first", data: {}, errors: "" });
            } else {
                const plan = await planModel.find({ _id: ObjectId(`${data.planid}`) });
                if (plan.length == 1) {
                    const userDetails = await userModel.findOne({ _id: ObjectId(`${req.user.id}`) });
                    const orderId = await orderIdGenerator();
                    const country = countryCodes.find(country => country.dial_code === data.countryCode);
                    const purchaseObject = {
                        "data": {
                            "type": "orders",
                            "attributes": {
                                "order": {
                                    "reference": orderId,
                                    "amount": {
                                        "total": (plan[0].price).toString(),
                                        "currency": "USD",
                                        "details": {
                                            "subtotal": (plan[0].price).toString(),
                                            "shipping": "0.00",
                                            "tax": "0.00",
                                            "discount": "0.00"
                                        }
                                    },
                                    "return_urls": {
                                        "return_url": `${YOUR_DOMAIN}/payment-successful`,
                                        "cancel_url": `${YOUR_DOMAIN}/payment-failed`,
                                        "callback_url": `${BASE_URL}/api/utrust-callback`
                                    },
                                    "line_items": [
                                        {
                                            "sku": plan[0]._id,
                                            "name": plan[0].planType + "Plan",
                                            "price": (plan[0].price).toString(),
                                            "currency": "USD",
                                            "quantity": 1
                                        }
                                    ]
                                },
                                "customer": {
                                    "name": data.name,
                                    "email": data.email,
                                    "phoneNo": data.phoneNo,
                                    "country": country.code,
                                }
                            }
                        }
                    }
                    const paymentData = new paymentModel({
                        planId: plan[0]._id,
                        userId: req.user.id,
                        orderId: orderId,
                        amount: plan[0].price,
                        actuallyPaid: 0,
                        status: "INITIATED",
                        paymentMethod: "UTrust",
                    })
                    paymentData.save().then(async (isSaved) => {
                        if (isSaved) {
                            let currentTime = Date.now();
                            let expireTime;
                            if (plan[0].planType == "Monthly") {
                                expireTime = ((currentTime) + (1000 * 60 * 60 * 24 * 30)) / 1000;
                            } else if (plan[0].planType == "Yearly") {
                                expireTime = ((currentTime) + (1000 * 60 * 60 * 24 * 365)) / 1000;
                            } else {
                                expireTime = "undefiend";
                            }
                            const purchaseData = new purchaseModel({
                                userId: req.user.id,
                                orderId: orderId,
                                planId: plan[0]._id,
                                typeOfAlerts: data.alertType,
                                isActive: false,
                                startTime: Math.floor(Date.now() / 1000),
                                planExpiryTime: Math.floor(expireTime)
                            })
                            const savedPurchase = await purchaseData.save();
                            const isLinkCreated = await createPaymentUrl(purchaseObject);
                            if (!isLinkCreated) {
                                return res.status(203).send({ success: false, msg: "Can't process your request now please try gain later", errors: "" })
                            } else {
                                if ("data" in isLinkCreated && "attributes" in isLinkCreated.data && "redirect_url" in isLinkCreated.data.attributes && "id" in isLinkCreated.data) {
                                    await paymentModel.findOneAndUpdate({ orderId: orderId }, { paymentId: isLinkCreated.data.id });
                                    return res.status(203).send({ success: true, msg: "Success", data: isLinkCreated.data.attributes.redirect_url, errors: "" })
                                } else {
                                    return res.status(203).send({ success: false, msg: "Can't process your request now please try gain later", errors: "" })
                                }
                            }
                        } else {
                            return res.status(203).send({ success: false, msg: "Can't process your request now please try gain later", errors: "" })
                        }
                    }).catch((error) => {
                        return res.status(203).send({ success: false, msg: "Can't process your request now please try gain later", errors: "" })
                    })
                }
            }
        }
        else{
            return res.status(203).send({ success: false, msg: "Please verify your email before continuing", errors: "" })
        }
    } catch (error) {
        return res.status(203).send({ success: false, msg: "Can't process your request now please try gain later", errors: "" })
    }
}

exports.paymentUpdate = async (req, res) => {
    try {
        const data = req.body;
        const joined_payload = "event_type" + data.event_type + "resourceamount" + data.resource.amount + "resourcecurrency" + data.resource.currency + "resourcereference" + data.resource.reference + "state" + data.state + ""
        const payloadSignature = data.signature;
        const signedSignature = CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(joined_payload, process.env.UTRUST_SECRET));
        console.log("Here");
        if (payloadSignature === signedSignature) {
            const orderDetails = await paymentModel.find({ orderId: data.resource.reference });
            if (orderDetails.length) {
                if (orderDetails[0].status !== "FINISHED") {
                    if (data.event_type === "ORDER.PAYMENT.RECEIVED") {
                        if (Number(orderDetails[0].amount) === Number(data.resource.amount)) {
                            console.log("here is",data.resource.reference);
                            const updatePayment = await paymentModel.findOneAndUpdate({ orderId: data.resource.reference }, { status: "FINISHED", actuallyPaid: data.resource.amount });
                            const updatePurchaseStatus = await purchaseModel.findOneAndUpdate({ orderId: data.resource.reference }, { isActive: true });
                            console.log("status",updatePurchaseStatus);
                            return res.status(200).send({ success: true, msg: "Success", err: "" })
                        } else {
                            const updatePayment = await paymentModel.findOneAndUpdate({ orderId: data.resource.reference }, { status: "PARTIALLY PAID", actuallyPaid: data.resource.amount });
                            return res.status(200).send({ success: true, msg: "Success", err: "" })
                        }
                    } else {
                        if (data.event_type === "ORDER.PAYMENT.CANCELLED") {
                            const updatePayment = await paymentModel.findOneAndUpdate({ orderId: data.resource.reference }, { status: "FAILED", actuallyPaid: 0 });
                            return res.status(200).send({ success: true, msg: "Success", err: "" })
                        } else if (data.event_type === "ORDER.PAYMENT.DETECTED") {
                            const updatePayment = await paymentModel.findOneAndUpdate({ orderId: data.resource.reference }, { status: "WAITING" });
                            return res.status(200).send({ success: true, msg: "Success", err: "" })
                        }
                    }
                } else {
                    return res.status(200).send({ success: true, msg: "Success", err: "" })
                }
            } else {
                return res.status(203).send({ success: false, msg: "Order not found", err: "Order reference not found" })
            }
        } else {
            return res.status(203).send({ success: false, msg: "Unauthorized request", err: "Unauthorized request" })
        }
    } catch (error) {
        return res.status(500).send({ success: false, msg: "Internal server error", err: "error.message" })
    }
}