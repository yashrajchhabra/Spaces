/**
 * Created by yashrajchhabra on 25/01/17.
 */
const authentication = require('../api/authentication');
const controllers = require('../controllers');
const multipartyMiddleware = require('connect-multiparty')();
const spaceController = controllers.space;

module.exports = (router) => {

    router.route('/space')
        .post(authentication, spaceController.create)
        .get(authentication, spaceController.get)
        .put(spaceController.update);

    router.route('/space/file-upload')
        .post(multipartyMiddleware, spaceController.uploadFile);

    router.route('/space/form-date')
        .get(spaceController.getFormData);

    router.route('/space/share')
        .post(authentication, spaceController.shareLink);

    router.route('/space/download')
        .post(authentication, spaceController.downloadFieldData);
};