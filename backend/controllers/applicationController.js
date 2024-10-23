const { Application, Employee, Schedule } = require('../models');
const { checkforOverlap, checkWhetherSameDate, uploadFilesToS3, createRecurringApplications } = require('../services/common/applicationHelper');
const { fetchSubordinates } = require('../services/common/employeeHelper');
const { scheduleHasNotPassedCurrentDay, scheduleIsCurrentDayAndAfter } = require('../services/common/scheduleHelper');
const { Op } = require('sequelize');
const moment = require('moment');
const { sequelize } = require('../services/database/mysql');

const { uploadFile } = require('../services/uploads/s3');

// GET function - to retrieve application data based on userId and status
const retrieveApplications = async (req, res, next) => {
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

// GET Function - retrieve pending applications - inherited from managerController.js
const retrievePendingApplications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let subordinates = await fetchSubordinates(userId);

        let response = await Promise.all(
            subordinates.map(async sub => {

                let subApplicationRes = await Application.findAll({
                    where: {
                        created_by: sub.user_id,
                        status: "Pending"
                    }
                })

                let subResponse = {
                    user_id: sub.user_id,
                    first_name: sub.first_name,
                    last_name: sub.last_name,
                    department: sub.department,
                    position: sub.position,
                    country: sub.country,
                    email: sub.email,
                }

                if (subApplicationRes && subApplicationRes.length > 0) {
                    subResponse.pendingApplications = subApplicationRes.map(application => ({
                        application_id: application.application_id,
                        start_date: application.start_date,
                        end_date: application.end_date,
                        application_type: application.application_type,
                        created_by: application.created_by,
                        last_update_by: application.last_update_by,
                        verify_by: application.verify_by,
                        verify_timestamp: application.verify_timestamp,
                        status: application.status,
                        requestor_remarks: application.requestor_remarks,
                        approver_remarks: application.requestor_remarks,
                        created_timestamp: application.created_timestamp,
                        last_update_timestamp: application.last_update_timestamp
                    }))
                } else {
                    subResponse.pendingApplications = []; // No pending applications
                }

                return subResponse;
            })
        )

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching application:", error);
        return res.status(500).json({ error: "An error occurred while fetching application." });
    }
}

// GET Function - retrieve pending applications - inherited from managerController.js
const retrieveApprovedApplications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let subordinates = await fetchSubordinates(userId);

        let response = await Promise.all(
            subordinates.map(async sub => {

                let subApplicationRes = await Application.findAll({
                    where: {
                        created_by: sub.user_id,
                        status: "Approved"
                    }
                })

                let subResponse = {
                    user_id: sub.user_id,
                    first_name: sub.first_name,
                    last_name: sub.last_name,
                    department: sub.department,
                    position: sub.position,
                    country: sub.country,
                    email: sub.email,
                }

                if (subApplicationRes && subApplicationRes.length > 0) {
                    subResponse.approvedApplications = subApplicationRes
                    .filter(application => scheduleIsCurrentDayAndAfter(application.start_date))
                    .map(application => ({
                        application_id: application.application_id,
                        start_date: application.start_date,
                        end_date: application.end_date,
                        application_type: application.application_type,
                        created_by: application.created_by,
                        last_update_by: application.last_update_by,
                        verify_by: application.verify_by,
                        verify_timestamp: application.verify_timestamp,
                        status: application.status,
                        requestor_remarks: application.requestor_remarks,
                        approver_remarks: application.requestor_remarks,
                        created_timestamp: application.created_timestamp,
                        last_update_timestamp: application.last_update_timestamp
                    }))
                } else {
                    subResponse.approvedApplications = []; // No pending applications
                }

                return subResponse;
            })
        )

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching application:", error);
        return res.status(500).json({ error: "An error occurred while fetching application." });
    }
}

