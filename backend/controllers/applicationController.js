const { Application, Employee, Schedule } = require('../models');
const { splitScheduleByDate } = require('../services/common/scheduleHelper')
const moment = require('moment'); // Ensure moment.js is installed
const { uploadFile } = require('../services/uploads/s3');

// GET function - to retrieve application data based on userId and status
const retrieveApplication = async (req, res, next) => {
    try {

        let { id, status } = req.query;
        
        let ownApplication = await Application.findAll({
            where: {
                created_by: id,
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

// Helper function for createNewApplication
const checkforOverlap = async (newStartDate, newEndDate, dataArray, applicationType) => {
    try {
        let formattedNewDate = await splitScheduleByDate(newStartDate, newEndDate);
        for (const newDate of formattedNewDate) {

            // dataArray can be both existingPending OR approvedApplication
            for (const data of dataArray) {
                // Split the existing date range into blocks by day
                const dateBlocks = await splitScheduleByDate(data.start_date, data.end_date);

                for (const block of dateBlocks) {
                    // Ensure comparison happens only on the same date
                    if (block.date === newDate.date) {

                        // Convert newDate to full date-time for proper range comparison
                        let newStartDate = moment(`${newDate.date} ${newDate.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                        let newEndDate = moment(`${newDate.date} ${newDate.end_time}`, 'YYYY-MM-DD HH:mm:ss');

                        let existingStartDate = moment(`${block.date} ${block.start_time}`, 'YYYY-MM-DD HH:mm:ss')
                        let existingEndDate = moment(`${block.date} ${block.end_time}`, 'YYYY-MM-DD HH:mm:ss')

                        // Overlap condition: check if the new date period overlaps with the existing/approved date period
                        // (1) condition is to check if the new start_date is before existing/approved end_date && new end_date is after existing/approved start_date (full or partial overlap)
                        // (2) condition is to check if the new start_date is before existing/approved start_date && new end_date is after existing/approved start_date (1-day edge case)
                        if ((newStartDate.isBefore(existingEndDate) && newEndDate.isAfter(existingStartDate))
                            || newStartDate.isBefore(existingStartDate) && newEndDate.isAfter(existingStartDate)) {
                            return true
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error fetching ${applicationType} application:`, error);
        throw new Error(`Error fetching ${applicationType} application.`);
    }
}

// Helper Function to upload files to S3
const uploadFilesToS3 = async (files, userId) => {
    if (!files || files.length === 0) return;

    const uploadPromises = files.map(file => uploadFile(file, 'application', userId, false, { id: userId }));
    await Promise.all(uploadPromises);
};

// POST function - to create new application
const createNewApplication = async (req, res, next) => {
    try {
        let { id, application_type, start_date, end_date, requestor_remarks } = req.body
        const files = req.files;
        let employeeInfo = await Employee.findByPk(id);
        console.log(files);

        if (!employeeInfo) {
            return res.status(404).json({ message: "Employee not found." });
        }

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

        // Create a new application
        const newApplication = await Application.create({
            start_date: start_date,
            end_date: end_date,
            application_type: application_type,
            created_by: id,
            last_update_by: id,
            status: "Pending",
            requestor_remarks: requestor_remarks,
        });

        // Upload files using the application ID
        if (files && files.length > 0) {
            await uploadFilesToS3(files, employeeInfo.id);
        }
        // Log the results for debugging
        console.log("New Application:", newApplication);

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