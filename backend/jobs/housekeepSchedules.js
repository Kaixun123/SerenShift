const scheduler = require('node-schedule');
const { Application, Schedule } = require('../models');
const { sequelize } = require('../services/database/mysql');
const { Op } = require('sequelize');

const job = scheduler.scheduleJob('30 * * * *', async () => {
    const currentDate = new Date();
    console.info('Housekeep Schedules Job started at ' + currentDate);
    const transaction = await sequelize.transaction();
    try {
        let deletedCount = 0;
        let futureSchedules = await Schedule.findAll({
            where: {
                start_date: {
                    [Op.gt]: currentDate,
                },
            },
        });
        for (let currentSchedule of futureSchedules) {
            let matchingApplication = await Application.findOne({
                where: {
                    start_date: currentSchedule.start_date,
                    end_date: currentSchedule.end_date,
                    created_by: currentSchedule.created_by,
                    verify_by: currentSchedule.verify_by,
                }
            });
            if (!matchingApplication) {
                console.info('Deleting schedule' + currentSchedule.schedule_id + 'with no matching application');
                await currentSchedule.destroy({ transaction });
                deletedCount++;
            }
        }
        await transaction.commit();
        console.info('Housekeep Schedules Job completed. Deleted ' + deletedCount + ' schedules');
    } catch (error) {
        await transaction.rollback();
        console.error('Housekeep Schedules Job failed');
        console.error(error);
    } finally {
        console.info('Housekeep Schedules Job ended at ' + new Date());
    }
});

module.exports = job;