// POST function - to create new application
const createNewApplication = async (req, res, next) => {
    try {
        console.log(req.body);
        let { application_type, startDate, endDate, requestor_remarks, recurrence_rule, recurrence_end_date } = req.body

        const files = req.files;
        let employeeInfo = await Employee.findByPk(req.user.id);

        if (!employeeInfo) {
            return res.status(404).json({ message: "Employee not found." });
        }

        let reportingManager = employeeInfo.reporting_manager
        // check if the employee has a reporting manager
        if (!reportingManager) {
            return res.status(404).json({ message: "Reporting Manager not found." });
        };
        // retrieve existing pending application to use for overlapping check later
        let existingPending = await Application.findAll({
            where: {
                created_by: req.user.id,
                status: 'Pending'
            }
        })

        // retrieve approved application based on user id
        let approvedApplication = await Schedule.findAll({
            where: { created_by: req.user.id }
        })

        let existingPendingRes = await checkforOverlap(startDate, endDate, existingPending, 'existing');
        let approvedApplicationRes = await checkforOverlap(startDate, endDate, approvedApplication, 'approved')
        if (existingPendingRes || approvedApplicationRes) {
            return res.status(400).json({ message: `Invalid application period. New application cannot overlap with the existing or approved application.` });
        }

        // Create a new application
        const newApplication = await Application.create({
            start_date: startDate,
            end_date: endDate,
            application_type: application_type,
            created_by: employeeInfo.id,
            last_update_by: employeeInfo.id,
            status: "Pending",
            requestor_remarks: requestor_remarks,
        });

        console.log(newApplication);
        // Upload files using the application ID
        if (files && files.length > 0) {
            await uploadFilesToS3(files, newApplication.application_id, employeeInfo.id);
        }

        // If it's a regular application, generate recurring child events
        if (application_type === "Regular" && recurrence_rule && recurrence_end_date) {
            await createRecurringApplications(recurrence_rule, startDate, endDate, recurrence_end_date, requestor_remarks, req.user.id);
        }

        console.log("New Application:", newApplication);

        return res.status(201).json({ message: "New application successfully created.", result: newApplication })
    } catch (error) {
        console.error("Error creating new application:", error);
        return res.status(500).json({ error: "An error occurred while creating new application." });
    }
}

// PUT function - to update application status to approved - inherited from managerController.js
const approvePendingApplication = async (req, res) => {
    let { application_id, approverRemarks } = req.body;
    const transaction = await sequelize.transaction();
    try {
        let application = await Application.findByPk(application_id);
        if (application == null)
            return res.status(404).json({ message: "Application not found" });
        else if (application.status !== "Pending")
            return res.status(400).json({ message: "Application is not in Pending status" });
        else if (scheduleHasNotPassedCurrentDay(application.start_date))
            return res.status(400).json({ message: "Cannot approve application which has passed" });
        let requestor = await Employee.findByPk(application.created_by);
        let approver = await Employee.findByPk(req.user.id);
        if (requestor.reporting_manager != approver.id)
            return res.status(400).json({ message: "Only the direct reporting manager can approve this application" });
        let conflictingSchedule = await Schedule.findAll({
            where: {
                start_date: {
                    [Op.between]: [application.start_date, application.end_date]
                },
                end_date: {
                    [Op.between]: [application.start_date, application.end_date]
                },
                created_by: requestor.id
            }
        });
        if (conflictingSchedule.length > 0)
            return res.status(400).json({ message: "A conflicting schedule was found" });
        application.status = "Approved";
        application.verify_by = req.user.id;
        application.verify_timestamp = new Date();
        application.approver_remarks = approverRemarks;
        await application.save({ transaction });
        await Schedule.create({
            start_date: application.start_date,
            end_date: application.end_date,
            created_by: requestor.id,
            schedule_type: application.application_type,
            verify_by: req.user.id,
            verify_timestamp: new Date(),
            last_update_by: req.user.id
        }, { transaction });
        await transaction.commit();
        return res.status(200).json({ message: "Application approved successfully" });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: "An error occurred while approving the application", error });
    }
};

// PUT function - to update application status to rejected - inherited from manageController.js
const rejectPendingApplication = async (req, res) => {
    let { application_id, approverRemarks } = req.body;
    const transaction = await sequelize.transaction();
    try {
        let application = await Application.findByPk(application_id);
        if (application == null)
            return res.status(404).json({ message: "Application not found" });
        else if (application.status !== "Pending")
            return res.status(400).json({ message: "Application is not in Pending status" });
        else if (scheduleHasNotPassedCurrentDay(application.start_date))
            return res.status(400).json({ message: "Cannot reject application which has started" });
        let requestor = await Employee.findByPk(application.created_by);
        let approver = await Employee.findByPk(req.user.id);
        if (requestor.reporting_manager != approver.id)
            return res.status(400).json({ message: "Only the direct reporting manager can reject this application" });
        application.status = "Rejected";
        application.last_update_by = req.user.id;
        application.approver_remarks = approverRemarks;
        await application.save({ transaction });
        await transaction.commit();
        return res.status(200).json({ message: "Application rejected successfully" });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: "An error occurred while rejecting the application", error });
    }
};

