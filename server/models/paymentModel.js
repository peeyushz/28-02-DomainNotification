"use strict";
const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    planId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
    },
    actuallyPaid: {
        type: Number,
    },
    status: {
        type: String,
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: new Date()
    }
})

const paymentModel = mongoose.model('payment', schema);

module.exports = paymentModel;