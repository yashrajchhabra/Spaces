/**
 * Created by yashrajchhabra on 01/04/17.
 */
const Space = require('../models').Space;
const fs = require('fs');
const mailer = require('../modules/mailer');
const utils = require('../utils');
const async = require('async');

module.exports = {
    create(req, res) {
        let postData = req.body;
        postData.userId = req.decoded.id;
        postData.status = 'active';
        postData.shareId = utils.guid();
        return Space
            .create(req.body)
            .then(space => res.status(201).send(space))
            .catch(error => res.status(400).send(error));
    },
    get(req, res) {
        let status = req.query.status;
        return Space
            .findAll({
                where: {
                    userId: req.decoded.id,
                    status: status
                }
            })
            .then(space => res.status(200).send(space))
            .catch(error => res.status(400).send(error));
    },
    update(req, res) {
        let postData = req.body;
        return Space
            .findById(postData.id)
            .then(space => {
                if (!space) {
                    return res.status(404).send({
                        message: 'Space Not Found',
                    });
                }
                if (postData.type === 'archive') {
                    return space
                        .update({status: 'archive'})
                        .then(() => res.status(200).send(space))  // Send back the updated space.
                        .catch((error) => {
                            res.status(400).send(error)
                        });
                } else if (postData.type === 'field') {
                    return space
                        .update({fields: postData.fields})
                        .then(() => res.status(200).send(space))  // Send back the updated space.
                        .catch((error) => res.status(400).send(error));
                }
            })
            .catch((error) => res.status(400).send(error));
    },
    uploadFile(req, res) {
        let postData = req.body;
        let upload = function () {
            let PATH = __dirname + '/../../public/files';
            let file = req.files.file;
            fs.readFile(file.path, (err, fileData) => {
                if (err) {
                    res.json(err);
                    return;
                }
                let filePath = PATH + '/' + file.name;
                fs.exists(PATH, (exists) => {
                    if (!exists) {
                        fs.mkdir(PATH, (error) => {
                            if (!error) {
                                fs.writeFile(filePath, fileData, (err) => {
                                    if (err) {
                                        res.json(err);
                                    } else {
                                        res.json({message: 'success'});
                                    }
                                })
                            } else {
                                res.json(err);
                            }
                        });
                    } else {
                        fs.writeFile(filePath, fileData, (err) => {
                            if (err) {
                                res.json(err);
                            } else {
                                res.json({message: 'success'});
                            }
                        })
                    }
                });
            });
        };
        return Space
            .findById(postData.id)
            .then(space => {
                if (!space) {
                    return res.status(404).send({
                        message: 'Space Not Found',
                    });
                }
                if (space.status === 'active') {
                    upload();
                } else {
                    return res.status(200).send({
                        message: 'Space archived',
                    });
                }
            })
            .catch((error) => res.status(400).send(error));
    },
    getFormData(req, res) {
        let query = req.query;
        return Space
            .findAll({
                where: {
                    shareId: query.shareId
                }
            })
            .then(space => res.status(200).send(space))
            .catch(error => res.status(400).send(error));
    },
    shareLink(req, res) {
        let postData = req.body;
        let sendShareMail = (space) => {
            let shareLink = '/app/form/' + space.shareId;
            let payload = {
                to: postData.email,
                subject: 'Space shared with you',
                body: 'Hi User, \n Link to space shared ' + shareLink + '\n \n Thanks'
            };
            mailer.sendMail(payload, function () {

            });
        };
        return Space
            .findById(postData.id)
            .then(space => {
                if (!space) {
                    return res.status(404).send({
                        message: 'Space Not Found',
                    });
                }
                if (space.userId !== req.decoded.id) {
                    return res.status(403).send({
                        message: 'Access denied',
                    });
                }
                let sharedWith = [];
                if (space.sharedWith) {
                    sharedWith = space.sharedWith;
                    if (space.sharedWith.indexOf(postData.email) > -1) {
                        sendShareMail(space);
                        return res.status(200).send(space);
                    }
                }
                sharedWith.push(postData.email);
                return space
                    .update({sharedWith: sharedWith})
                    .then(() => {
                        res.status(200).send(space);
                        sendShareMail(space);
                    })  // Send back the updated space.
                    .catch((error) => {
                        res.status(400).send(error)
                    });
            })
            .catch((error) => res.status(400).send(error));
    },
    downloadFieldData(req, res) {
        let postData = req.body;
        console.log(postData);
        let sendFile = (space) => {
            res.set('Content-disposition', 'attachment; filename=' + space.title + '.json');
            res.set('Content-Type', 'application/json');
            res.send(space.fields);
        };
        return Space
            .findById(postData.id)
            .then(space => {
                if (!space) {
                    return res.status(404).send({
                        message: 'Space Not Found',
                    });
                }
                if (space.userId !== req.decoded.id) {
                    return res.status(403).send({
                        message: 'Access denied',
                    });
                }
                sendFile(space);
            }).catch((error) => {
                console.log(error);
                res.status(400).send(error)
            });
    },
    sendReminderMails() {
        let lt = new Date();
        let gt = new Date();
        lt.setDate(lt.getDate() + 1);
        gt.setDate(gt.getDate() + 1);
        utils.setTimeMidnight(lt);
        utils.setTimeMidnight(gt);
        lt.setHours(24);
        Space.findAll({
            where: {
                deadline: {
                    $gte: gt,
                    $lte: lt
                },
                status: 'active'
            },
            raw: true
        }).then(spaces => {
            async.forEachSeries(spaces, function (space, cb) {
                if (space && space.hasOwnProperty('sharedWith') && space.sharedWith) {
                    let shareLink = '/app/form/' + space.shareId;
                    for (let id of space.sharedWith) {
                        let payload = {
                            to: id,
                            subject: 'Deadline to submit space tomorrow',
                            body: 'Hi user, \n Please submit your space by tomorrow. ' + shareLink
                        };
                        mailer.sendMail(payload, function (err, info) {
                        });
                    }
                }
                cb();
            }, function () {

            });
        });
    }
};
