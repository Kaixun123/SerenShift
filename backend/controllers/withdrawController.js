const { Application, Employee } = require('../models');

const withdrawController = {
    withdrawPendingApplications: async (req, res) => {
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

            if (!applicationId) {
                return res.status(400).json({ message: 'Application ID is required' });
            }

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
    }
};

module.exports = withdrawController;
