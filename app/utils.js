/**
 * Created by yashrajchhabra on 04/04/17.
 */
const jwt = require('jsonwebtoken');

const APP_SECRET = 'dd8as7d7a8d7as8d78as';

module.exports = {
    guid: () => {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    },
    signToken: (user, callback) => {
        callback(jwt.sign({id: user.id, role: 'user'}, APP_SECRET));
    },
    verifyToken: (token, callback) => {
        jwt.verify(token, APP_SECRET, (err, decoded) => {
            callback(err, decoded)
        });
    },
    setTimeMidnight: (date) => {
        date.setHours(0);
        date.setMilliseconds(0);
        date.setMinutes(0);
        date.setSeconds(0);
    }
};