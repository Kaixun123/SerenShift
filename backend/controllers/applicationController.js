const { Application } = require('../models');
const { Employee } = require('../models');
const scheduleController = require("./scheduleController");

// GET function - to retrieve application data based on userId and status
const retrieveApplication = async (req, res, next) => {
    try {

        let { id, status } = req.body
        let ownApplication = await Application.findAll({
            where: {
                created_by: id,
                status: status
            }
        });

        if (!ownApplication || ownApplication.length === 0) {
            return res.status(200).json({ message: "No Pending Application." });
        };

        let response = [];
        ownApplication.forEach(application => {
            response.push({
                application_id: application.application_id,
                start_date: application.start_date,
                end_date: application.end_date,
                application_type: application.application_type,
                created_by: application.created_by,
                last_update_by: application.last_update_by,
                verify_by: application.verify_by,
                verify_timestamp: application.verify_timestamp,
                linked_application: application.linked_application,
                status: application.status,
                requestor_remarks: application.requestor_remarks,
                approver_remarks: application.requestor_remarks,
                created_timestamp: application.created_timestamp,
                last_update_timestamp: application.last_update_timestamp
            });
        });

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching application:", error);
        throw new Error("Error fetching application.");
    }
}

// POST function - to create pending application
const createPendingApplication = async (req, res, next) => {
    try {

        let { id, application_type, start_date, end_date, requestor_remarks } = req.body
        let employeeReportingManager = await Employee.findOne({
            where: { id: id }
        })

        // check if the employee has a reporting manager
        if (!employeeReportingManager || employeeReportingManager.length === 0) {
            return res.status(404).json({ message: "Reporting Manager not found." });
        };

        // check if the new start_date & end_date duplicate with the approved application
        let checkDuplicateApplication = scheduleController.splitScheduleByDate(start_date, end_date);
        if (checkDuplicateApplication.length != 0) {
            return res.status(404).json({ message: "Duplicate application." });
        }

        // if no duplicate, create a new pending application
        let newApplication = await Application.create({
            start_date: start_date,
            end_date: end_date,
            application_type: application_type,
            created_by: id,
            last_update_by: id,
            status: "Pending",
            requestor_remarks: requestor_remarks,
        })

        return res.status(201).json({ message: "Successcully creating a pending application.", result: newApplication })
    } catch (error) {
        console.error("Error creating a pending application:", error);
        return res.status(500).json({ error: "An error occurred while creating a pending application." });
    }
}

module.exports = {
    retrieveApplication,
    createPendingApplication
}