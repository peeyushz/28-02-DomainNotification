"use strict";
const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    planId: {
        type: String,
        required: true,
    },
    planType: {
        type: String,
        required: true
    },
    domainLimit: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    createdAt: {
        type: String,
        default: new Date()
    }
})

const planModel = mongoose.model('plan', schema);

module.exports = planModel;