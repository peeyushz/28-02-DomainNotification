"use strict";
const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    isEmailVerified:{
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    phoneNo: {
        type: Number,
        required: true
    },
    whatsappNo: {
        type: Number,
        required: true
    },
    countryCode: {
        type: String,
        required: true
    },
    otp : {
        type: Number,
    },
    otpTxId : {
        type: String,
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    updatedAt: {
        type: Date,
        default: new Date()
    }
})

const userModel = mongoose.model('user', schema);

module.exports = userModel;