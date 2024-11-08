const { Application, Employee, Schedule, Blacklist, Notification } = require('../models');
const { checkforOverlap, extractRemainingDates, splitConsecutivePeriodByDay, uploadFilesToS3, sendNotificationEmail, updateFileDetails, generateNewFileName } = require('../services/common/applicationHelper');
const { fetchSubordinates } = require('../services/common/employeeHelper');
const { scheduleHasNotPassedCurrentDay, scheduleIsAfterCurrentTime, deleteCorrespondingSchedule } = require('../services/common/scheduleHelper');
const { Op } = require('sequelize');
const moment = require('moment');
const { sequelize } = require('../services/database/mysql');
const { retrieveFileDetails, copyFileInS3 } = require('../services/uploads/s3');

// GET function - to retrieve application data based on userId and status
const retrieveApplications = async (req, res) => {
    try {
        const userId = await Employee.findByPk(req.user.id);

        if (!userId) {
            return res.status(404).json({ message: "Employee not found." });
        }

        let ownApplication = await Application.findAll({
            where: {
                created_by: userId.id,
                status: {
                    [Op.or]: ["Pending", "Approved"]
                }
            }
        });
        if (!ownApplication || ownApplication.length === 0) {
            return res.status(404).json({ message: `Application not found.` });
        };

        let response = [];
        const today = new Date();
        ownApplication.forEach(application => {
            const startDate = new Date(application.start_date);
            const statusPending = (application.verify_by === null && application.status === 'Pending') ? 'Pending approval' : 'Pending withdrawal';

            if (startDate > today) {
                response.push({
                    application_id: application.application_id,
                    start_date: application.start_date,
                    end_date: application.end_date,
                    application_type: application.application_type,
                    created_by: application.created_by,
                    last_update_by: application.last_update_by,
                    verify_by: application.verify_by,
                    verify_timestamp: application.verify_timestamp,
                    status: application.status === 'Approved' ? application.status : statusPending,
                    requestor_remarks: application.requestor_remarks,
                    approver_remarks: application.requestor_remarks,
                    created_timestamp: application.created_timestamp,
                    last_update_timestamp: application.last_update_timestamp
                })
            }
        });

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching application:", error);
        return res.status(500).json({ error: "An error occurred while fetching application." });
    }
}

// GET Function - retrieve pending applications - inherited from managerController.js
const retrievePendingApplications = async (req, res) => {
    try {
        let subordinates = await fetchSubordinates(req.user.id);

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

                const today = new Date();
                if (subApplicationRes && subApplicationRes.length > 0) {
                    subResponse.pendingApplications = await Promise.all(
                        subApplicationRes
                            .filter(application => new Date(application.start_date) > today)
                            .map(async (application) => {
                                const statusPending = (application.verify_by === null && application.status === 'Pending')
                                    ? 'Pending approval'
                                    : 'Pending withdrawal';
                                // Retrieve file details for each application
                                let files = await retrieveFileDetails('application', application.application_id);

                                return {
                                    application_id: application.application_id,
                                    start_date: application.start_date,
                                    end_date: application.end_date,
                                    application_type: application.application_type,
                                    created_by: application.created_by,
                                    last_update_by: application.last_update_by,
                                    verify_by: application.verify_by,
                                    verify_timestamp: application.verify_timestamp,
                                    status: application.status === 'Approved' ? application.status : statusPending,
                                    requestor_remarks: application.requestor_remarks,
                                    approver_remarks: application.requestor_remarks,
                                    created_timestamp: application.created_timestamp,
                                    last_update_timestamp: application.last_update_timestamp,
                                    files: files.length > 0 ? files : []
                                };
                            })
                    );
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

// GET Function - retrieve pending applications of subordinates - inherited from managerController.js
const retrieveApprovedApplications = async (req, res) => {
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
                });

                let subResponse = {
                    user_id: sub.user_id,
                    first_name: sub.first_name,
                    last_name: sub.last_name,
                    department: sub.department,
                    position: sub.position,
                    country: sub.country,
                    email: sub.email,
                };

                if (subApplicationRes && subApplicationRes.length > 0) {
                    subResponse.approvedApplications = await Promise.all(
                        subApplicationRes
                            .filter(application => scheduleIsAfterCurrentTime(application.start_date))
                            .map(async (application) => {
                                // Fetch file details for each application
                                let files = await retrieveFileDetails('application', application.application_id);

                                return {
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
                                    last_update_timestamp: application.last_update_timestamp,
                                    files: files.length > 0 ? files : []
                                };
                            })
                    );
                } else {
                    subResponse.approvedApplications = []; // No pending applications
                }

                return subResponse;
            })
        );

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching application:", error);
        return res.status(500).json({ error: "An error occurred while fetching application." });
    }
};


