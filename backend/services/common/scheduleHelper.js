const moment = require('moment'); // Ensure moment.js is installed

async function splitScheduleByDate(startDate, endDate) {
    let start = moment(startDate);  // Start date and time
    let end = moment(endDate);      // End date and time
    let blocks = [];

    // Define the time blocks for AM, PM, and full-day
    const AM_START = moment('09:00:00', 'HH:mm:ss');
    const AM_END = moment('13:00:00', 'HH:mm:ss');
    const PM_START = moment('14:00:00', 'HH:mm:ss');
    const PM_END = moment('18:00:00', 'HH:mm:ss');
    const FULL_DAY_START = moment('09:00:00', 'HH:mm:ss');
    const FULL_DAY_END = moment('18:00:00', 'HH:mm:ss');

    // Loop through each day between start and end
    while (start.isSameOrBefore(end, 'day')) {
        let currentDayStart = moment(start.format('YYYY-MM-DD') + " 09:00", 'YYYY-MM-DD HH:mm');
        let currentDayEnd = moment(start.format('YYYY-MM-DD') + " 18:00", 'YYYY-MM-DD HH:mm');

        // If the start and end are on the same day and within business hours
        if (start.isSame(end, 'day')) {
            if (start.isSameOrAfter(AM_START) && end.isSameOrBefore(AM_END)) {
                // AM block (09:00 to 13:00)
                blocks.push({
                    date: start.format('YYYY-MM-DD'),
                    period: 'AM',
                    start_time: start.format('HH:mm:ss'),
                    end_time: end.format('HH:mm:ss')
                });
            } else if (start.isSameOrAfter(PM_START) && end.isSameOrBefore(PM_END)) {
                // PM block (14:00 to 18:00)
                blocks.push({
                    date: start.format('YYYY-MM-DD'),
                    period: 'PM',
                    start_time: start.format('HH:mm:ss'),
                    end_time: end.format('HH:mm:ss')
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
                start_time: FULL_DAY_START.format('HH:mm:ss'),
                end_time: FULL_DAY_END.format('HH:mm:ss')
            });
        } else if (start.isBefore(AM_END) && end.isBefore(AM_END)) {
            // AM block (09:00 to 13:00)
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'AM',
                start_time: AM_START.format('HH:mm:ss'),
                end_time: AM_END.format('HH:mm:ss')
            });
        } else if (start.isAfter(PM_START) && end.isSameOrAfter(PM_END)) {
            // PM block (14:00 to 18:00)
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'PM',
                start_time: PM_START.format('HH:mm:ss'),
                end_time: PM_END.format('HH:mm:ss')
            });
        } else {
            // Partial block for the day
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: start.isBefore(AM_END) ? 'AM' : 'PM',
                start_time: start.format('HH:mm:ss'),
                end_time: moment.min(currentDayEnd, end).format('HH:mm:ss')
            });
        }

        // Move to the next day
        start = start.add(1, 'day').startOf('day');
    }

    return blocks;
}

module.exports = {
    splitScheduleByDate
};
