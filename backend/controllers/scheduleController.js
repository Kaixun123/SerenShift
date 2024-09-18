const { Schedule } = require('../models');
const employeeController = require('./employeeController');  // Correctly import employeeController

const fetchOwnSchedule = async (userId) => {
    try {
        // Find the schedules created by the user
        let ownSchedules = await Schedule.findAll({
            where: { created_by: userId }
        });

        // If no schedules found, return an empty array
        if (!ownSchedules || ownSchedules.length === 0) {
            return [];  // Return empty array instead of sending a response
        }

        // Format the schedule data
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

        return response;  // Return the formatted schedule data
    } catch (error) {
        console.error("Error fetching schedule:", error);
        throw new Error("Error fetching schedule.");  // Throw error to be handled by calling function
    }
}

const retrieveOwnSchedule = async (req, res, next) => {
    try {
        // Assuming req.user contains the logged-in user's ID
        const userId = req.user.id;

        // Fetch the schedule using the userId
        const schedule = await fetchOwnSchedule(userId);

        // If no schedules found, return a 404 response
        if (schedule.length === 0) {
            return res.status(404).json({ message: "No schedules found for this user." });
        }

        // Return the schedules as JSON
        return res.status(200).json(schedule);
    } catch (error) {
        console.error("Error retrieving own schedule:", error);
        return res.status(500).json({ error: "An error occurred while retrieving the schedule." });
    }
}


const retrieveColleagueIds = async (req, res, next) => {
    try {
        // Use the fetchColleagues function from employeeController to get colleagues
        let colleagues = await employeeController.fetchColleagues(req.user.id);

        // Extract colleague IDs from the retrieved colleagues
        let colleagueIds = colleagues.map(colleague => colleague.user_id);

        // Return the colleague IDs as a response
        return res.status(200).json({ colleague_ids: colleagueIds });
    } catch (error) {
        console.error("Error processing colleague IDs:", error);
        return res.status(500).json({ error: "An error occurred while retrieving colleague IDs" });
    }
}


module.exports = {
    retrieveOwnSchedule,
    retrieveColleagueIds
};