// POST function - to create new application
const createNewApplication = async (req, res) => {
    console.log(req.body);
    let { application_type, startDate, endDate, requestor_remarks, recurrence_rule, recurrence_end_date } = req.body;
    const transaction = await sequelize.transaction();
    try {
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

        // retrieve reporting manager information based on reporting manager
        let managerInfo = await Employee.findByPk(employeeInfo.reporting_manager);
        if (!managerInfo) {
            return res.status(404).json({ message: "Reporting Manager Information not found." });
        };

        // retrieve existing pending applications to use for overlapping check later
        let existingPendingApplications = await Application.findAll({
            where: {
                created_by: req.user.id,
                status: 'Pending'
            }
        })

        // retrieve approved schedules based on user id
        let approvedSchedules = await Schedule.findAll({
            where: { created_by: req.user.id }
        })

        let existingPendingRes = await checkforOverlap(startDate, endDate, existingPendingApplications, 'existing');
        let approvedApplicationRes = await checkforOverlap(startDate, endDate, approvedSchedules, 'approved')
        if (existingPendingRes || approvedApplicationRes) {
            return res.status(400).json({ message: `Invalid application period. New application cannot overlap with the existing or approved application.` });
        }

        // Check if the application period is within the blacklist period
        let matchingBlacklists = await Blacklist.findAll({
            where: {
                [Op.and]: {
                    [Op.or]: {
                        start_date: {
                            [Op.between]: [startDate, endDate]
                        },
                        end_date: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    created_by: employeeInfo.reporting_manager
                }
            }
        })
        if (matchingBlacklists.length > 0) {
            return res.status(400).json({ message: "Application period overlaps with blacklist period." });
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
        }, { transaction });

        // Upload files using the application ID
        if (files && files.length > 0) {
            await uploadFilesToS3(files, newApplication.application_id, employeeInfo.id);
        }

        // If it's a regular application, generate recurring child events
        if (application_type === "Regular" && recurrence_rule && recurrence_end_date) {
            let currentStartDate = moment(startDate);
            let currentEndDate = moment(endDate);
            while (currentStartDate.isBefore(recurrence_end_date)) {
                currentStartDate.add(1, recurrence_rule); // E.g., add 1 week or 1 month
                currentEndDate.add(1, recurrence_rule);

                // Conduct check for overlapping schedules
                existingPendingRes = await checkforOverlap(currentStartDate.toDate(), currentEndDate.toDate(), existingPendingApplications, 'existing');
                approvedApplicationRes = await checkforOverlap(currentStartDate.toDate(), currentEndDate.toDate(), approvedSchedules, 'approved')
                // Roll back transaction if overlaps found
                if (existingPendingRes || approvedApplicationRes) {
                    await transaction.rollback();
                    return res.status(400).json({ message: `Invalid application period. New application cannot overlap with the existing or approved application.` });
                }
                // Conduct check for overlapping blacklist dates
                matchingBlacklists = await Blacklist.findAll({
                    where: {
                        [Op.and]: {
                            [Op.or]: {
                                start_date: {
                                    [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                                },
                                end_date: {
                                    [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                                }
                            },
                            created_by: employeeInfo.reporting_manager
                        }
                    }
                });

                // Roll back transaction if overlaps found
                if (matchingBlacklists.length > 0) {
                    await transaction.rollback();
                    return res.status(400).json({ message: "Application period overlaps with blacklist period." });
                }

                let newRegularApp = await Application.create({
                    start_date: currentStartDate.toDate(),
                    end_date: currentEndDate.toDate(),
                    application_type: 'Regular',
                    created_by: employeeInfo.id,
                    last_update_by: employeeInfo.id,
                    requestor_remarks: requestor_remarks,
                    status: 'Pending',
                }, { transaction });
            }
        }

        // Create a notification once application is created
        let content = `has submitted for ${application_type} WFH application`
        await Notification.create({
            notification_type: 'Pending',
            content: content,
            read_status: 0,
            sender_id: req.user.id,
            recipient_id: reportingManager,
            linked_application_id: newApplication.application_id,
            created_by: req.user.id,
            last_update_by: req.user.id
        }, { transaction })


        await transaction.commit();

        if (newApplication || employeeInfo || managerInfo) {
            await sendNotificationEmail(newApplication, employeeInfo, managerInfo, "createApplication");
        }

        return res.status(201).json({ message: "New application successfully created.", result: newApplication })
    } catch (error) {
        await transaction.rollback();
        console.error("Error creating new application:", error);
        return res.status(500).json({ error: "An error occurred while creating new application." });
    }
}

// PATCH function - to update application status to approved - inherited from managerController.js
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

        // Create a notification once application is created
        let content = `has approved your ${application.application_type} WFH application`
        await Notification.create({
            notification_type: 'Approved',
            content: content,
            read_status: 0,
            sender_id: approver.id,
            recipient_id: requestor.id,
            linked_application_id: application_id,
            created_by: approver.id,
            last_update_by: approver.id
        }, { transaction })

        await transaction.commit();

        if (application || requestor || approver) {
            await sendNotificationEmail(application, requestor, approver, "approvedApplication");
        }

        return res.status(200).json({ message: "Application approved successfully" });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: "An error occurred while approving the application", error });
    }
};

