/**
 * Created by yashrajchhabra on 25/02/17.
 */
const config = require('../config/config');
const utils = require('../utils');

module.exports = (req, res, next) => {
    // check header or url parameters or post parameters for token
    let token = req.body.token || req.query.token || req.headers['authorization'];
    // decode token
    if (token) {
        token = token.split(' ')[1];
        // verifies secret and checks exp
        utils.verifyToken(token, function (err, decoded) {
            if (err) {
                return res.json({success: false, message: 'Failed to authenticate token.'});
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
};