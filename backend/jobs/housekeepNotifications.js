const scheduler = require('node-schedule');
const { Notification } = require('../models');
const { sequelize } = require('../services/database/mysql');
const { Op } = require('sequelize');

const job = scheduler.scheduleJob('0 * * * *', async () => {
    const currentDate = new Date();
    console.info('Housekeep Notifications Job started at ' + currentDate);
    const transaction = await sequelize.transaction();
    try {
        let count = 0;
        let readNotifications = await Notification.findAll({
            where: {
                read_status: true,
                createdAt: {
                    [Op.lt]: currentDate.setFullYear(currentDate.getFullYear() - 1),
                },
                paranoid: false,
            },
        });
        for (let i = 0; i < readNotifications.length; i++) {
            readNotifications[i].destroy({ force: true, transaction });
            count++;
        }
        await transaction.commit();
        console.info('Housekeep Notifications Job deleted ' + count + ' read notifications older than 1 year');

    } catch (error) {
        await transaction.rollback();
        console.error('Housekeep Notifications Job failed');
        console.error(error);
    } finally {
        console.info('Housekeep Notifications Job ended at ' + new Date());
    }
});

module.exports = job;