// PATCH function - to update application status to rejected - inherited from manageController.js
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

        // Create a notification once application is created
        let content = `has rejected your ${application.application_type} WFH application`
        await Notification.create({
            notification_type: 'Rejected',
            content: content,
            read_status: 0,
            sender_id: approver.id,
            recipient_id: requestor.id,
            linked_application_id: application_id,
            created_by: approver.id,
            last_update_by: approver.id
        }, { transaction })

        await transaction.commit();

        if (application || requestor || approver) {
            await sendNotificationEmail(application, requestor, approver, "rejectedApplication");
        }

        return res.status(200).json({ message: "Application rejected successfully" });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: "An error occurred while rejecting the application", error });
    }
};

// PATCH function - to update pending application status to withdrawn
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

        let reportingManager = currentEmployee.reporting_manager
        // check if the employee has a reporting manager
        if (!reportingManager) {
            return res.status(404).json({ message: "Reporting Manager not found." });
        };

        // retrieve reporting manager information based on reporting manager
        let managerInfo = await Employee.findByPk(currentEmployee.reporting_manager);
        if (!managerInfo) {
            return res.status(404).json({ message: "Reporting Manager Information not found." });
        };

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

        //send email
        if (application || currentEmployee || managerInfo) {
            await sendNotificationEmail(application, currentEmployee, managerInfo, "withdrawnApplication");
        }

        // Send a response with the updated application
        res.status(200).json({
            message: 'Application updated to withdrawn successfully',
            application: application
        });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error });
    }
};

