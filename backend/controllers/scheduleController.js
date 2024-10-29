const { Employee, Schedule } = require('../models');
const moment = require('moment');
const { splitScheduleByDate } = require('../services/common/scheduleHelper');
const { fetchColleagues, fetchSubordinates } = require('../services/common/employeeHelper');
const { Op } = require('sequelize'); // Import Sequelize operators for date range checks

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
                    if (date.period != 'Partial Day') {
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

const retrieveSubordinateSchedule = async (req, res, next) => {
    try {
        const userId = req.user.id; // Retrieve user ID from authenticated user
        const { start_date, end_date, colleague_id } = req.query; // Extract query parameters

        // Fetch colleagues based on userId
        let colleagues = await fetchSubordinates(userId);
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
                    if (date.period != 'Partial Day') {
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

        let calendarEvents = [];
        for (const block of schedule) {
            const dateBlocks = await splitScheduleByDate(block.start_date, block.end_date);
            console.log(block)
            console.log(dateBlocks);
            for (const date of dateBlocks) {
                const startTime = date.start_time;
                const endTime = date.end_time;
                const title = `WFH (${date.period})`;

                calendarEvents.push({
                    title: title,
                    start: `${date.date}T${startTime}`,
                    end: `${date.date}T${endTime}`,
                    allDay: date.period === "Full Day", // Set allDay if it's a full-day block
                    extendedProps: {
                        type: `${date.period}`
                    }
                });
            }
        }

        return res.status(200).json(calendarEvents);
    } catch (error) {
        console.error("Error retrieving own schedule:", error);
        return res.status(500).json({ error: "An error occurred while retrieving the schedule." });
    }
};

const retrieveCompanySchedule = async (req, res) => {
    try {
        const { date } = req.query;

        // Convert to Date object and handle timezone
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)); // 00:00:00 of the target date
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)); // 23:59:59 of the target date

        // Initialize an object to track total staff and wfh counts by department
        const stats = {};

        // Retrieve all employees
        const employees = await Employee.findAll();

        // Create promises for all schedule queries in parallel
        const schedulePromises = employees.map(staff => {
            const dept = staff.department;

            // Initialize the department if not already present in the stats object
            if (!stats[dept]) {
                stats[dept] = { total: 0, wfh: 0 };
            }

            // Increment total staff count for this department
            stats[dept].total++;

            // Return a promise that checks if the employee has a schedule overlapping the target date
            return Schedule.findOne({
                where: {
                    created_by: staff.id,
                    [Op.and]: [
                        { start_date: { [Op.lte]: endOfDay } },  // schedule starts on or before end of day
                        { end_date: { [Op.gte]: startOfDay } }   // schedule ends on or after start of day
                    ]
                }
            }).then(schedule => {
                // If schedule is found, increment wfh count for the department
                if (schedule) {
                    stats[dept].wfh++;
                }
            });
        });

        // Wait for all schedule promises to resolve
        await Promise.all(schedulePromises);

        // Now compute the `wfo` for each department as `total - wfh`
        const result = {};
        Object.keys(stats).forEach(dept => {
            const wfh = stats[dept].wfh;
            const total = stats[dept].total;
            const wfo = total - wfh;  // Work from office count

            // Return only `wfh` and `wfo`
            result[dept] = { wfo, wfh };
        });

        // Return the wfo and wfh counts for each department
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error retrieving staff:", error);
        return res.status(500).json({ error: "An error occurred while retrieving staff data." });
    }
}

const retrieveDepartmentSchedule = async (req, res) => {
    try {
        const { date, department } = req.query;

        // Convert to Date object and handle timezone
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)); // 00:00:00 of the target date
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)); // 23:59:59 of the target date

        // Define AM, PM, and Full-Day ranges for that specific day
        const amStart = new Date(startOfDay);  // 09:00:00 (start of AM on target day)
        amStart.setHours(9, 0, 0, 0);
        const amEnd = new Date(startOfDay);   // 13:00:00 (end of AM on target day)
        amEnd.setHours(13, 0, 0, 0);

        const pmStart = new Date(startOfDay); // 14:00:00 (start of PM on target day)
        pmStart.setHours(14, 0, 0, 0);
        const pmEnd = new Date(startOfDay);   // 18:00:00 (end of PM on target day)
        pmEnd.setHours(18, 0, 0, 0);

        const fullDayStart = new Date(startOfDay);  // 09:00:00 (start of full day on target day)
        fullDayStart.setHours(9, 0, 0, 0);
        const fullDayEnd = new Date(startOfDay);    // 18:00:00 (end of full day on target day)
        fullDayEnd.setHours(18, 0, 0, 0);

        // Initialize counts for AM, PM, and Full-Day WFH and array for individual staff data
        let amCount = 0;
        let pmCount = 0;
        let fullDayCount = 0;
        const wfhStaff = [];

        // Retrieve all employees in the specified department
        const employees = await Employee.findAll({
            where: { department }
        });

        // Create promises for all schedule queries in parallel
        const schedulePromises = employees.map(staff => {
            // Return a promise that checks the employee's schedule on the target date
            return Schedule.findAll({
                where: {
                    created_by: staff.id,
                    [Op.and]: [
                        { start_date: { [Op.lte]: endOfDay } },  // schedule starts on or before end of day
                        { end_date: { [Op.gte]: startOfDay } }   // schedule ends on or after start of day
                    ]
                }
            }).then(schedules => {
                schedules.forEach(schedule => {
                    // Limit the schedule comparison to only the target date (ignoring schedules beyond the day)
                    const scheduleStart = new Date(schedule.start_date) < startOfDay ? startOfDay : new Date(schedule.start_date);
                    const scheduleEnd = new Date(schedule.end_date) > endOfDay ? endOfDay : new Date(schedule.end_date);

                    let wfhPeriod = '';

                    // Full-Day WFH: Schedule fully covers 09:00 to 18:00 on the target day
                    if (scheduleStart <= fullDayStart && scheduleEnd >= fullDayEnd) {
                        fullDayCount++;
                        wfhPeriod = 'Full-Day';
                    }
                    // AM WFH: Schedule overlaps with AM period
                    else if (scheduleStart <= amEnd && scheduleEnd >= amStart) {
                        amCount++;
                        wfhPeriod = 'AM';
                    }
                    // PM WFH: Schedule overlaps with PM period
                    else if (scheduleStart <= pmEnd && scheduleEnd >= pmStart) {
                        pmCount++;
                        wfhPeriod = 'PM';
                    }

                    // If the employee worked from home, add their details to the wfhStaff array
                    if (wfhPeriod) {
                        wfhStaff.push({
                            id: staff.id,
                            name: `${staff.first_name} ${staff.last_name}`,
                            wfhPeriod: wfhPeriod
                        });
                    }
                });
            });
        });

        // Wait for all schedule promises to resolve
        await Promise.all(schedulePromises);

        const total = amCount + pmCount + fullDayCount;
        const wfhStats = {
            department,
            wfh: {
                am: amCount / total || 0,
                pm: pmCount / total || 0,
                fullDay: fullDayCount / total || 0
            }
        };

        // Return both the WFH stats and the list of WFH staff
        return res.status(200).json({
            wfhStats,
            wfhStaff
        });

    } catch (error) {
        console.error("Error retrieving staff:", error);
        return res.status(500).json({ error: "An error occurred while retrieving staff data." });
    }
}

module.exports = {
    retrieveTeamSchedule,
    retrieveSubordinateSchedule,
    retrieveOwnSchedule,
    retrieveCompanySchedule,
    retrieveDepartmentSchedule
};