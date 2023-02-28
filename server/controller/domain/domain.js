const domainModel = require("../../models/domainModel");
const Validator = require("../../helpers/validators");
const keccakHelper = require("keccak");
const axios = require("axios");
const mongoose = require("mongoose");
const Web3 = require("web3");
const web3 = new Web3(Web3.givenProvider || "https://eth.llamarpc.com");
const planPurchaseModel = require("../../models/planPurchaseModel");
var dotenv = require("dotenv");
const userModel = require("../../models/userModel");
const planModel = require("../../models/planModel");
const ObjectId = mongoose.Types.ObjectId;
dotenv.config();

const contract_address = process.env.ENS_CONTRACT_MAINNET;
const contract_abi = [
    {
        inputs: [
            { internalType: "contract ENS", name: "_ens", type: "address" },
            { internalType: "bytes32", name: "_baseNode", type: "bytes32" },
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "approved", type: "address" },
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "Approval",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "operator", type: "address" },
            { indexed: false, internalType: "bool", name: "approved", type: "bool" },
        ],
        name: "ApprovalForAll",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: "address", name: "controller", type: "address" }],
        name: "ControllerAdded",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: "address", name: "controller", type: "address" }],
        name: "ControllerRemoved",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "expires", type: "uint256" },
        ],
        name: "NameMigrated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "expires", type: "uint256" },
        ],
        name: "NameRegistered",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "expires", type: "uint256" },
        ],
        name: "NameRenewed",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        constant: true,
        inputs: [],
        name: "GRACE_PERIOD",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [{ internalType: "address", name: "controller", type: "address" }],
        name: "addController",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "approve",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: true,
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "available",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "baseNode",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "controllers",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "ens",
        outputs: [{ internalType: "contract ENS", name: "", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "getApproved",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "operator", type: "address" },
        ],
        name: "isApprovedForAll",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "isOwner",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "nameExpires",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "ownerOf",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "address", name: "owner", type: "address" },
        ],
        name: "reclaim",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "uint256", name: "duration", type: "uint256" },
        ],
        name: "register",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "uint256", name: "duration", type: "uint256" },
        ],
        name: "registerOnly",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [{ internalType: "address", name: "controller", type: "address" }],
        name: "removeController",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "uint256", name: "duration", type: "uint256" },
        ],
        name: "renew",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    { constant: false, inputs: [], name: "renounceOwnership", outputs: [], payable: false, stateMutability: "nonpayable", type: "function" },
    {
        constant: false,
        inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "safeTransferFrom",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "tokenId", type: "uint256" },
            { internalType: "bytes", name: "_data", type: "bytes" },
        ],
        name: "safeTransferFrom",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "bool", name: "approved", type: "bool" },
        ],
        name: "setApprovalForAll",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [{ internalType: "address", name: "resolver", type: "address" }],
        name: "setResolver",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: true,
        inputs: [{ internalType: "bytes4", name: "interfaceID", type: "bytes4" }],
        name: "supportsInterface",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
        name: "transferOwnership",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
];

exports.ensContract = new web3.eth.Contract(contract_abi, contract_address);

exports.fetchDomainData = async (req, res) => {
    try {
        let data = Validator.checkValidation(req.query);
        if (data["success"] === true) {
            data = data["data"];
        } else {
            res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: "" });
        }
        if (data) {
            const domainData = await domainModel.findOne({ _id: ObjectId(data.domainId) });
            if (domainData !== null) {
                res.status(200).send({ success: true, msg: "Sucessfully fetched data", data: domainData, errors: "" });
            }
        } else {
            return res.status(203).send({ success: false, msg: "Something went wrong ! Please try again later", data: "", errors: "" });
        }
    } catch (error) {
        res.status(500).send({ success: false, msg: "Error", data: {}, errors: error });
    }
};

exports.deleteDomainData = async (req, res) => {
    try {
        let data = Validator.checkValidation(req.query);
        if (data["success"] === true) {
            data = data["data"];
        } else {
            res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: "" });
        }
        if (data) {
            await domainModel.deleteMany({ _id: ObjectId(data.domainId) });
            res.status(200).send({ success: true, msg: "Sucessfully deleted data", data: {}, errors: "" });
        } else {
            return res.status(203).send({ success: false, msg: "Something went wrong ! Please try again later", data: "", errors: "" });
        }
    } catch (error) {
        res.status(500).send({ success: false, msg: "Error", data: {}, errors: error });
    }
};

exports.getDomainData = async (req, res) => {
    try {
        const domainData = await domainModel.find({ userId: req.user.id });
        if (domainData !== null) {
            res.status(200).send({ success: true, msg: "Data fetched successfully", data: domainData });
        } else {
            res.status(203).send({ success: false, msg: "There was some error in fetching data", data: {}, errors: error });
        }
    } catch (error) {
        res.status(500).send({ success: false, msg: "Error", data: {}, errors: error });
    }
};

