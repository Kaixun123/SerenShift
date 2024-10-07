const { Application } = require('../models');
const { fetchSubordinates } = require('../services/common/employeeHelper');

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
    approveApplication,
    rejectApplication
};
