"use strict";
const mongoose = require('mongoose');

var schema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
    },
    otp: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: () => { return (new Date()).toLocaleString() }
    }

})

const otpModel = mongoose.model('otps', schema);

module.exports = otpModel;