// PATCH function - to update approved application status to withdrawn
const withdrawApprovedApplication = async (req, res) => {
    try {
        const { application_id, remarks } = req.body;
        const managerId = req.user.id;
        const transaction = await sequelize.transaction();

        // Find the corresponding application by matching application_id
        let application = await Application.findByPk(application_id);
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
                start_date: application.start_date,
                end_date: application.end_date,
            }
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }


        // Create a notification once application is created
        let content = `has withdrawn your approved ${application.application_type} WFH application`
        await Notification.create({
            notification_type: 'Withdrawn',
            content: content,
            read_status: 0,
            sender_id: approver.id,
            recipient_id: requestor.id,
            linked_application_id: application_id,
            created_by: approver.id,
            last_update_by: approver.id
        }, { transaction })

        // Update the application status to 'Withdrawn'
        application.status = 'Withdrawn';
        application.withdrawal_remarks = remarks;
        application.last_update_by = managerId;
        await application.save();
        // Delete the corresponding schedule
        await schedule.destroy();
        await transaction.commit();

        //send email
        if (application || requestor || approver) {
            await sendNotificationEmail(application, requestor, approver, "withdrawnApplication");
        }

        return res.status(200).json({
            message: 'Application updated to withdrawn successfully',
        });
    } catch (error) {
        console.error('Error withdrawing application:', error);
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
};

// PATCH - to update approved application status withdrawn
// (1) while waiting for manager approval, status changes to 'Pending - withdrawal'
// (2) if manager approves, status changes to 'Withdrawn'
// (3) else, status remains 'Approved'
const withdrawApprovedApplicationByEmployee = async (req, res) => {
    try {
        let { application_id } = req.body;
        let applicationInfo = await Application.findByPk(application_id);
        let employeeInfo = await Employee.findByPk(req.user.id);
        const transaction = await sequelize.transaction();

        if (!employeeInfo) {
            return res.status(404).json({ message: "Employee not found." });
        }

        let reportingManager = employeeInfo.reporting_manager
        // check if the employee has a reporting manager
        if (!reportingManager) {
            return res.status(404).json({ message: "Reporting Manager not found." });
        };

        if (!applicationInfo) {
            return res.status(404).json({ message: "Approved application not found." });
        } else if (applicationInfo.status !== "Approved") {
            return res.status(400).json({ message: "Application is not in Approved status" })
        } else if (scheduleHasNotPassedCurrentDay(applicationInfo.start_date)) {
            return res.status(404).json({ message: "Cannot withdraw application which has started" });
        }

        let linkedSchedule = await Schedule.findOne({
            where: {
                start_date: applicationInfo.start_date,
                end_date: applicationInfo.end_date,
                created_by: applicationInfo.created_by,
                schedule_type: applicationInfo.application_type,
            }
        })

        if (!linkedSchedule) {
            return res.status(404).json({ message: "Linked application not found." });
        }

        // Create a notification once application is created
        let content = `has submitted for a withdrawal of approved ${applicationInfo.application_type} WFH application`
        await Notification.create({
            notification_type: 'Pending',
            content: content,
            read_status: 0,
            sender_id: req.user.id,
            recipient_id: reportingManager,
            linked_application_id: application_id,
            created_by: req.user.id,
            last_update_by: req.user.id
        }, { transaction })

        applicationInfo.status = "Pending";
        applicationInfo.last_update_by = req.user.id;
        await applicationInfo.save({ transaction })
        await transaction.commit();

        return res.status(200).json({ message: "Your Withdrawal request of approved application successfully sent to the manager." });
    } catch (error) {
        console.error("Error withdrawing application:", error);
        return res.status(500).json({ error: "An error occurred while withdrawing application." });
    }
}

