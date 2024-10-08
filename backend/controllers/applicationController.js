const { Application, Employee, Schedule } = require('../models');
const { checkforOverlap } = require('../services/common/applicationHelper');
const { splitScheduleByDate } = require('../services/common/scheduleHelper')

// GET function - to retrieve application data based on userId and status
const retrieveApplication = async (req, res, next) => {
    try {
        let { status } = req.query;
        let ownApplication = await Application.findAll({
            where: {
                created_by: req.user.id,
                status: status
            }
        });
        if (!ownApplication || ownApplication.length === 0) {
            return res.status(404).json({ message: `No ${status} application.` });
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
        return res.status(500).json({ error: "An error occurred while fetching application." });
    }
}


// POST function - to create new application
const createNewApplication = async (req, res, next) => {
    try {

        let { id, application_type, start_date, end_date, requestor_remarks } = req.body
        let employeeInfo = await Employee.findByPk(id);
        let reportingManager = employeeInfo.reporting_manager

        // check if the employee has a reporting manager
        if (!reportingManager || reportingManager.length === 0) {
            return res.status(404).json({ message: "Reporting Manager not found." });
        };

        // retrieve existing pending application to use for overlapping check later
        let existingPending = await Application.findAll({
            where: {
                created_by: id,
                status: 'Pending'
            }
        })

        // retrieve approved application based on user id
        let approvedApplication = await Schedule.findAll({
            where: { created_by: id }
        })

        let existingPendingRes = await checkforOverlap(start_date, end_date, existingPending, 'existing');
        let approvedApplicationRes = await checkforOverlap(start_date, end_date, approvedApplication, 'approved')
        if (existingPendingRes || approvedApplicationRes) {
            return res.status(404).json({ message: `Invalid application period. New application cannot overlap with the existing or approved application.` });
        }

        // if no duplicate, create a new application
        let newApplication = await Application.create({
            start_date: start_date,
            end_date: end_date,
            application_type: application_type,
            created_by: id,
            last_update_by: id,
            status: "Pending",
            requestor_remarks: requestor_remarks,
        })

        return res.status(201).json({ message: "New application successfully created.", result: newApplication })
    } catch (error) {
        console.error("Error creating new application:", error);
        return res.status(500).json({ error: "An error occurred while creating new application." });
    }
}

module.exports = {
    retrieveApplication,
    createNewApplication
}