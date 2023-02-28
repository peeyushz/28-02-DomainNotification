"use strict";
const sha256 = require('sha256');
const Validator = require('../../helpers/validators');
const Crypto = require("../../helpers/encrypt")
const mongoose = require('mongoose');
const JWT = require('../jwt/jwt');
const userModel = require('../../models/userModel');
const jwtModel = require('../../models/jwtModel');
const emailSender = require("../email/email")
const ObjectId = mongoose.Types.ObjectId;

const isUserExists = exports.isUserExists = async(userId) => {
    const userCount = await userModel.find({_id:ObjectId(userId)}).countDocuments();
    if(userCount == 1){
        return true;
    }else{
        return false
    }
}

exports.register = async(req, res) => {
    try {
        let data = Validator.checkValidation(req.body);
        if (data['success'] == true) {
            data = data['data'];
        } else {
            return res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: '' });
        }
        const name=data.name
        const email=data.email
        const password=data.password
        const rePassword=data.rePassword
        const phoneNo=data.phoneNo
        const whatsappNo=data.whatsappNo
        const countryCode=data.countryCode

        if(!(Validator.fullNameVerification(name)))res.status(203).send("Invalid Name");
        else if(!(Validator.emailVerification(email)))res.status(203).send("Invalid Email");
        else if(!(Validator.passWordVerification(password)))res.status(203).send("Invalid Password");
        else if(!(password===rePassword))res.status(203).send("Passwords do not match");
        else if(!(Validator.phoneNumberValidator(countryCode,phoneNo)))res.status(203).send("Invalid Phone Number");
        else if(!(Validator.phoneNumberValidator(countryCode,whatsappNo)))res.status(203).send("Invalid WhatsApp Number");
        else{
            const NoOfRecords = await userModel.find({ email: email }).countDocuments();
            if (NoOfRecords == 0) {
                if (password == rePassword) {
                    const password_hash = sha256(password);
                    const tx_id = 'RG' + name + "" + Math.floor(Date.now() / 1000);
                    const otp = Math.floor(Math.random() * 8999) + 1000;
                    const Enckey = Crypto.aesEncrypt(tx_id);	
                    const EncOtp = Crypto.aesEncrypt(`${otp}`);
                    const link =  `${process.env.EMAIL_LINK}/verification?token=${EncOtp}&key=${Enckey}`
                    //new user
                    const NewUser = new userModel({
                        name: name,
                        email: email,
                        password: password_hash,
                        countryCode: countryCode,
                        phoneNo: phoneNo,
                        whatsappNo: whatsappNo,
                        otp: otp,
                        otpTxId: tx_id,
                    })

                    NewUser.save(NewUser).then(async(data) => {
                        let htmlContent = "<p>Hi "+name+",</p><p>Verify your email to finish signing up with Codebird NFT Marketplace. Use the following verification link.</p>";
                            htmlContent = htmlContent + "<a href="+ link +" target='_blank'>" + link + "</a></h1><p>Please click on link above to verify your email</p><p>Team Codebird</p>";
                        const sendMail = await emailSender.send_mails(email, "Verify email",htmlContent)
                        return res.status(200).send({ success: true, msg: "User Created successfully", data: '', errors: '' });
                    }).catch(err => {
                        res.status(500).send({ success: true, message: err.message || "Some error occurred while creating a create operation", data:"", errors:err.message});
                    });
                } else {
                    res.status(203).send({ success: false, msg: "Password and confirm password don't match", data: {}, errors: err });
                }
            } else {
                res.status(203).send({ success: false, msg: "Email already exists", data: {}, errors: '' });
            }
        }
        
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error", data: {}, errors: err });
    }
}

exports.login = async(req, res) => {
    try {
        let data = Validator.checkValidation(req.body);
        if (data['success'] === true) {
            data = data['data'];
        } else {
            res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: '' });
        }
        // let data = req.body
        const email = data.email;
        const password = data.password;

        //checking whether user exist or not
        await userModel.findOne({ email: email }).then(async(userData) => {
            if (userData) {
                let password_hash = sha256(password);
                if (userData.password == password_hash) {
                    const Obj = {
                        id : userData._id,
                        email : userData.email,
                        name : userData.name,
                        time : Math.floor(Date.now() / 1000)
                    }
                    const token = await JWT.generateToken(Obj, userData._id)
                    if(token !== false){
                        res.status(200).send({ success: true, msg: "Logged in successfully", data: {userId: userData._id, jwtToken: token}, errors: '' });
                    }
                } else {
                    res.status(202).send({ success: false, msg: "Invalid Password", data: '', errors: '' });
                }
            } else {
                res.status(203).send({ success: false, msg: "You don't have an account with us! Please Register", data: '', errors: '' });
            }

        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error", data: {}, errors: err });
    }

}

