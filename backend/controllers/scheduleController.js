const { Schedule } = require('../models');
const moment = require('moment');
const { splitScheduleByDate } = require('../services/common/scheduleHelper');
const { checkforOverlap  } = require('../services/common/applicationHelper');
const { createNewApplication } = require('../controllers/applicationController');
const { Application, Employee } = require('../models');
const { fetchColleagues, fetchSubordinates } = require('../services/common/employeeHelper');

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
        console.error("Error updating own schedule:", error);
        return res.status(500).json({ error: "An error occurred while updating the schedule." });
    }
};

//PATCH function - to update an existing approved application
const updateOwnSchedule = async(req, res, next) => {
    try{

        //get request from frontend on user changes.
        console.log(req.body);
        let { application_id, application_type, startDate, endDate, newStartDate, newEndDate, requestor_remarks, recurrence_rule, recurrence_end_date } = req.body;

        // Validate application_id
        if (!application_id) {
            return res.status(400).json({ message: "Application ID is required for updates." });
        }

        const files = req.files;
        let employeeInfo = await Employee.findByPk(req.user.id);

        // Check if employee exists
        if (!employeeInfo) {
            return res.status(404).json({ message: "Employee not found." });
        }

        // Check if reporting manager exists
        let reportingManager = employeeInfo.reporting_manager;
        if (!reportingManager) {
            return res.status(404).json({ message: "Reporting Manager not found." });
        }

        // Find the pending application by application_id
        let application = await Application.findOne({
            where: { application_id: application_id, status: 'Pending' }
        });

        // Check if the application exists
        if (!application) {
            return res.status(404).json({ message: "Pending application not found." });
        }

        // Find schedule by employee ID and start & end dates
        let schedule = await Schedule.findOne({
            where: { created_by: employeeInfo.id, startDate: startDate, endDate: endDate }
        });

        // Check if the application exists
        if (!schedule) {
            return res.status(404).json({ message: "Pending application not found." });
        }

        // system check if arrangement start or end date has passed
        // Retrieve existing pending applications for overlap check, excluding the current one
        let existingPending = await Application.findAll({
            where: {
                created_by: req.user.id,
                status: 'Approved',
                application_id: { [Op.ne]: application_id } // Exclude the current application
            }
        });

        // Retrieve approved applications based on user id
        let approvedApplications = await Application.findAll({
            where: { created_by: req.user.id }
        });

        // Check for overlaps in existing pending and approved applications
        let existingPendingRes = await checkforOverlap(startDate, endDate, existingPending, 'existing');
        let approvedApplicationRes = await checkforOverlap(startDate, endDate, approvedApplications, 'approved');

        //system does a check to see if there is a clash with other approved arrangements.
        // Return error if overlaps found
        if (existingPendingRes || approvedApplicationRes) {
            return res.status(400).json({ message: "Invalid application period. Updated application cannot overlap with existing or approved applications." });
        }

        //system updates schedule in db
        //steps: update application row -> delete schedule rows

        //update old application to the status of deleted
        application.status = "Deleted";
        application.last_name  = employeeInfo.id;
    
        const updatedApplication = await application.save();
        if (!updatedApplication) {
            return res.status(404).json({ message: "Old Application was not updated due to an error." });
        }

        //delete schedule row
        const deleteSchedule = await schedule.destroy();
        if (!deleteSchedule) {
            return res.status(404).json({ message: "Schedule was not deleted due to an error." });
        }

        //create new application
        const newApplication = await createNewApplication(application_type, newStartDate, newEndDate, requestor_remarks, recurrence_rule, recurrence_end_date, files)
        if (!newApplication) {
            return res.status(404).json({ message: "New Application was not created due to an error." });
        }
        
        return res.status(201).json({message: "Application has been updated for manager approval", result: newApplication});

    }catch(error) {
        console.error("Error retrieving own schedule:", error);
        return res.status(500).json({ error: "An error occurred while retrieving the schedule." });
    }
}

module.exports = {
    retrieveTeamSchedule,
    retrieveSubordinateSchedule,
    retrieveOwnSchedule,
    updateOwnSchedule,
};
