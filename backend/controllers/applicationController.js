const { Application, Employee, Schedule, Blacklist } = require('../models');
const { checkforOverlap, checkWhetherSameDate, uploadFilesToS3, createRecurringApplications } = require('../services/common/applicationHelper');
const { fetchSubordinates } = require('../services/common/employeeHelper');
const { scheduleHasNotPassedCurrentDay } = require('../services/common/scheduleHelper');
const { Op } = require('sequelize');
const moment = require('moment');
const { sequelize } = require('../services/database/mysql');

const { uploadFile } = require('../services/uploads/s3');

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
                    status: application.status,
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

                const today = new Date();
                if (subApplicationRes && subApplicationRes.length > 0) {
                    subResponse.pendingApplications = subApplicationRes
                        .filter(application => new Date(application.start_date) > today)
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

// POST function - to create new application
const createNewApplication = async (req, res, next) => {
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
                start_date: {
                    [Op.between]: [startDate, endDate]
                },
                end_date: {
                    [Op.between]: [startDate, endDate]
                },
                created_by: employeeInfo.reporting_manager
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
                        start_date: {
                            [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                        },
                        end_date: {
                            [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                        },
                        created_by: employeeInfo.reporting_manager
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
        return res.status(201).json({ message: "New application successfully created.", result: newApplication })
    } catch (error) {
        await transaction.rollback();
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
    let { application_id } = req.body;
    const transaction = await sequelize.transaction();
    try {
        let application = await Application.findByPk(application_id);
        if (application == null)
            return res.status(404).json({ message: "Application not found" });
        else if (application.status !== "Approved")
            return res.status(400).json({ message: "Application is not in Approved status" });
        else if (scheduleHasNotPassedCurrentDay(application.start_date))
            return res.status(400).json({ message: "Cannot withdraw application which has started" });
        let requestor = await Employee.findByPk(application.created_by);
        let approver = await Employee.findByPk(req.user.id);
        if (requestor.reporting_manager != approver.id)
            return res.status(400).json({ message: "Only the direct reporting manager can withdraw this application" });
        let linkedSchedule = await Schedule.findOne({
            where: {
                start_date: application.start_date,
                end_date: application.end_date,
                created_by: requestor.id,
                schedule_type: application.application_type,
            }
        });
        if (linkedSchedule == null)
            return res.status(404).json({ message: "Linked schedule not found" });
        application.status = "Withdrawn";
        application.last_update_by = req.user.id;
        await application.save({ transaction });
        await linkedSchedule.destroy({ transaction });
        await transaction.commit();
        return res.status(200).json({ message: "Approved Application withdrawn successfully" });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: "An error occurred while withdrawing the approved application", error });
    }
};


// DELETE - to delete approved application from Application table
const withdrawApprovedApplicationByEmployee = async (req, res) => {
    try {
        let { application_id } = req.body;
        let applicationInfo = await Application.findByPk(application_id);
        const transaction = await sequelize.transaction();

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

        applicationInfo.status = "Withdrawn";
        applicationInfo.last_update_by = req.user.id;
        await applicationInfo.save({ transaction })
        await linkedSchedule.destroy({ transaction })
        await transaction.commit();

        return res.status(200).json({ message: "Approved application withdrawn successfully" });
    } catch (error) {
        console.error("Error withdrawing application:", error);
        return res.status(500).json({ error: "An error occurred while withdrawing application." });
    }
}


// PATCH function - to update an existing pending application
const updatePendingApplication = async (req, res, next) => {
    try {
        console.log(req.body);
        const {
            application_id,
            application_type,
            originalStartDate,
            originalEndDate,
            newStartDate,
            newEndDate,
            requestor_remarks,
            recurrence_rule,
            recurrence_end_date
        } = req.body || {};

        const files = req.files;
        let employeeInfo = await Employee.findByPk(req.user.id);

        // Check if employee exists
        if (!employeeInfo) {
            return res.status(404).json({ message: "Employee not found. Please refresh and submit your application again" });
        }

        // Check if reporting manager exists
        let reportingManager = employeeInfo.reporting_manager;
        if (!reportingManager) {
            return res.status(404).json({ message: "Reporting Manager not found. Please refresh and submit your application again" });
        }

        // Validate application_id
        if (!application_id) {
            return res.status(400).json({ message: "Application ID is required for updates. Please refresh and submit your application again" });
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

        const updateApplication = await application.save();

        // Upload files if provided
        if (files && files.length > 0) {
            await uploadFilesToS3(files, updateApplication.application_id, employeeInfo.id);
        }

        // Handle recurring applications for regular type
        if (application_type === "Regular" && recurrence_rule && recurrence_end_date) {
            await createRecurringApplications(recurrence_rule, newStartDate, newEndDate, recurrence_end_date, requestor_remarks, req.user.id);
        }

        console.log("Updated Application:", application);

        return res.status(200).json({ message: "Pending application successfully updated.", result: application });
    } catch (error) {
        console.error("Error updating pending application:", error);
        return res.status(500).json({ error: "An error occurred while updating the application." });
    }
};

//PATCH function - to update an existing approved application
const updateApprovedApplication = async(req, res, next) => {
    let { application_id, application_type, originalStartDate, originalEndDate, newStartDate, newEndDate, requestor_remarks, recurrence_rule, recurrence_end_date} = req.body;
    const transaction = await sequelize.transaction();
    try{
        //get request from frontend on user changes.
        console.log(req.body);
        

        if (!application_id) {
            return res.status(400).json({ message: "Application ID is required for updates. Please refresh and submit your application again" });
        }

        console.log("first 400 status passed");

        const files = req.files;
        let employeeInfo = await Employee.findByPk(req.user.id);

        // Check if employee exists
        if (!employeeInfo) {
            return res.status(404).json({ message: "Employee not found. Please refresh and submit your application again" });
        }

        // Check if reporting manager exists
        let reportingManager = employeeInfo.reporting_manager;
        if (!reportingManager) {
            return res.status(404).json({ message: "Reporting Manager not found. Please refresh and submit your application again" });
        }

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

        console.log("existingPending:", JSON.stringify(existingPending, null, 2));

        // Retrieve approved applications based on user id
        let approvedApplications = await Schedule.findAll({
            where: {
                created_by: req.user.id
            }
        });

        console.log("approvedApplications:", approvedApplications);

        // Check for overlaps in existing pending and approved applications
        let existingPendingRes = await checkforOverlap(newStartDate, newEndDate, existingPending, 'existing');
        console.log("existing: ", existingPendingRes);

        let approvedApplicationRes = await checkforOverlap(newStartDate, newEndDate, approvedApplications, 'approved');
        console.log("approved: ", approvedApplicationRes);

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

        console.log("application: ", application_type);

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
                        start_date: {
                            [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                        },
                        end_date: {
                            [Op.between]: [currentStartDate.toDate(), currentEndDate.toDate()]
                        },
                        created_by: employeeInfo.reporting_manager
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

        return res.status(201).json({message: "Application has been updated for manager approval"});
    }catch(error) {
        console.error("Error retrieving own schedule:", error);
        return res.status(500).json({ error: "An error occurred while retrieving the schedule." });
    }
}


module.exports = {
    retrieveApplications,
    retrievePendingApplications,
    createNewApplication,
    approvePendingApplication,
    rejectPendingApplication,
    withdrawPendingApplication,
    withdrawApprovedApplication,
    withdrawApprovedApplicationByEmployee,
    updatePendingApplication,
    updateApprovedApplication
}