exports.forgetPassword = async(req, res) => {
    try {
        let data = Validator.checkValidation(req.body);
        if (data['success'] === true) {
            data = data['data'];
        } else {
            return res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: '' });
        }
            
        if(!Validator.varCharVerification(data.key)){
            return res.status(203).send({ success: false, msg: "Invalid or expired Link", data: {}, errors: "" });
        }else if(!Validator.passWordVerification(data.password)){
            return res.status(203).send({ success: false, msg: "Please enter valid password", data: {}, errors: '' });
        }else if(!Validator.passWordVerification(data.rePassword)){
            return res.status(203).send({ success: false, msg: "Confirm password is required", data: {}, errors: "" });
        }else if(!Validator.varCharVerification(data.token)){
            return res.status(203).send({ success: false, msg: "Invalid or expired link", data: {}, errors: "" });
        }else{
            let txKey = data.key;
            let txToken = data.token;      
            let password = data.password;
            let re_password = data.rePassword;
            let key = Crypto.aesDecrypt(txKey);	
            let token = Crypto.aesDecrypt(txToken);
            
            const userCount = await userModel.find({ otpTxId : key, otp: Number(token)}).countDocuments();
            if(userCount == 1){
                //Checking whether email is verified for OTP        
                if (password == re_password) {
                    let password_hash = sha256(password);
                    //checking whether user exist or not                  
                    await userModel.findOneAndUpdate({otpTxId : key }, { password: password_hash, otp:'', otpTxId:'' }).then(async(checkUser) => {
                        if (checkUser != null) {
                            return res.status(200).send({ success: true, msg: "Password changed successfully", data: '', errors: '' });
                        } else {
                            return res.status(203).send({ success: false, msg: "User not found", data: '', errors: '' });
                        }
                    });
                } else {
                    return res.status(203).send({ success: false, msg: "Password and Confirm Password doesn't match", data: {}, errors: '' });
                } 
            }else{
                return res.status(203).send({ success: false, msg: "Invalid or expired Link", data: '', errors: '' });
            }
        }
        
    } catch (err) {
        console.error(err);
        return res.status(500).send({ success: false, msg: "Error", data: {}, errors: err });
    }

}

exports.forgetPasswordLinkVerification = async (req,res) => {
    try{
        let data = Validator.checkValidation(req.query);
        if (data['success'] === true) {
            data = data['data'];
        } else {
            return res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: '' });
        }
        
        if(!Validator.varCharVerification(data.token) || !Validator.varCharVerification(data.key)){
            return res.status(203).send({ success: false, msg: "Invalid or expired Link", data: {}, errors: "" });
        }else{
            let key = Crypto.aesDecrypt(data.key);	
            let token = Crypto.aesDecrypt(data.token);
            if(isNaN(token) === false){
                const found = await userModel.find({otp:Number(token), otpTxId:key}).countDocuments();
                if(found == 1){              
                    return res.status(200).send({ success: true, msg: "Your email is successfully verified", data: {}, errors:"" });               
                }else{
                    return res.status(203).send({ success: false, msg: "Invalid or expired Link", data: {}, errors: "" });
                }
            }else{
                return res.status(203).send({ success: false, msg: "Invalid or expired Link", data: {}, errors: "" });
            }   
        }
    }catch(err){
        console.error(err)   
        return res.status(500).send({ success: false, msg: "Error while processing your request", data: {}, errors: '' })
    }
}

exports.verifyRegistrationLink = async(req, res) => {
    try{
        let data = Validator.checkValidation(req.body);
        if (data['success'] === true) {
            data = data['data'];
        } else {
            return res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: '' });
        }
        
        if(!Validator.varCharVerification(data.token) || !Validator.varCharVerification(data.key)){
            return res.status(203).send({ success: false, msg: "Invalid or expired Link", data: {}, errors: "" });
        }else{
            let key = Crypto.aesDecrypt(data.key);	
            let token = Crypto.aesDecrypt(data.token);
            
            if(isNaN(token) === false){
                const found = await userModel.find({otp:Number(token), otpTxId:key}).countDocuments();
                if(found == 1){
                    const updateUser = await userModel.findOneAndUpdate({otp:Number(token), otpTxId:key},{isEmailVerified:true, otp:"", otpTxId:""});
                    if(updateUser){
                        return res.status(200).send({ success: true, msg: "Email is verified", data: {}, errors:"" });
                    }else{
                        return res.status(203).send({ success: false, msg: "Email is verification failed ! please try again later", data: {}, errors: "" });
                    }
                }else{
                    return res.status(203).send({ success: false, msg: "Invalid or expired Link 1", data: {}, errors: "" });
                }
            }else{
                return res.status(203).send({ success: false, msg: "Invalid or expired Link 2", data: {}, errors: "" });
            }
            
        }

    }catch(err){
        console.error(err);
        return res.status(203).send({ success: false, msg: "Error while processing your request",  errors: '' });
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
                    let tx_id = 'RG'+emailName+""+Math.floor(Date.now() / 1000);
                    let otp = Math.floor(Math.random() * 8999) + 1000;
                    await userModel.findOneAndUpdate({_id: ObjectId(`${req.user.id}`)}, {otp: otp, otpTxId: tx_id});
                    let key = Crypto.aesEncrypt(tx_id);	
                    let token = Crypto.aesEncrypt(`${otp}`);
                    const link =  `${process.env.EMAIL_LINK}/verification?token=${token}&key=${key}`
                    let htmlContent = "<p>Hi "+emailName+",</p><p>Verify your email to finish signing up with Codebird NFT Marketplace. Use the following verification link.</p>";
                            htmlContent = htmlContent + "<a href="+ link +" target='_blank'>" + link + "</a></h1><p>Please click on link above to verify your email</p><p>Team Codebird</p>";
                        const sendMail = await emailSender.send_mails(req.user.email, "Verify email",htmlContent)
                    if(sendMail){
                        return res.status(200).send({ success: true, msg: "A fresh verification link has been sent to your email address.", data: '', errors: '' });
                    }else{
                        return res.status(203).send({ success: false, msg: "Error while sending mail please try again later", data: '', errors: '' });
                    }
                }else{
                    return res.status(203).send({ success: false, msg: "Either your email is already verified or you are an old user", data: '', errors: '' });
                }
            }else{
                return res.status(203).send({ success: false, msg: "Email is Already verified", data: '', errors: '' });
            }
        }else{
            return res.status(203).send({ success: false, msg: "User not found", data: '', errors: '' });
        }
    }catch(err){
        console.error(err);
        return res.status(203).send({ success: false, msg: "Error while processing your request",  errors: '' });
    }
        
}

