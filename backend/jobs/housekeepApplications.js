const scheduler = require('node-schedule');
const { Application } = require('../models');
const { sequelize } = require('../services/database/mysql');
const { Op } = require('sequelize');

const job = scheduler.scheduleJob('0 * * * *', async () => {
    const currentDate = new Date();
    console.info('Housekeep Pending Applications Job started at ' + currentDate);
    const transaction = await sequelize.transaction();
    try {
        let count = 0;
        let pendingApplications = await Application.findAll({
            where: {
                status: 'Pending',
                start_date: {
                    [Op.lt]: currentDate,
                },
            },
        });
        for (let i = 0; i < pendingApplications.length; i++) {
            pendingApplications[i].status = 'Rejected';
            await pendingApplications[i].save({ transaction });
            count++;
        }
        await transaction.commit();
        console.info('Housekeep Pending Applications Job rejected ' + count + ' pending applications past their start date');
    } catch (error) {
        await transaction.rollback();
        console.error('Housekeep Applications Job failed');
        console.error(error);
    } finally {
        console.info('Housekeep Pending Applications Job ended at ' + new Date());
    }
});

module.exports = job;