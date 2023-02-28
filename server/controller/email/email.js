"use strict";
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
dotenv.config();
var otpModel = require('../../models/otpModel');
const userModel = require('../../models/userModel');
const Validator = require("../../helpers/validators")
const Crypto = require("../../helpers/encrypt")

var send_mails = exports.send_mails = (to_mail, subj, htmlBody)=>{
    try {
        return new Promise(function(Resolve, Reject) {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                // host: 'smtp.gmail.com',
                // port: 465,
                // secure: true,
                auth: {
                    user: process.env.MAIL_FROM,
                    pass: process.env.MAIL_PASS
                }
            });
            var mailOptions = {
                from: process.env.mail_from,
                to: to_mail,
                subject: subj,
                html: htmlBody
            };

            transporter.sendMail(mailOptions, async function(info, error) {
                setTimeout(() => { Resolve(true); }, 3000);
            })
        })
    } catch (err) {
        console.error(err);
    }
}

exports.resendVerificationLink = async(req, res) => {
    try{
        const isUser = await isUserExists(req.user.id);
        if(isUser){
            const userCount = await userModel.find({_id: ObjectId(`${req.user.id}`), isEmailVerified:false }).countDocuments();
            if(userCount == 1){
                const isEmailVerified = await userModel.find({_id: ObjectId(`${req.user.id}`), isEmailVerified:false }).countDocuments();
                if(isEmailVerified == 1){
                    const emailName = req.user.email.split("@")[0];
                    const tx_id = 'RG'+emailName+""+Math.floor(Date.now() / 1000);
                    const otp = Math.floor(Math.random() * 8999) + 1000;

                    await userModel.findOneAndUpdate({_id: ObjectId(`${req.user.id}`)}, {otp: otp, otpTxId: tx_id});

                    const key = Crypto.aesEncrypt(tx_id);	
                    const token = Crypto.aesEncrypt(`${otp}`);
                    const link = `${process.env.EMAIL_LINK}/verification?token=${token}&key=${key}`

                    let htmlContent = "<p>Hi "+emailName[0]+",</p><p>Verify your email to finish signing up with Codebird NFT Marketplace. Use the following verification code.</p>";
                            htmlContent = htmlContent + "<a href="+ link +" target='_blank'>" + link + "</a></h1><p>Please click on link above to verify your email</p><p>Team Codebird</p>";
                    const sendMail = await send_mails(req.user.email, "Verify Email", htmlContent);
                    if(sendMail){
                        return res.status(200).send({ success: true, msg: "A fresh verification link has been sent to your email address.", data: '', errors: '' });
                    }else{
                        return res.status(203).send({ success: false, msg: "Error while sending mail please try again later", data: '', errors: '' });
                    }
                }else{
                    return res.status(203).send({ success: false, msg: "Either your email is already verified or you are an old user", data: '', errors: '' });
                }
            }else{
                return res.status(203).send({ success: false, msg: "User not found ", data: '', errors: '' });
            }
        }else{
            return res.status(203).send({ success: false, msg: "User not found", data: '', errors: '' });
        }
    }catch(err){
        console.error(err);
        return res.status(203).send({ success: false, msg: "Error while processing your request",  errors: '' });
    }
        
}

exports.forgetPasswordVerification = async(req, res) => {
    try {
        let data = Validator.checkValidation(req.query);
        if (data['success'] === true) {
            data = data['data'];
        } else {
            return res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: '' });
        }
        var Email = data.email;
        if(Validator.emailVerification(data.email)){
            const isUserExist = await userModel.find({ email:Email}).countDocuments(); 
            if (isUserExist) {
                const emailName = Email.split("@")[0];
                let userDetails = await userModel.findOne({ email: Email });
                let otp = Math.floor(Math.random() * 8999) + 1000;
                let tx_id = 'FP'+userDetails.name+""+Math.floor(Date.now() / 1000);
                const EncToken = Crypto.aesEncrypt(`${otp}`);
                const EncKey = Crypto.aesEncrypt(tx_id);
                // const link = `${process.env.BASEURL}/api/forget-password-verify-link?token=${EncToken}&key=${EncKey}`
                const link = `${process.env.EMAIL_LINK}/resetPassword?token=${EncToken}&key=${EncKey}`
                let htmlContent = "<p>Hi "+emailName[0]+",</p><p>Verify your email to finish signing up with Codebird NFT Marketplace. Use the following verification code.</p>";
                        htmlContent = htmlContent + "<a href="+ link +">" + link + "</a><p>click on the link above</p><p>Team Codebird</p>";
                const sendMail = await send_mails(Email, "Forget password", htmlContent);
                if(sendMail){
                    const saveInfo = await userModel.findOneAndUpdate({ email: Email }, {$set:{otp:otp, otpTxId:tx_id}});
                    if(saveInfo){
                        return res.status(200).send({ success: true, msg: "Please check your email for password reset link!", data: '', errors: '' });
                    }else{
                        return res.status(203).send({ success: false, msg: "Error while sending mail.", data: '', errors: '' });
                    } 
                }else{
                    return res.status(203).send({ success: false, msg: "Error while sending mail ! Please try again later", data: '', errors: '' });
                }
            } else {
                res.status(203).send({ success: false, msg: "We can't find a user with that e-mail address.", data:'', errors: '' });
            }
        }else{
            res.status(203).send({ success: false, msg: "Invalid email.", data:'', errors: '' });
        } 
    }catch(err){
        console.log(err);
        return res.status(500).send({success:false, msg: err.message || "Error while processing your request please try again later", data:"", errors:err.message
        });
    }
}