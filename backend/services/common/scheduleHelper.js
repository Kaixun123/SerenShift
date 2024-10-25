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
    const FULL_DAY_START_TIME = "09:00:00";
    const FULL_DAY_END_TIME = "18:00:00";

    // Loop through each day between start and end
    while (start.isSameOrBefore(end, 'day')) {
        let currentDayStart = moment(start.format('YYYY-MM-DD') + " 09:00", 'YYYY-MM-DD HH:mm');
        let currentDayEnd = moment(start.format('YYYY-MM-DD') + " 18:00", 'YYYY-MM-DD HH:mm');

        // If the start and end are on the same day
        if (start.isSame(end, 'day')) {
            // Check for AM block (09:00 to 13:00)
            if (start.format('HH:mm:ss') === AM_START_TIME && end.format('HH:mm:ss') === AM_END_TIME) {
                blocks.push({
                    date: start.format('YYYY-MM-DD'),
                    period: 'AM',
                    start_time: AM_START_TIME,
                    end_time: AM_END_TIME
                });
            }
            // Check for PM block (14:00 to 18:00)
            else if (start.format('HH:mm:ss') === PM_START_TIME && end.format('HH:mm:ss') === PM_END_TIME) {
                blocks.push({
                    date: start.format('YYYY-MM-DD'),
                    period: 'PM',
                    start_time: PM_START_TIME,
                    end_time: PM_END_TIME
                });
            }
            // Check for Full-day block (09:00 to 18:00)
            else if (start.format('HH:mm:ss') === FULL_DAY_START_TIME && end.format('HH:mm:ss') === FULL_DAY_END_TIME) {
                blocks.push({
                    date: start.format('YYYY-MM-DD'),
                    period: 'Full Day',
                    start_time: FULL_DAY_START_TIME,
                    end_time: FULL_DAY_END_TIME
                });
            } else {
                // Partial day spanning both AM and PM
                blocks.push({
                    date: start.format('YYYY-MM-DD'),
                    period: 'Partial Day',
                    start_time: start.format('HH:mm:ss'),
                    end_time: end.format('HH:mm:ss')
                });
            }
            break; // Since start and end are on the same day, we are done
        }

        // For different days
        if (start.isBefore(currentDayStart)) {
            // Handle case where start is before business hours
            start = currentDayStart;
        }

        if (start.isSameOrBefore(currentDayStart) && end.isSameOrAfter(currentDayEnd)) {
            // Full day schedule (09:00 to 18:00)
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'Full Day',
                start_time: FULL_DAY_START_TIME,
                end_time: FULL_DAY_END_TIME
            });
        } else if (start.isBefore(AM_END_TIME) && end.isBefore(AM_END_TIME)) {
            // AM block (09:00 to 13:00)
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'AM',
                start_time: AM_START_TIME,
                end_time: AM_END_TIME
            });
        } else if (start.isAfter(PM_START_TIME) && end.isSameOrAfter(PM_END_TIME)) {
            // PM block (14:00 to 18:00)
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'PM',
                start_time: PM_START_TIME,
                end_time: PM_END_TIME
            });
        } else {
            // Partial block for the day
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: start.isBefore(AM_END_TIME) ? 'AM' : 'PM',
                start_time: start.format('HH:mm:ss'),
                end_time: moment.min(currentDayEnd, end).format('HH:mm:ss')
            });
        }

        // Move to the next day
        start = start.add(1, 'day').startOf('day');
    }

    return blocks;
}

function scheduleHasNotPassedCurrentDay(date) {
    // Strip the time part by setting the hours, minutes, seconds, and milliseconds to zero
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    // Get today's date and strip the time part
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Compare the dates
    return dateOnly <= today;
}

function scheduleIsAfterCurrentTime(dateString) {
    // Append the GMT+8 offset to the date string
    const dateWithTimezone = new Date(dateString + ' GMT+0800');
    
    // Get the current date and time
    const now = new Date();
    
    // Compare the given date with the current date and time
    return dateWithTimezone >= now;
}


module.exports = {
    splitScheduleByDate,
    scheduleHasNotPassedCurrentDay,
    scheduleIsAfterCurrentTime
};
