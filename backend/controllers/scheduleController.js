const { Schedule } = require('../models');
const employeeController = require('./employeeController'); // Correctly import employeeController
const moment = require('moment'); // Install moment.js to easily handle dates

const splitScheduleByDate = (startDate, endDate) => {
    let start = moment(startDate);  // Start date
    let end = moment(endDate);      // End date
    let blocks = [];

    // Define the AM, PM, and full-day time blocks
    const AM_START = moment('09:00:00', 'HH:mm:ss');
    const AM_END = moment('13:00:00', 'HH:mm:ss');
    const PM_START = moment('14:00:00', 'HH:mm:ss');
    const PM_END = moment('18:00:00', 'HH:mm:ss');
    const FULL_DAY_START = moment('09:00:00', 'HH:mm:ss');
    const FULL_DAY_END = moment('18:00:00', 'HH:mm:ss');

    // Loop through each day between start and end
    while (start.isSameOrBefore(end, 'day')) {
        let currentEnd = moment.min(start.clone().endOf('day'), end); // End of the current day or the end date

        const dayStart = moment(start.format('YYYY-MM-DD') + " 09:00", 'YYYY-MM-DD HH:mm');
        const dayEnd = moment(start.format('YYYY-MM-DD') + " 18:00", 'YYYY-MM-DD HH:mm');

        // Check if the time falls into AM, PM, or Full Day blocks
        if (start.isSameOrBefore(dayStart) && currentEnd.isSameOrAfter(dayEnd)) {
            // Full day schedule (09:00 to 18:00)
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'Full Day',
                start_time: FULL_DAY_START.format('HH:mm:ss'),
                end_time: FULL_DAY_END.format('HH:mm:ss')
            });
        } else if (start.isBetween(dayStart, AM_END, 'minute', '[)') && currentEnd.isSameOrBefore(AM_END)) {
            // AM block (09:00 to 13:00)
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'AM',
                start_time: AM_START.format('HH:mm:ss'),
                end_time: AM_END.format('HH:mm:ss')
            });
        } else if (start.isBetween(PM_START, dayEnd, 'minute', '[)') && currentEnd.isSameOrAfter(PM_START)) {
            // PM block (14:00 to 18:00)
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: 'PM',
                start_time: PM_START.format('HH:mm:ss'),
                end_time: PM_END.format('HH:mm:ss')
            });
        } else {
            // Handle partial day case if start or end is within AM or PM range
            blocks.push({
                date: start.format('YYYY-MM-DD'),
                period: start.isBefore(AM_END) ? 'AM' : 'PM',
                start_time: start.format('HH:mm:ss'),
                end_time: currentEnd.format('HH:mm:ss')
            });
        }

        // Move to the next day
        start = start.add(1, 'day').startOf('day');
    }

    return blocks;
};

// Function to fetch own schedule
const fetchTeamIndividualSchedule = async (userId) => {
    try {
        let ownSchedules = await Schedule.findAll({
            where: { created_by: userId }
        });

        if (!ownSchedules || ownSchedules.length === 0) {
            return [];
        }

        let response = [];
        ownSchedules.forEach(schedule => {
            response.push({
                schedule_id: schedule.schedule_id,
                start_date: schedule.start_date,
                end_date: schedule.end_date,
                schedule_type: schedule.schedule_type,
                created_by: schedule.created_by,
                last_update_by: schedule.last_update_by,
                verify_by: schedule.verify_by,
                verify_timestamp: schedule.verify_timestamp,
                linked_schedule: schedule.linked_schedule,
                created_timestamp: schedule.created_timestamp,
                last_update_timestamp: schedule.last_update_timestamp
            });
        });

        return response;
    } catch (error) {
        console.error("Error fetching schedule:", error);
        throw new Error("Error fetching schedule.");
    }
};

const retrieveTeamSchedule = async (req, res, next) => {
    try {
        const userId = req.user.id; // Retrieve user ID from authenticated user
        const { start_date, end_date, colleague_id } = req.query; // Extract query parameters

        // Fetch colleagues based on userId
        let colleagues = await employeeController.fetchColleagues(userId);
        let wfhDates = {};

        for (const colleague of colleagues) {
            // If colleague_id is provided, filter colleagues by the specified ID
            if (colleague.user_id !== parseInt(colleague_id)) {
                continue; // Skip colleagues not matching the filter
            }

            const colleagueSchedule = await fetchTeamIndividualSchedule(colleague.user_id); // Fetch schedule for colleague
            const colleagueName = colleague.first_name + " " + colleague.last_name;

            // Iterate over each schedule and split into date blocks
            for (const data of colleagueSchedule) {
                // Filter the schedule by start_date and end_date if provided
                if (start_date && moment(data.start_date).isBefore(moment(start_date))) continue;
                if (end_date && moment(data.end_date).isAfter(moment(end_date))) continue;

                // Split schedule into date blocks (AM, PM, Full Day)
                const dateBlocks = splitScheduleByDate(data.start_date, data.end_date);

                // Process each date block
                for (const date of dateBlocks) {
                    if (wfhDates[date.date]) {
                        if (wfhDates[date.date][date.period]) {
                            wfhDates[date.date][date.period].push(colleagueName);
                        } else {
                            wfhDates[date.date][date.period] = [colleagueName];
                        }
                    } else {
                        wfhDates[date.date] = { [date.period]: [colleagueName] };
                    }
                }
            }
        }

        // Check if no schedules were found
        if (Object.keys(wfhDates).length === 0) {
            return res.status(404).json({ message: "No WFH schedules found for this team." });
        }

        return res.status(200).json(wfhDates); // Return the WFH dates
    } catch (error) {
        console.error("Error retrieving team schedule:", error);
        return res.status(500).json({ error: "An error occurred while retrieving the team schedule." });
    }
};

module.exports = {
    retrieveTeamSchedule,
    splitScheduleByDate
};
