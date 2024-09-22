const { Schedule } = require('../models');
const moment = require('moment'); // Install moment.js to easily handle dates
const { splitScheduleByDate } = require('../services/common/scheduleHelper')
const { fetchColleagues } = require('../services/common/employeeHelper');

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
        let colleagues = await fetchColleagues(userId);
        let wfhDates = {};
        let filterColleagueId = null
        if (colleague_id) {
            filterColleagueId = colleague_id.split(",");
        }

        for (const colleague of colleagues) {
            // If colleague_id is provided, filter colleagues by the specified ID
            if (filterColleagueId && !filterColleagueId.includes(String(colleague.user_id))) {
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
                const dateBlocks = await splitScheduleByDate(data.start_date, data.end_date);
                // Process each date block
                for (const date of dateBlocks) {
                    // Initialize the date object if it doesn't exist
                    if (!wfhDates[date.date]) {
                        wfhDates[date.date] = {};
                    }

                    // Initialize the time period (AM, PM, Full Day) if it doesn't exist
                    if (!wfhDates[date.date][date.period]) {
                        wfhDates[date.date][date.period] = [];
                    }

                    // Add colleague's name to the time slot if not already added
                    if (!wfhDates[date.date][date.period].includes(colleagueName)) {
                        wfhDates[date.date][date.period].push(colleagueName);
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

const retrieveOwnSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const schedule = await fetchTeamIndividualSchedule(userId);

        if (schedule.length === 0) {
            return res.status(404).json({ message: "No schedules found for this user." });
        }

        let wfhDates = {};
        for (const block of schedule) {
            dateBlocks = await splitScheduleByDate(block.start_date, block.end_date);

            for (const date of dateBlocks) {
                // Initialize the date object if it doesn't exist
                wfhDates[date.date] = wfhDates[date.date] || {};

                // Initialize the period array if it doesn't exist
                wfhDates[date.date][date.period] = wfhDates[date.date][date.period] || [];

                // Push the time block into the corresponding array of key AM/PM/Full day 
                wfhDates[date.date][date.period].push([date.start_time, date.end_time]);
            }
        }

        return res.status(200).json(wfhDates);
    } catch (error) {
        console.error("Error retrieving own schedule:", error);
        return res.status(500).json({ error: "An error occurred while retrieving the schedule." });
    }
};

module.exports = {
    retrieveTeamSchedule, 
    retrieveOwnSchedule
};