exports.saveDomainData = async (req, res) => {
    const domainExists = await domainModel.find({ domain: req.body.domain }).countDocuments();
    const userData = await userModel.findOne({ _id: ObjectId(req.user.id) });
    const purchaseDetails = await planPurchaseModel.findOne({ userId: ObjectId(userData._id), isActive: true });
    if (purchaseDetails) {
        const planDetails = await planModel.findOne({ _id: ObjectId(purchaseDetails.planId) });
        const purchasedDomains = await domainModel.find({ userId: ObjectId(req.user.id) }).countDocuments();
        if (planDetails && planDetails.domainLimit >= purchasedDomains) {
            if (domainExists === 0) {
                const receivedData = req.body;
                if (receivedData.domain.includes("/") || receivedData.domain.includes(":")) {
                    res.status(206).send({ success: false, msg: "Invalid ENS Domain", data: "", errors: "" });
                } else {
                    if (userData && purchaseDetails) {
                        var labelHash = keccakHelper("keccak256").update(receivedData.domain.split(".")[0]).digest("hex");
                        labelHash = "0x" + labelHash;
                        const address = await this.ensContract.methods.ownerOf(labelHash).call();
                        const expiryDate = await this.ensContract.methods.nameExpires(labelHash).call();
                        if (address && expiryDate) {
                            const newDomainData = new domainModel({
                                userId: userData._id,
                                planId: purchaseDetails._id,
                                domain: receivedData.domain,
                                address: address.toString(),
                                isExpired: false,
                                expiryDate: expiryDate.toString(),
                                alertTime: receivedData.alertTime,
                                alerts: receivedData.alerts,
                                areNotificationsEnabled: true,
                                labelHash: labelHash,
                            });
                            newDomainData
                                .save(newDomainData)
                                .then((data) => {
                                    res.status(200).send({ success: true, msg: "Data saved sucessfully", data: "", errors: "" });
                                })
                                .catch((err) => {
                                    res.status(206).send({ success: false, msg: "There was an error in saving your data", data: "", errors: "" });
                                });
                        }
                    }
                }
            } else {
                res.status(206).send({ success: false, msg: "Domain already exists", data: "", errors: "" });
            }
        } else {
            res.status(206).send({ success: false, msg: "Your domain limit is reached, kindly upgrade your plan", data: "", errors: "" });
        }
    } else {
        res.status(206).send({ success: false, msg: "Please subscribe to a plan", data: "", errors: "" });
    }
};

exports.updateDomainData = async (req, res) => {
    try {
        let data = Validator.checkValidation(req.body);
        if (data["success"] === true) {
            data = data["data"];
        } else {
            res.status(201).send({ success: false, msg: "Missing field", data: {}, errors: "" });
        }
        if ((await planPurchaseModel.find({ userId: req.user.id, isActive: true }).countDocuments()) > 0) {
            let areNotificationsEnabled = null;
            let alertTime = null;
            let alerts = null;
            let domainId = data.domainId;
            if (data.areNotificationsEnabled !== undefined) {
                areNotificationsEnabled = data.areNotificationsEnabled;
            }
            if (data.alertTime !== undefined) {
                alertTime = data.alertTime;
            }
            if (data.alerts !== undefined) {
                alerts = data.alerts;
            }
            await domainModel.findOne({ _id: domainId }).then(async (domainData) => {
                if (domainData) {
                    if (areNotificationsEnabled === null) {
                        areNotificationsEnabled = domainData.areNotificationsEnabled;
                    }
                    if (alertTime === null) {
                        alertTime = domainData.alertTime;
                    }
                    if (alerts === null) {
                        alerts = domainData.alerts;
                    }
                    let updateTime = new Date();
                    await domainModel
                        .findOneAndUpdate(
                            { _id: domainId },
                            {
                                $set: {
                                    areNotificationsEnabled: areNotificationsEnabled,
                                    alertTime: alertTime,
                                    alerts: alerts,
                                    updatedAt: updateTime,
                                },
                            },
                            { upsert: false }
                        )
                        .then((updatedRecord) => {
                            if (updatedRecord) {
                                return res.status(200).send({ success: true, msg: "Domain details updated successfully", data: {}, errors: "" });
                            } else {
                                return res.status(205).send({ success: false, msg: "ERROR", data: {}, errors: "" });
                            }
                        });
                } else {
                    return res.status(206).send({ success: false, msg: "Domain not found", data: {}, errors: "" });
                }
            });
        } else {
            return res.status(206).send({ success: false, msg: "Please subscribe to a plan", data: {}, errors: "" });
        }
    } catch (error) {
        res.status(500).send({ success: false, msg: error.message, data: {}, errors: error });
    }
};