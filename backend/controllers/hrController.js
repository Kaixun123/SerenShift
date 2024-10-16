const { Schedule } = require('../models');
const { Employee } = require('../models');
const { Op } = require('sequelize'); // Import Sequelize operators for date range checks

const retrieveTotalStaffStat = async (req, res, next) => {
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
};

const retrieveDeptStaffStat = async (req, res, next) => {
    try {
        const { date, department } = req.query;

        // Convert to Date object and handle timezone
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)); // 00:00:00 of the target date
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)); // 23:59:59 of the target date

        // Define AM, PM, and Full-Day ranges
        const amStart = new Date(targetDate.setHours(9, 0, 0, 0));   // 09:00:00 (start of AM)
        const amEnd = new Date(targetDate.setHours(13, 0, 0, 0));    // 13:00:00 (end of AM)
        const pmStart = new Date(targetDate.setHours(14, 0, 0, 0));  // 14:00:00 (start of PM)
        const pmEnd = new Date(targetDate.setHours(18, 0, 0, 0));    // 18:00:00 (end of PM)
        const fullDayStart = new Date(targetDate.setHours(9, 0, 0, 0)); // 09:00:00 (start of full day)
        const fullDayEnd = new Date(targetDate.setHours(18, 0, 0, 0));   // 18:00:00 (end of full day)

        // Initialize counts for AM, PM, and Full-Day WFH
        let amCount = 0;
        let pmCount = 0;
        let fullDayCount = 0;

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
                    // Full-Day WFH: Schedule spans from 09:00 to 18:00
                    if (schedule.start_date <= fullDayStart && schedule.end_date >= fullDayEnd) {
                        fullDayCount++;
                    }

                    // AM WFH: Schedule overlaps with AM period (09:00 to 13:00)
                    if (schedule.start_date <= amEnd && schedule.end_date >= amStart) {
                        amCount++;
                    }

                    // PM WFH: Schedule overlaps with PM period (14:00 to 18:00)
                    if (schedule.start_date <= pmEnd && schedule.end_date >= pmStart) {
                        pmCount++;
                    }
                });
            });
        });

        // Wait for all schedule promises to resolve
        await Promise.all(schedulePromises);

        // Prepare the result
        const result = {
            department,
            wfh: {
                am: amCount,
                pm: pmCount,
                fullDay: fullDayCount
            }
        };

        // Return the WFH counts for the specified department
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error retrieving staff:", error);
        return res.status(500).json({ error: "An error occurred while retrieving staff data." });
    }
};

module.exports = {
    retrieveTotalStaffStat,
    retrieveDeptStaffStat
};