// PATCH function - to update an existing pending application
const updatePendingApplication = async (req, res) => {
    let { application_id, application_type, originalStartDate, originalEndDate, newStartDate, newEndDate, requestor_remarks, recurrence_rule, recurrence_end_date } = req.body;
    const transaction = await sequelize.transaction();
    try {
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
        let existingPendingRes = await checkforOverlap(newStartDate, newEndDate, existingPending, 'existing');
        let approvedApplicationRes = await checkforOverlap(newStartDate, newEndDate, approvedApplications, 'approved');

        // Return error if overlaps found
        if (existingPendingRes || approvedApplicationRes) {
            return res.status(400).json({ message: "Invalid application period. Updated application cannot overlap with existing or approved applications." });
        }

        // Update the existing pending application
        application.start_date = newStartDate;
        application.end_date = newEndDate;
        application.application_type = application_type;
        application.last_update_by = employeeInfo.id;
        application.requestor_remarks = requestor_remarks;

        const updateApplication = await application.save({ transaction });

        // Upload files if provided
        if (files && files.length > 0) {
            await uploadFilesToS3(files, updateApplication.application_id, employeeInfo.id);
        }

        // Handle recurring applications for regular type
        if (application_type === "Regular" && recurrence_rule && recurrence_end_date) {
            let currentStartDate = moment(newStartDate);
            let currentEndDate = moment(newEndDate);
            while (currentStartDate.isBefore(recurrence_end_date)) {
                currentStartDate.add(1, recurrence_rule); // E.g., add 1 week or 1 month
                currentEndDate.add(1, recurrence_rule);

                // Conduct check for overlapping schedules
                existingPendingRes = await checkforOverlap(currentStartDate.toDate(), currentEndDate.toDate(), existingPending, 'existing');
                approvedApplicationRes = await checkforOverlap(currentStartDate.toDate(), currentEndDate.toDate(), approvedApplications, 'approved')
                // Roll back transaction if overlaps found
                if (existingPendingRes || approvedApplicationRes) {
                    await transaction.rollback();
                    return res.status(400).json({ message: `Invalid application period. New application cannot overlap with the existing or approved application.` });
                }
                // Conduct check for overlapping blacklist dates
                matchingBlacklists = await Blacklist.findAll({
                    where: {
                        [Op.and]: {
                            [Op.or]: {
                                start_date: {
                                    [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                                },
                                end_date: {
                                    [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                                }
                            },
                            created_by: employeeInfo.reporting_manager
                        }
                    }
                });

                // Roll back transaction if overlaps found
                if (matchingBlacklists.length > 0) {
                    await transaction.rollback();
                    return res.status(400).json({ message: "Application period overlaps with blacklist period." });
                }

                await Application.create({
                    start_date: currentStartDate.toDate(),
                    end_date: currentEndDate.toDate(),
                    application_type: 'Regular',
                    created_by: employeeInfo.id,
                    last_update_by: employeeInfo.id,
                    requestor_remarks: requestor_remarks,
                    status: 'Pending',
                }, { transaction });
            }
        }
        await transaction.commit();

        //send email
        if (application || employeeInfo || managerInfo) {
            await sendNotificationEmail(application, employeeInfo, managerInfo, "updateApplication");
        }

        return res.status(200).json({ message: "Pending application successfully updated.", result: application });
    } catch (error) {
        await transaction.rollback();
        console.error("Error updating pending application:", error);
        return res.status(500).json({ error: `An error occurred while updating the application.` });
    }
};

//PATCH function - to update an existing approved application
const updateApprovedApplication = async (req, res) => {
    let { application_id, application_type, originalStartDate, originalEndDate, newStartDate, newEndDate, requestor_remarks, recurrence_rule, recurrence_end_date } = req.body;
    const transaction = await sequelize.transaction();
    try {

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

        // retrieve reporting manager information based on reporting manager
        let managerInfo = await Employee.findByPk(reportingManager);
        if (!managerInfo) {
            return res.status(404).json({ message: "Reporting Manager Information not found." });
        };


        // Find the pending application by application_id
        let application = await Application.findOne({
            where: { application_id: application_id, status: 'Approved' }
        });


        // Check if the application exists
        if (!application) {
            return res.status(404).json({ message: "Pending application not found." });
        }

        // Find schedule by employee ID and start & end dates
        let schedule = await Schedule.findOne({
            where: {
                created_by: employeeInfo.id,
                start_date: originalStartDate,
                end_date: originalEndDate
            }
        });

        // Check if the application exists
        if (!schedule) {
            return res.status(404).json({ message: "Pending schedule not found." });
        }

        // system check if arrangement start or end date has passed
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
            where: {
                created_by: req.user.id
            }
        });


        // Check for overlaps in existing pending and approved applications
        let existingPendingRes = await checkforOverlap(newStartDate, newEndDate, existingPending, 'existing');
        let approvedApplicationRes = await checkforOverlap(newStartDate, newEndDate, approvedApplications, 'approved');

        //system does a check to see if there is a clash with other approved arrangements.
        // Return error if overlaps found
        if (existingPendingRes || approvedApplicationRes) {
            return res.status(400).json({ message: "Invalid application period. Updated application cannot overlap with existing or approved applications." });
        }

        //system updates schedule in db
        //steps: update application row -> delete schedule rows

        //update old application to the status of deleted
        application.status = "Deleted";
        application.last_name = employeeInfo.id;

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
        const newApplication = await Application.create({
            application_type: application_type,
            start_date: newStartDate,
            end_date: newEndDate,
            requestor_remarks: requestor_remarks,
            created_by: employeeInfo.id,
            last_update_by: employeeInfo.id,
            status: "Pending",
        }, { transaction });

        if (!newApplication) {
            return res.status(404).json({ message: "Error creating a new application" });
        }

        // Upload files using the application ID
        if (files && files.length > 0) {
            await uploadFilesToS3(files, newApplication.application_id, employeeInfo.id);
        }

        // If it's a regular application, generate recurring child events
        if (application_type === "Regular" && recurrence_rule && recurrence_end_date) {
            let currentStartDate = moment(newStartDate);
            let currentEndDate = moment(newEndDate);
            while (currentStartDate.isBefore(recurrence_end_date)) {
                currentStartDate.add(1, recurrence_rule); // E.g., add 1 week or 1 month
                currentEndDate.add(1, recurrence_rule);

                // Conduct check for overlapping schedules
                existingPendingRes = await checkforOverlap(currentStartDate.toDate(), currentEndDate.toDate(), existingPendingApplications, 'existing');
                approvedApplicationRes = await checkforOverlap(currentStartDate.toDate(), currentEndDate.toDate(), approvedSchedules, 'approved')
                // Roll back transaction if overlaps found
                if (existingPendingRes || approvedApplicationRes) {
                    await transaction.rollback();
                    return res.status(400).json({ message: `Invalid application period. New application cannot overlap with the existing or approved application.` });
                }
                // Conduct check for overlapping blacklist dates
                matchingBlacklists = await Blacklist.findAll({
                    where: {
                        [Op.and]: {
                            [Op.or]: {
                                start_date: {
                                    [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                                },
                                end_date: {
                                    [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                                }
                            },
                            created_by: employeeInfo.reporting_manager
                        }
                    }
                });

                // Roll back transaction if overlaps found
                if (matchingBlacklists.length > 0) {
                    await transaction.rollback();
                    return res.status(400).json({ message: "Application period overlaps with blacklist period." });
                }

                await Application.create({
                    start_date: currentStartDate.toDate(),
                    end_date: currentEndDate.toDate(),
                    application_type: 'Regular',
                    created_by: employeeInfo.id,
                    last_update_by: employeeInfo.id,
                    requestor_remarks: requestor_remarks,
                    status: 'Pending',
                }, { transaction });
            }
        }
        await transaction.commit();

        //send email
        if (newApplication || employeeInfo || managerInfo) {
            await sendNotificationEmail(newApplication, employeeInfo, managerInfo, "updateApplication");
        }

        return res.status(201).json({ message: "Application has been updated for manager approval" });
    } catch (error) {
        console.error("Error retrieving own schedule:", error);
        return res.status(500).json({ error: "An error occurred while retrieving the schedule." });
    }
}

// PATCH - to update approved application status back to approved
const rejectWithdrawalOfApprovedApplication = async (req, res) => {
    try {
        const { application_id } = req.body;
        const managerId = req.user.id;

        // Find the corresponding application by matching application_id
        const application = await Application.findByPk(application_id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found or not authorized' });
        }

        if (scheduleHasNotPassedCurrentDay(application.start_date)) {
            return res.status(404).json({ message: "Cannot withdraw application which has started" });
        }

        // Find the requestor and approver
        let requestor = await Employee.findByPk(application.created_by);
        let approver = await Employee.findByPk(managerId);

        if (!requestor || !approver) {
            return res.status(404).json({ message: 'Requestor or Approver not found' });
        }

        // Check if the approver is the direct reporting manager
        if (requestor.reporting_manager !== approver.id) {
            return res.status(404).json({ message: "Only the direct reporting manager can reject this withdrawal of approved application" });
        }

        // Update the application status to 'Withdrawn'
        application.status = 'Approved';
        application.last_update_by = managerId;
        await application.save();

        return res.status(200).json({
            message: 'Reject withdrawal of approved application successfully',
        });
    } catch (error) {
        console.error("Error approving withdrawal of approved application:", error);
        return res.status(500).json({ error: "An error occurred while approving withdrawal of approved application." });
    }
}

// PATCH function - to withdraw specific dates from a multiday application
const withdrawSpecificDates = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        let { application_id, withdrawDates, remarks, files } = req.body;
        console.log("body request", req.body);

        console.log("in withdraw specific dates functions");

        // Apply Moment to all items in withdrawDates -- for date comparison later
        const withdrawMoments = withdrawDates.map(selectedDate => { return moment(selectedDate).format('YYYY-MM-DD'); });
        // Retrieve existing approved application 
        let existingApprovedApp = await Application.findOne({
            where: {
                application_id: application_id,
                status: 'Approved'
            }
        });

        if (existingApprovedApp) {  // Check if a record was found
            // Access start_date and end_date from dataValues
            const { start_date, end_date } = existingApprovedApp.dataValues;
            let existingMoments = [];

            if (start_date && end_date) { // Check if start_date and end_date exist
                existingMoments = splitConsecutivePeriodByDay(start_date, end_date);
                console.log("existing moments", existingMoments);
            } else {
                console.log("Missing start_date or end_date for application:", existingApprovedApp);
            }

            // Set original application to withdrawn
            try {
                existingApprovedApp.status = 'Withdrawn';
                existingApprovedApp.withdrawal_remarks = remarks;
                await existingApprovedApp.save({ transaction });
                console.log("update existing approved application.");
                await transaction.commit();
            } catch (error) {
                console.error("Error updating existing application:", error);
                return res.status(500).json({ error: "An error occurred while updating existing application." });
            };

            // Find corresponding entry in Schedule
            const deleteSchedule = await deleteCorrespondingSchedule(existingApprovedApp);
            if (!deleteSchedule) {
                console.error("Error deleting corresponding schedule:", error);
                return res.status(500).json({ error: "An error occurred while deleting corresponding schedule." });
            } else {
                console.log("Schedule successfully deleted");
            }

            // Find the files tied to application
            const files = await retrieveFileDetails(existingApprovedApp.application_type, application_id);

            // Find the remaining dates after withdrawal
            const remainingDates = extractRemainingDates(existingMoments, withdrawMoments);
            console.log("remaining dates to create a new application", remainingDates);

            // Handle the blocks of dates -- create new Application entries to reflect the unwithdrawn dates
            let isFirstBlock = true;
            for (const block of remainingDates) {
                try {
                    await createSimilarApplication(block, existingApprovedApp, files, isFirstBlock);
                    isFirstBlock = false;
                    console.log("new application created.");
                } catch (error) {
                    console.error("Error creating new application:", error);
                    return res.status(500).json({ error: "An error occurred while creating new application." });
                }
            };

            return res.status(200).json({ message: "Specific dates successfully withdrawn." });
        } else {
            console.log("No approved application found for application_id:", application_id);
        };

    } catch (error) {
        console.error("Error withdrawing specific dates:", error);
        return res.status(500).json({ error: "An error occurred while withdrawing specific dates." });
    };
};


