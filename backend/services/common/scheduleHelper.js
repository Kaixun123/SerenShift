const moment = require('moment'); // Ensure moment.js is installed

async function splitScheduleByDate(startDate, endDate) {
    let start = moment(startDate);  // Start date and time
    let end = moment(endDate);      // End date and time
    let blocks = [];

    // Define the time blocks for AM, PM, and full-day
    const AM_START_TIME = "09:00:00";
    const AM_END_TIME = "13:00:00";
    const PM_START_TIME = "14:00:00";
    const PM_END_TIME = "18:00:00";

    // Loop through each day between start and end
    while (start.isSameOrBefore(end, 'day')) {
        let currentDayStart = moment(start.format('YYYY-MM-DD') + " 09:00", 'YYYY-MM-DD HH:mm');
        let currentDayEnd = moment(start.format('YYYY-MM-DD') + " 18:00", 'YYYY-MM-DD HH:mm');

        // Get the formatted start and end times for the current day
        const startTime = start.format('HH:mm:ss');
        const endTime = end.format('HH:mm:ss');

        // Label as Partial Day if the start time is not exactly 09:00 or 14:00 and the end time is not exactly 13:00 or 18:00
        if ((startTime !== AM_START_TIME && startTime !== PM_START_TIME) || (endTime !== AM_END_TIME && endTime !== PM_END_TIME)) {
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'Partial Day',
                start_time: startTime,
                end_time: endTime
            });
            break; // Since start and end are on the same day, we are done
        }

        // If the start and end are on the same day and match business hours
        if (start.isSame(end, 'day')) {
            if (startTime === AM_START_TIME && endTime === AM_END_TIME) {
                blocks.push({
                    date: start.format('YYYY-MM-DD'),
                    period: 'AM',
                    start_time: AM_START_TIME,
                    end_time: AM_END_TIME
                });
            } else if (startTime === PM_START_TIME && endTime === PM_END_TIME) {
                blocks.push({
                    date: start.format('YYYY-MM-DD'),
                    period: 'PM',
                    start_time: PM_START_TIME,
                    end_time: PM_END_TIME
                });
            } else {
                blocks.push({
                    date: start.format('YYYY-MM-DD'),
                    period: 'Full Day',
                    start_time: AM_START_TIME,
                    end_time: PM_END_TIME
                });
            }
            break; // Since start and end are on the same day, we are done
        }

        else {
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'Full Day',
                start_time: AM_START_TIME,
                end_time: PM_END_TIME
            });
        }
        // Move to the next day
        start = start.add(1, 'day');
    }

    return blocks;
}

function scheduleHasNotPassedCurrentDay(date) {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateOnly <= today;
}

module.exports = {
    splitScheduleByDate,
    scheduleHasNotPassedCurrentDay,
};
