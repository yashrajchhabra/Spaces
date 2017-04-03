/**
 * Created by yashrajchhabra on 04/04/17.
 */
const CronJob = require('cron').CronJob;
const controllers = require('./controllers');
const spaceController = controllers.space;

module.exports = () => {
    let job = new CronJob({
        cronTime: '00 30 9 * * 1-6',
        onTick: () => {
            spaceController.sendReminderMails();
        },
        start: true
    });
    job.start();
};