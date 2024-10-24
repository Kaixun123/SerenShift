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
};

module.exports = {
    retrieveTotalStaffStat,
    retrieveDeptStaffStat,
};
