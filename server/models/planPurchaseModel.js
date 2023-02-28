"use strict";
const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },
    planId: {
        type: String,
        required: true,
    },
    typeOfAlerts: {
        type: Array,
        required: true
    },
    planExpiryTime: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    startTime: {
        type: Number,
        required: true
    }
})

const planPurchaseModel = mongoose.model('planPurchase', schema);

module.exports = planPurchaseModel;