exports.updateProfile = async(req, res) => {
    try {
            // Validating data
            let data = Validator.updateProfileValidation(req.body);
            if (data['success'] == true) {
                data = data['data'];
            } else {
                return res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: '' });
            }
            let name = null; let password = null; let rePassword = null; let email = null; let phoneNo= null; let whatsappNo = null; let countryCode = null;
            let userId = req.user.id;

            //checking data which is entered by user to update 
            if (data.name !== undefined) {
                name = data.name;
            }
            if (data.password !== undefined) {
                password = data.password;
            }
            if (data.rePassword !== undefined) {
                rePassword = data.rePassword;
            }
            if (password !== rePassword) {
                return res.status(500).send({ success: false, msg: "Passwords don't match", data: {}, errors: '' });
            }
            if (password === rePassword && password !== null && password !== undefined && password !== '' && rePassword !== null && rePassword !== undefined && rePassword !== '') {
                password = sha256(password);
            }
            if (data.email !== undefined) {
                email = data.email;
            }
            if (data.phoneNo !== undefined) {
                phoneNo = data.phoneNo;
            }
            if (data.whatsappNo !== undefined) {
                whatsappNo = data.whatsappNo;
            }
            if (data.countryCode !== undefined) {
                countryCode = data.countryCode;
            }

            await userModel.findOne({ _id: userId }).then(async(userData) => {
                if (userData) {

                    if (name === null) {
                        name = userData.name;
                    }
                    if (password === null) {
                        password = userData.password;
                    }
                    if (email === null) {
                        email = userData.email;
                    }
                    if (phoneNo === null) {
                        phoneNo = userData.phoneNo;
                    }
                    if (whatsappNo === null) {
                        whatsappNo = userData.whatsappNo;
                    }
                    if (countryCode === null) {
                        countryCode = userData.countryCode;
                    }
                    let updateTime = new Date()
                    await userModel.findOneAndUpdate({ _id: userId }, { $set: { name: name, password: password, email: email, phoneNo: phoneNo, whatsappNo: whatsappNo, countryCode: countryCode, updatedAt: updateTime } }, { upsert: false }).then((updatedRecord) => {
                        if (updatedRecord) {
                            return res.status(200).send({ success: true, msg: "Profile updated successfully", data: {}, errors: '' });
                        } else {
                            return res.status(205).send({ success: false, msg: "ERROR", data: {}, errors: err });
                        }
                    })
                } else {
                    return res.status(206).send({ success: false, msg: "User not found", data: {}, errors: err });
                }
            });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error", data: {}, errors: err });
    }
}

exports.logout = async(req, res) => {
    try {
        await jwtModel.deleteMany({ userId: req.user.id }); 
        return     res.status(200).send({ success: true, msg: "Sucessfully logged out", data: {}, errors: '' });
    } catch (error) {
        res.status(500).send({ success: false, msg: "Error", data: {}, errors: error });
    }
}

exports.getUserData = async (req, res) => {
    try {
        const userData = await userModel.findOne({_id: ObjectId(`${req.user.id}`)});
        if(userData){
            res.status(200).send({ success: true, msg: "Data fetched successfully", data: userData});
        }else{
            res.status(203).send({ success: false, msg: "There was some error in fetching data", data: {}, errors: error });
        }
    } catch (error) {
        res.status(500).send({ success: false, msg: "Error", data: {}, errors: error });
    }
}