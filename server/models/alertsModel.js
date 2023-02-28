"use strict";
const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    alertId: {
        type: String,
        required: true,
    },
    alertName: {
        type: String,
        required: true
    }
})

const alertModel = mongoose.model('alert', schema);

module.exports = alertModel;