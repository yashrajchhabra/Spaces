/**
 * Created by yashrajchhabra on 03/04/17.
 */
const nodemailer = require('nodemailer');

module.exports = {
    sendMail: (payload, callback) => {
        const HOST = 'smtp.mailtrap.io';
        const PORT = 2525;
        const USER = '01521a2021016c';
        const PASS = 'c4a419bfc2db05';
        const transporter = nodemailer.createTransport(
            {
                host: HOST,
                port: PORT,
                auth: {
                    user: USER,
                    pass: PASS
                }
            }
        );
        let mailOptions = {
            from: '"Spaces " <space@spaces.com>', // sender address
            to: payload.to, // list of receivers
            subject: payload.subject, // Subject line
            text: payload.body
        };
        transporter.sendMail(mailOptions, (error, info) => {
            callback(error, info);
        });
    }
};