// Helper function to withdrawSpecificDates - to create new application similar to a given existing application 
const createSimilarApplication = async (newStartEnd, existingApprovedApp, files, isFirstBlock) => {
    try {
        const transaction = await sequelize.transaction();
        const files = await retrieveFileDetails('application', existingApprovedApp.application_id);
        const employee_id = existingApprovedApp.created_by;
        const manager_id = existingApprovedApp.verify_by;

        const combinedStartDateTime = `${newStartEnd[0]}T${existingApprovedApp.start_date.toTimeString().split(' ')[0]}`;
        const combinedEndDateTime = `${newStartEnd[newStartEnd.length - 1]}T${existingApprovedApp.end_date.toTimeString().split(' ')[0]}`;

        try {
            // VALIDATION -- overlap check:
            // retrieve existing approved applications
            let existingApprovedApplications = await Application.findAll({
                where: {
                    created_by: employee_id,
                    status: 'Approved'
                }
            })
            // retrieve approved schedules based on user id
            let approvedSchedules = await Schedule.findAll({
                where: { created_by: employee_id }
            })

            let existingApprovedRes = await checkforOverlap(combinedStartDateTime, combinedEndDateTime, existingApprovedApplications, 'existing');
            let approvedApplicationRes = await checkforOverlap(combinedStartDateTime, combinedEndDateTime, approvedSchedules, 'approved')
            if (existingApprovedRes || approvedApplicationRes) {
                console.log("Invalid application period. New application cannot overlap with the existing or approved application.");
                return { status: 400, message: "Invalid application period. New application cannot overlap with the existing or approved application." };
            } else {
                const newApplication = await Application.create({
                    start_date: combinedStartDateTime,
                    end_date: combinedEndDateTime,
                    application_type: existingApprovedApp.application_type,
                    created_by: employee_id,
                    last_update_by: manager_id, // Manager will be put as the last updated user
                    verify_by: manager_id,
                    verify_timestamp: existingApprovedApp.verify_timestamp,
                    status: 'Approved',
                    requestor_remarks: existingApprovedApp.requestor_remarks,
                    approver_remarks: existingApprovedApp.approver_remarks,
                }, { transaction });

                await Schedule.create({
                    start_date: combinedStartDateTime,
                    end_date: combinedEndDateTime,
                    created_by: employee_id,
                    schedule_type: existingApprovedApp.application_type,
                    verify_by: manager_id,
                    verify_timestamp: new Date(),
                    last_update_by: manager_id
                }, { transaction });

                console.log("Files ", files);
                // Upload files from original application using the new application ID
                if (files && files.length > 0) {
                    console.log("in file upload function")
                    for (const file of files) {
                        const newFileName = generateNewFileName(file.file_name, employee_id, newApplication.application_id, file.file_extension);
                        console.log("new file name ", newFileName);
                        const newS3Key = `${process.env.NODE_ENV}/application/${newApplication.application_id}/${newFileName}`.toLowerCase();
                        await copyFileInS3(file.s3_key, newS3Key);
                        console.log("copied updated file to S3");
                        await updateFileDetails(file.file_id, newApplication.application_id, newS3Key, file, isFirstBlock);
                    }
                }

                await transaction.commit(); // Save changes to DB
                return { status: 201, message: "New application successfully created." };
            };
        } catch (error) {
            await transaction.rollback();
            console.error("Error creating new application:", error);
            return { status: 500, error: "An error occurred while creating new application." };
        };
    } catch (error) {
        console.error("Error creating similar applications:", error);
        return { status: 500, error: "An error occurred while creating similar applications." };
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
    withdrawApprovedApplicationByEmployee,
    updatePendingApplication,
    updateApprovedApplication,
    rejectWithdrawalOfApprovedApplication,
    withdrawSpecificDates,
    createSimilarApplication,
}