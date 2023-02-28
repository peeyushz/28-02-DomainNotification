const jwt = require('jsonwebtoken');
const jwtModel = require('../../models/jwtModel');

exports.verifyToken = async (req, res, next) => {
    try {
        if ('token' in req.headers) {
            const access_token = req.headers['token'];
            if (access_token == null) {
                return res.status(203).send({ success: false, msg: 'Unauthorized', data: '', errors: '' });
            } else {
                try {
                    jwt.verify(access_token, process.env.JWT_SECRET_KEY, async (err, user) => {
                        if (err) {
                            console.log(err)
                            return res.status(203).send({ success: false, msg: 'Your session has been expired!  again', data: '', errors: err });
                        } else {
                            const userId = user.userData.id
                            const checkingLogs = await jwtModel.find({ userId: userId, token: access_token }).countDocuments();
                            if (checkingLogs == 1) {
                                req.user = user.userData
                                next();
                            } else {
                                return res.status(203).send({ success: false, msg: 'Your session has been expired! please login again', data: '', errors: "" });
                            }
                        }
                    });
                } catch (err) {
                    return res.status(203).send({ success: false, msg: 'Your session has been expired! please login again', data: '', errors: "" });
                }
            }
        } else {
            return res.status(203).send({ success: false, msg: 'Your session has been expired! please login again', data: '', errors: "" });
        }
    } catch (err) {
        res.status(203).send({ success: false, msg: 'Error', data: '', errors: err });
    }
}

exports.generateToken = async (obj, userId) => {
    return new Promise(async(resolve, reject)=>{
        const token = jwt.sign({userData : obj}, process.env.JWT_SECRET_KEY, { expiresIn: '30h' });
        const deleteJwt =  await jwtModel.deleteMany({userId: userId});
        const newData = jwtModel({
            userId: userId,
            token:token
        })
        newData.save(newData).then((tokenSaved)=>{
            if(tokenSaved){
                resolve(token)
            }else{
                resolve(false)
            }
            
        })
    })
}

exports.verifyReqToken = async(req,res)=>{
    try {
        if('token' in req.headers){
            const access_token = req.headers['token'];
            if (access_token == null || access_token == undefined){
                return res.status(203).send({ success: false, msg: 'Unauthorized', data: '', errors: '' });
            }else{
                try {
                    jwt.verify(access_token, process.env.JWT_SECRET_KEY, async (err, user) => {
                        if (err){
                            return res.status(203).send({ success: false, msg: 'Your session has been expired! please login again', data: '', errors: err});
                        }else{
                            const userId = user.userData.id
                            const userData = user.userData
                            const checkingLogs = await jwtModel.find({userId:userId, token:access_token}).countDocuments();
                            if(checkingLogs == 1){
                                return res.status(200).send({ success: true, msg: 'Verified', data: userData, errors: ""});
                            }else{
                                return res.status(203).send({ success: false, msg: 'Your session has been expired! please login again', data: '', errors: ""});
                            }
                        }
                    });
                } catch (err) {
                    return res.status(203).send({ success: false, msg: 'Your session has been expired! please login again', data: '', errors: ""});
                }
            }
        }else{
            return res.status(203).send({ success: false, msg: 'Your session has been expired! please login again', data: '', errors: ""});
        }
    } catch (err) {
        return res.status(203).send({ success: false, msg: 'Your session has been expired! please login again', data: '', errors: ""});
    }
}