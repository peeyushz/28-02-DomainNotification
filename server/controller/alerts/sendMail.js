const { send_mails } = require("../email/email");

exports.sendMail = async (to_mail) => {
    const emailName = to_mail.split("@")[0];
    const htmlContent = "<p>Hi "+emailName[0]+",</p><p>Your domain is about to expire. Kindly renew it before expiry time.</p>"
    await send_mails(to_mail, "Domain Expiry Alert", htmlContent);
}