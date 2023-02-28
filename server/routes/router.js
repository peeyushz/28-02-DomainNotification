const express = require("express");
const route = express.Router();
const userRoute = require("../controller/user/user")
const jwtRoute = require("../controller/jwt/jwt");
const domainRoute = require("../controller/domain/domain");
const { forgetPasswordVerification } = require("../controller/email/email");
const { getPlansData } = require("../controller/plans/plans");
const utrustRoute = require("../controller/payments/utrust");
const stripeRoute = require("../controller/payments/stripe");

// const storeData = require("../controller/storeData")
// const homeRoute = require('./homeRoute')
// const emailOtp = require('../controller/emailOtpController');

// const fetchData = require("../controller/fetchData");

// route.get("/", );
route.get("/", (req, res)=>{
    res.status(203).send({success:true, msg:"API is Working", data:"", error:""})
});

route.post("/api/register", userRoute.register);
route.post("/api/login", userRoute.login);
route.post("/api/forget-password", userRoute.forgetPassword);
route.get("/api/logout",jwtRoute.verifyToken, userRoute.logout);
route.post("/api/verify-link", userRoute.verifyRegistrationLink);
route.get("/api/forget-password-verify-link", userRoute.forgetPasswordLinkVerification);
route.get("/api/resend-email-verification", jwtRoute.verifyToken, userRoute.resendVerificationLink)
route.post("/api/update-profile", jwtRoute.verifyToken, userRoute.updateProfile);
route.get("/api/forget-password-initiate", forgetPasswordVerification)

route.post("/api/save-domain-data", jwtRoute.verifyToken,domainRoute.saveDomainData);
route.get("/api/get-domain-data", jwtRoute.verifyToken,domainRoute.getDomainData);
route.get("/api/fetch-domain-data", jwtRoute.verifyToken,domainRoute.fetchDomainData);
route.get("/api/delete-domain-data", jwtRoute.verifyToken,domainRoute.deleteDomainData);
route.post("/api/update-domain-data", jwtRoute.verifyToken,domainRoute.updateDomainData);

route.get("/api/verify-jwt", jwtRoute.verifyReqToken);

// route.post("/registerEmailVerify", emailOtp.registerEmailVerification);
// route.post("/forgetPasswordVerify", emailOtp.forgetPasswordVerification);
// route.get("/otpVerify", emailOtp.otpVerify);
// route.get("/tokenVerify", jwtRoute.verifyToken);

route.get("/api/get-user-data",jwtRoute.verifyToken, userRoute.getUserData);


route.get("/api/get-plans-data", getPlansData);


route.post("/api/pay-with-utrust", jwtRoute.verifyToken,utrustRoute.createUtrustPayment);
route.post("/api/utrust-callback", utrustRoute.paymentUpdate);
route.post("/api/pay-with-stripe", jwtRoute.verifyToken, stripeRoute.createCheckOutSessionForStripe);
route.post("/api/stripe-callback", stripeRoute.stripeWebHook);


// route.get("/getDomainData", fetchData.getDomainData);

// route.get("/deleteDomainData", storeData.deleteDomainData);
// route.get("/fetchDomainData", storeData.fetchDomainData);

route.use((req, res, next) => {
    res.status(401).send({ success: false, msg: "Route not found", data: {}, errors: '' });
});

module.exports = route;