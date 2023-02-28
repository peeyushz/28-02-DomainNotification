"use strict";
const dotenv = require('dotenv');
const CryptoJS = require("crypto-js");
dotenv.config()

module.exports = {
aesEncrypt: aesEncrypt,
aesDecrypt: aesDecrypt
};

function aesEncrypt(content) {
    var b64 = CryptoJS.AES.encrypt(content, process.env.CRYPTO_SECRET_KEY).toString();
    var e64 = CryptoJS.enc.Base64.parse(b64);
    var eHex = e64.toString(CryptoJS.enc.Hex);
    return eHex;
};

function aesDecrypt(word) {
    var reb64 = CryptoJS.enc.Hex.parse(word);
   var bytes = reb64.toString(CryptoJS.enc.Base64);
   var decrypt = CryptoJS.AES.decrypt(bytes, process.env.CRYPTO_SECRET_KEY);
   var plain = decrypt.toString(CryptoJS.enc.Utf8);
   return plain;
};