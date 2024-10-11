const { Application, Employee, Schedule } = require('../models');
const { checkforOverlap, checkWhetherSameDate, splitDatesByDay } = require('../services/common/applicationHelper');
const { fetchSubordinates } = require('../services/common/employeeHelper');
const { scheduleHasNotPassedCurrentDay } = require('../services/common/scheduleHelper');
const { Op } = require('sequelize');

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

// GET Function - retrieve pending applications - inherited from managerController.js
const retrievePendingApplication = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let subordinates = await fetchSubordinates(userId);

        let response = await Promise.all(
            subordinates.map(async sub => {

                let subApplicationRes = await Application.findAll({
                    where: {
                        created_by: sub.user_id
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
                        linked_application: application.linked_application,
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
    try {
        let { application_type, start_date, end_date, requestor_remarks } = req.body
        let employeeInfo = await Employee.findByPk(req.user.id);
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
            created_by: employeeInfo.id,
            last_update_by: employeeInfo.id,
            status: "Pending",
            requestor_remarks: requestor_remarks,
        })

        return res.status(201).json({ message: "New application successfully created.", result: newApplication })
    } catch (error) {
        console.error("Error creating new application:", error);
        return res.status(500).json({ error: "An error occurred while creating new application." });
    }
}

// PUT function - to update application status to approved - inherited from managerController.js
const approvePendingApplication = async (req, res) => {
    let { application_id, approvedDates, approverRemarks } = req.body;
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
            return res.status(400).json({ message: "Conflicting schedule found" });
        if (application.linkedApplication == null) {
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
        } else if (application.linkedApplication != null && (approvedDates == null || approvedDates.length == 0))
            return res.status(400).json({ message: "You need to specify the approved dates for multiple linked applications" });
        else {
            let currentApplication = application;
            let bulkInsertSchedules = [];
            let approvedDatesObjects = approvedDates.map(date => new Date(date));
            while (currentApplication != null) {
                if (currentApplication.status != "Pending")
                    return res.status(400).json({ message: "All linked applications must be in Pending status" });
                else if (scheduleHasNotPassedCurrentDay(currentApplication.start_date))
                    return res.status(400).json({ message: "Cannot approve a linked application which had started" });
                else if (currentApplication.created_by != requestor.id)
                    return res.status(400).json({ message: "This linked application is linked to a different requestor" });
                else if (currentApplication.created_by == requestor.id && approver.id != requestor.reporting_manager)
                    return res.status(400).json({ message: "Only the direct reporting manager can approve this linked applications" });
                let conflictingSchedule = await Schedule.findAll({
                    where: {
                        start_date: {
                            [Op.between]: [currentApplication.start_date, currentApplication.end_date]
                        },
                        end_date: {
                            [Op.between]: [currentApplication.start_date, currentApplication.end_date]
                        },
                        created_by: requestor.id
                    }
                });
                if (conflictingSchedule.length > 0)
                    return res.status(400).json({ message: "Conflicting schedule found for a linked application" });
                if (approvedDatesObjects.some(date => checkWhetherSameDate(date, currentApplication.start_date))) {
                    currentApplication.status = "Approved";
                    currentApplication.verify_by = req.user.id;
                    currentApplication.verify_timestamp = new Date();
                    currentApplication.last_update_by = req.user.id;
                    currentApplication.approver_remarks = approverRemarks;
                    await currentApplication.save({ transaction });
                    let newSchedule = Schedule.build({
                        start_date: currentApplication.start_date,
                        end_date: currentApplication.end_date,
                        created_by: requestor.id,
                        schedule_type: currentApplication.application_type,
                        verify_by: req.user.id,
                        verify_timestamp: new Date(),
                        last_update_by: req.user.id
                    });
                    bulkInsertSchedules.push(newSchedule);
                    approvedDatesObjects = approvedDatesObjects.filter(date => !checkWhetherSameDate(date, currentApplication.start_date));
                    if (currentApplication.linked_application == null)
                        break;
                    else
                        currentApplication = await Application.findByPk(currentApplication.linked_application);
                } else {
                    currentApplication.status = "Rejected";
                    currentApplication.last_update_by = req.user.id;
                    currentApplication.approver_remarks = approverRemarks;
                    await currentApplication.save({ transaction });
                    if (currentApplication.linked_application == null)
                        break;
                    else
                        currentApplication = await Application.findByPk(currentApplication.linked_application);
                }
            }
            if (approvedDatesObjects.length > 0)
                return res.status(400).json({ message: "Some approved dates do not match any linked applications" });
            await Schedule.bulkCreate(bulkInsertSchedules, { transaction });
            await transaction.commit();
            return res.status(200).json({ message: "Applications processed successfully" });
        }
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
        if (application.linked_application == null) {
            application.status = "Rejected";
            application.last_update_by = req.user.id;
            application.approver_remarks = approverRemarks;
            await application.save({ transaction });
            await transaction.commit();
            return res.status(200).json({ message: "Application rejected successfully" });
        } else {
            let currentApplication = application;
            while (currentApplication != null) {
                if (currentApplication.status != "Pending")
                    return res.status(400).json({ message: "All linked applications must be in Pending status" });
                else if (scheduleHasNotPassedCurrentDay(currentApplication.start_date))
                    return res.status(400).json({ message: "Cannot reject a linked application which has started" });
                else if (currentApplication.created_by != requestor.id)
                    return res.status(400).json({ message: "This linked application is linked to a different requestor" });
                else if (currentApplication.created_by == requestor.id && approver.id != requestor.reporting_manager)
                    return res.status(400).json({ message: "Only the direct reporting manager can reject this linked applications" });
                currentApplication.status = "Rejected";
                currentApplication.last_update_by = req.user.id;
                currentApplication.approver_remarks = approverRemarks;
                await currentApplication.save({ transaction });
                if (currentApplication.linked_application == null)
                    break;
                else
                    currentApplication = await Application.findByPk(currentApplication.linked_application);
            }
            await transaction.commit();
            return res.status(200).json({ message: "Applications rejected successfully" });
        }
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: "An error occurred while rejecting the application", error });
    }
};

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
        const { applicationId } = req.body;

        // Find the application with the given ID, status 'pending', and created by the staff member
        const application = await Application.findOne({
            where: {
                application_id: applicationId,
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

const withdrawApprovedApplication = async (req, res) => {
    let { application_id, rejectedDates } = req.body;
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
                verify_by: req.user.id,
            }
        });
        if (linkedSchedule == null)
            return res.status(404).json({ message: "Linked schedule not found" });
        if (application.linked_application == null) {
            application.status = "Withdrawn";
            application.last_update_by = req.user.id;
            await application.save({ transaction });
            await linkedSchedule.destroy({ transaction });
            await transaction.commit();
            return res.status(200).json({ message: "Approved Application withdrawn successfully" });
        } else if (application.linkedApplication != null && rejectedDates != null && rejectedDates.length > 0) {
            let currentApplication = application;
            let rejectedDatesObjects = rejectedDates.map(date => new Date(date));
            while (currentApplication != null) {
                if (currentApplication.status != "Approved")
                    return res.status(400).json({ message: "All linked applications must be in Approved status" });
                else if (scheduleHasNotPassedCurrentDay(currentApplication.start_date))
                    return res.status(400).json({ message: "Cannot withdraw a linked application which has started" });
                else if (currentApplication.created_by != requestor.id)
                    return res.status(400).json({ message: "This linked application is linked to a different requestor" });
                else if (currentApplication.created_by == requestor.id && approver.id != requestor.reporting_manager)
                    return res.status(400).json({ message: "Only the direct reporting manager can withdraw this linked applications" });
                if (rejectedDatesObjects.some(date => checkWhetherSameDate(date, currentApplication.start_date))) {
                    currentApplication.status = "Withdrawn";
                    currentApplication.last_update_by = req.user.id;
                    await currentApplication.save({ transaction });
                    let linkedSchedule = await Schedule.findOne({
                        where: {
                            start_date: currentApplication.start_date,
                            end_date: currentApplication.end_date,
                            created_by: requestor.id,
                            schedule_type: currentApplication.application_type,
                            verify_by: req.user.id,
                        }
                    });
                    if (linkedSchedule == null)
                        return res.status(404).json({ message: "Linked schedule not found for a linked application" });
                    await linkedSchedule.destroy({ transaction });
                    rejectedDatesObjects = rejectedDatesObjects.filter(date => !checkWhetherSameDate(date, currentApplication.start_date));
                    if (currentApplication.linked_application == null)
                        break;
                    else
                        currentApplication = await Application.findByPk(currentApplication.linked_application);
                } else {
                    currentApplication.status = "Withdrawn";
                    currentApplication.last_update_by = req.user.id;
                    await currentApplication.save({ transaction });
                    let linkedSchedule = await Schedule.findOne({
                        where: {
                            start_date: currentApplication.start_date,
                            end_date: currentApplication.end_date,
                            created_by: requestor.id,
                            schedule_type: currentApplication.application_type,
                            verify_by: req.user.id,
                        }
                    });
                    if (linkedSchedule == null)
                        return res.status(404).json({ message: "Linked schedule not found for a linked application" });
                    await linkedSchedule.destroy({ transaction });
                    if (currentApplication.linked_application == null)
                        break;
                    else
                        currentApplication = await Application.findByPk(currentApplication.linked_application);
                }
            }
            if (rejectedDatesObjects.length > 0)
                return res.status(400).json({ message: "Some rejected dates do not match any linked applications" });
            await transaction.commit();
            return res.status(200).json({ message: "Applications processed successfully" });
        } else {
            let currentApplication = application;
            while (currentApplication != null) {
                if (currentApplication.status != "Approved")
                    return res.status(400).json({ message: "All linked applications must be in Approved status" });
                else if (scheduleHasNotPassedCurrentDay(currentApplication.start_date))
                    return res.status(400).json({ message: "Cannot withdraw a linked application which has started" });
                else if (currentApplication.created_by != requestor.id)
                    return res.status(400).json({ message: "This linked application is linked to a different requestor" });
                else if (currentApplication.created_by == requestor.id && approver.id != requestor.reporting_manager)
                    return res.status(400).json({ message: "Only the direct reporting manager can withdraw this linked applications" });
                currentApplication.status = "Withdrawn";
                currentApplication.last_update_by = req.user.id;
                await currentApplication.save({ transaction });
                let linkedSchedule = await Schedule.findOne({
                    where: {
                        start_date: currentApplication.start_date,
                        end_date: currentApplication.end_date,
                        created_by: requestor.id,
                        schedule_type: currentApplication.application_type,
                        verify_by: req.user.id,
                    }
                });
                if (linkedSchedule == null)
                    return res.status(404).json({ message: "Linked schedule not found for a linked application" });
                await linkedSchedule.destroy({ transaction });
                if (currentApplication.linked_application == null)
                    break;
                else
                    currentApplication = await Application.findByPk(currentApplication.linked_application);
            }
            await transaction.commit();
            return res.status(200).json({ message: "Applications withdrawn successfully" });
        }
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: "An error occurred while withdrawing the approved application", error });
    }
};

module.exports = {
    retrieveApplication,
    retrievePendingApplication,
    createNewApplication,
    approvePendingApplication,
    rejectPendingApplication,
    withdrawPendingApplication,
    withdrawApprovedApplication,
}