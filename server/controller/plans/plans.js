
const Validator = require("../../helpers/validators");
const planModel = require("../../models/planModel");

exports.getPlansData = async (req, res) => {
    try {
            const plansData = await planModel.find();
            if (plansData !== null) {
                res.status(200).send({ success: true, msg: "Data fetched successfully", data: plansData });
            } else {
                res.status(203).send({ success: false, msg: "There was some error in fetching data", data: {}, errors: error });
            }
    } catch (error) {
        res.status(500).send({ success: false, msg: "Error", data: {}, errors: error });
    }
};