/**
 * Created by yashrajchhabra on 01/04/17.
 */
const User = require('../models').User;
const utils = require('../utils');

module.exports = {
    signup(req, res) {
        let email = req.body.email;
        let password = req.body.password;
        let name = req.body.name;
        return User.findAll({
            where: {
                'email': req.body.email
            }
        }).then(user => {
            if (user.length === 0) {
                return User.create({
                    password: password,
                    email: email,
                    name: name
                }).then(newUser => {
                    let userJson = newUser.dataValues;
                    utils.signToken(userJson, (token) => {
                        userJson.token = token;
                        delete userJson.password;
                        return res.json(newUser);
                    });
                }).catch(error => {
                    return res.json(error);
                });
            } else {
                return res.json({message: 'userExists'});
            }
        }).catch(error => {
            return res.json(error);
        });
    },
    login(req, res) {
        let email = req.body.email;
        let password = req.body.password;
        return User.findAll({
            where: {
                'email': email
            }
        }).then(user => {
            if (user.length === 0) {
                return res.json({message: 'noUser'});
            } else {
                let userJson = user[0].dataValues;
                if (userJson.password === password) {
                    utils.signToken(userJson, (token) => {
                        userJson.token = token;
                        delete userJson.password;
                        return res.json(user);
                    });
                } else {
                    return res.json({message: 'wrongPassword'});
                }
            }
        }).catch(error => {
            return res.json(error);
        });
    }
};
