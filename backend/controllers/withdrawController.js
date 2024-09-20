const { Application, Employee } = require('../models');

const withdrawController = {
    withdrawPendingApplications: async (req, res) => {
        try {
            // Get the staff member's ID from the cookie
            let currentEmployee = await Employee.findByPk(req.user.id);
            
            if (!currentEmployee) {
                return res.status(400).json({ message: 'Employee not found' });
            }
            
            const staffId = currentEmployee.id;

            if (!staffId) {
                return res.status(400).json({ message: 'Staff ID not found' });
            }

            // Find applications with status 'pending' and created by the staff member
            const pendingApplications = await Application.findAll({ 
                where: { 
                    status: 'pending',
                    created_by: staffId
                } 
            });

            // Update status to 'withdrawn' for each pending application
            const updatedApplications = await Promise.all(pendingApplications.map(async (application) => {
                application.status = 'Withdrawn';
                await application.save();
                
                // Print out the now withdrawn request
                console.log('Withdrawn Application:', application);

                return application;
            }));

            // Log the updated applications to the console
            console.log('Updated Applications:', updatedApplications);

            // Send a response with the updated applications
            res.status(200).json({
                message: 'Pending applications updated to withdrawn successfully',
                updatedApplications: updatedApplications
            });
        } catch (error) {
            res.status(500).json({ message: 'An error occurred', error });
        }
    }
};

module.exports = withdrawController;
