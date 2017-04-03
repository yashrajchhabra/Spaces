/**
 * Created by yashrajchhabra on 30/03/17.
 */
const controllers = require('./controllers');
const userController = controllers.user;

module.exports = (app) => {

    app.get('/', (req, res) => {
        res.render('index.html');
    });

    app.get('/app/*', (req, res) => {
        res.render('index.html');
    });

    app.get('/auth.html', (req, res) => {
        res.render('./partials/auth.html');
    });

    app.get('/dashboard.html', (req, res) => {
        res.render('./partials/dashboard.html');
    });

    app.get('/form.html', (req, res) => {
        res.render('./partials/form.html');
    });

    app.get('/shareDialog.html', (req, res) => {
        res.render('./partials/shareDialog.html');
    });

    app.get('/spaceDetail.html', (req, res) => {
        res.render('./partials/spaceDetail.html');
    });

    app.post('/auth/login', userController.login);

    app.post('/auth/signup', userController.signup);

};