// PUT function - to update pending application status to withdrawn
const withdrawPendingApplication = async (req, res) => {
    try {
        // Get the current employee using the user ID from the request
        let currentEmployee = await Employee.findByPk(req.user.id);

        if (!currentEmployee) {
            return res.status(400).json({ message: 'Employee not found' });
        }

        const staffId = currentEmployee.id;

        if (!staffId) {
            return res.status(400).json({ message: 'Staff ID not found' });
        }

        // Get the application ID from the request body
        const { application_id } = req.body;

        // Find the application with the given ID, status 'pending', and created by the staff member
        const application = await Application.findOne({
            where: {
                application_id: application_id,
                status: 'Pending',
                created_by: staffId
            }
        });

        if (!application) {
            return res.status(404).json({ message: 'Application not found or not authorized' });
        }

        // Update status to 'Withdrawn'
        application.status = 'Withdrawn';
        await application.save();

        // Print out the now withdrawn request
        console.log('Withdrawn Application:', application);

        // Send a response with the updated application
        res.status(200).json({
            message: 'Application updated to withdrawn successfully',
            application: application
        });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error });
    }
};

// PUT function - to update approved application status to withdrawn
const withdrawApprovedApplication = async (req, res) => {
    try {
        const { application_id, remarks } = req.body;
        const managerId = req.user.id; 

        // Find the corresponding application by matching application_id
        const application = await Application.findByPk(application_id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found or not authorized' });
        }

        if (scheduleHasNotPassedCurrentDay(application.start_date)) {
            return res.status(400).json({ message: "Cannot withdraw application which has started" });
        }

        // Find the requestor and approver
        let requestor = await Employee.findByPk(application.created_by);
        let approver = await Employee.findByPk(managerId);
        
        if (!requestor || !approver) {
            return res.status(404).json({ message: 'Requestor or Approver not found' });
        }

        // Check if the approver is the direct reporting manager
        if (requestor.reporting_manager !== approver.id) {
            return res.status(400).json({ message: "Only the direct reporting manager can withdraw this application" });
        }

        // Find the schedule by schedule_id
        const schedule = await Schedule.findOne({
            where: { 
                created_by: application.created_by,
                start_date: application.start_date
            }
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Update the application status to 'Withdrawn'
        application.status = 'Withdrawn';
        application.approver_remarks = remarks;
        application.last_update_by = managerId;
        await application.save();

        // Delete the corresponding schedule
        await schedule.destroy(); 

        res.status(200).json({
            message: 'Application updated to withdrawn and schedule deleted successfully',
        });
    } catch (error) {
        console.error('Error withdrawing application:', error);
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
};

// PATCH function - to update an existing pending application
const updatePendingApplication = async (req, res, next) => {
    try {
        console.log(req.body);
        let { application_id, application_type, startDate, endDate, requestor_remarks, recurrence_rule, recurrence_end_date } = req.body;

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

        // Validate application_id
        if (!application_id) {
            return res.status(400).json({ message: "Application ID is required for updates." });
        }

        // Find the pending application by application_id
        let application = await Application.findOne({
            where: { application_id: application_id, status: 'Pending' }
        });

        // Check if the application exists
        if (!application) {
            return res.status(404).json({ message: "Pending application not found." });
        }

        // Retrieve existing pending applications for overlap check, excluding the current one
        let existingPending = await Application.findAll({
            where: {
                created_by: req.user.id,
                status: 'Pending',
                application_id: { [Op.ne]: application_id } // Exclude the current application
            }
        });

        // Retrieve approved applications based on user id
        let approvedApplications = await Schedule.findAll({
            where: { created_by: req.user.id }
        });

        // Check for overlaps in existing pending and approved applications
        let existingPendingRes = await checkforOverlap(startDate, endDate, existingPending, 'existing');
        let approvedApplicationRes = await checkforOverlap(startDate, endDate, approvedApplications, 'approved');
        
        // Return error if overlaps found
        if (existingPendingRes || approvedApplicationRes) {
            return res.status(400).json({ message: "Invalid application period. Updated application cannot overlap with existing or approved applications." });
        }

        // Update the existing pending application
        application.start_date = startDate;
        application.end_date = endDate;
        application.application_type = application_type;
        application.last_update_by = employeeInfo.id;
        application.requestor_remarks = requestor_remarks;

        await application.save();

        // Upload files if provided
        if (files && files.length > 0) {
            await uploadFilesToS3(files, employeeInfo.id);
        }

        // Handle recurring applications for regular type
        if (application_type === "Regular" && recurrence_rule && recurrence_end_date) {
            await createRecurringApplications(recurrence_rule, startDate, endDate, recurrence_end_date, requestor_remarks, req.user.id);
        }

        console.log("Updated Application:", application);

        return res.status(200).json({ message: "Pending application successfully updated.", result: application });
    } catch (error) {
        console.error("Error updating pending application:", error);
        return res.status(500).json({ error: "An error occurred while updating the application." });
    }
};


module.exports = {
    retrieveApplications,
    retrievePendingApplications,
    retrieveApprovedApplications,
    createNewApplication,
    approvePendingApplication,
    rejectPendingApplication,
    withdrawPendingApplication,
    withdrawApprovedApplication,
    updatePendingApplication,
}