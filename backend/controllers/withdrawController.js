const { Application, Employee, Schedule } = require('../models');

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
    },
    
    withdrawApprovedApplication: async (req, res) => {
        try {
            const { schedule_id } = req.body; 
            const managerId = req.user.id; 
    
            // Find the schedule by schedule_id
            const schedule = await Schedule.findOne({
                where: { 
                    schedule_id: schedule_id 
                }
            });
            
            if (!schedule) {
                return res.status(404).json({ message: 'Schedule not found' });
            }
    
            // Find the corresponding application by matching created_by, start_date, and end_date
            const application = await Application.findOne({
                where: {
                    created_by: schedule.created_by,
                    start_date: schedule.start_date,
                    end_date: schedule.end_date,
                    status: 'Approved'
                }
            });
    
            if (!application) {
                return res.status(404).json({ message: 'Application not found or not authorized' });
            }
    
            // Update the application status to 'Withdrawn'
            application.status = 'Withdrawn';
            application.last_update_by = managerId;
            await application.save();
    
            // Delete the corresponding schedule
            await schedule.destroy(); 

            res.status(200).json({
                message: 'Application updated to withdrawn and schedule deleted successfully',
            });
        } catch (error) {
            console.error('Error withdrawing application:', error);
            res.status(500).json({ message: 'An error occurred', error });
        }
    }
    
};

module.exports = withdrawController;

