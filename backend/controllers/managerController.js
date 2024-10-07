const { Application } = require('../models');
const { fetchSubordinates } = require('../services/common/employeeHelper');

const retrievePendingApplication = async (req, res, next) => {
    try {

        let { id } = req.query;
        let subordinates = await fetchSubordinates(id);

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

const approveApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentSubordinate = await Application.findByPk(req.body.application_id);
        const subordinates = await fetchSubordinates(userId);

        if (!currentSubordinate) {
            return res.status(400).json({ message: 'Application not found' });
        }

        // Find if the currentSubordinate's creator is in the list of subordinates
        const subordinate = subordinates.find(sub => sub.user_id === currentSubordinate.created_by);

        if (!subordinate) {
            return res.status(400).json({ message: 'Subordinate does not report to you' });
        }

        // Check if the application status is 'Pending'
        if (currentSubordinate.status !== 'Pending') {
            return res.status(404).json({ message: 'Application status is not pending' });
        }

        // Update status to 'Approved'
        currentSubordinate.status = 'Approved';
        await currentSubordinate.save();

        // Log the approved application and respond
        console.log('Approved Application:', currentSubordinate);

        res.status(200).json({
            message: 'Application updated to approved successfully',
            application: currentSubordinate
        });

    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error });
    }
};

const rejectApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentSubordinate = await Application.findByPk(req.body.application_id);
        const subordinates = await fetchSubordinates(userId);

        if (!currentSubordinate) {
            return res.status(400).json({ message: 'Application not found' });
        }

        // Find if the currentSubordinate's creator is in the list of subordinates
        const subordinate = subordinates.find(sub => sub.user_id === currentSubordinate.created_by);

        if (!subordinate) {
            return res.status(400).json({ message: 'Subordinate does not report to you' });
        }

        // Check if the application status is 'Pending'
        if (currentSubordinate.status !== 'Pending') {
            return res.status(404).json({ message: 'Application status is not pending' });
        }

        // Update status to 'Approved'
        currentSubordinate.status = 'Rejected';
        await currentSubordinate.save();

        // Log the approved application and respond
        console.log('Rejected Application:', currentSubordinate);

        res.status(200).json({
            message: 'Application updated to rejected successfully',
            application: currentSubordinate
        });

    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error });
    }
};

module.exports = {
    retrievePendingApplication,
    approveApplication,
    rejectApplication
};
