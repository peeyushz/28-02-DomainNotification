const dotenv = require("dotenv");
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_MOBILE_NO;
const client = require("twilio")(accountSid, authToken);

exports.sendWhatsapp = (toNumber) => {
    client.messages.create({ body: "Hi, your domain is about to expire. Kindly renew it before expiry time.", from: `whatsapp:${fromNumber}`, to: `whatsapp:${toNumber}` });
};