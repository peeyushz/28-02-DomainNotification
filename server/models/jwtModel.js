"use strict";
const mongoose = require('mongoose');

var schema = new mongoose.Schema({

    userId: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
    }
})

const jwtModel = mongoose.model('jwt', schema);

module.exports = jwtModel;