const { Application } = require('../models');

const withdrawController = {
    withdrawPendingApplications: async (req, res) => {
        try {
            // Find applications with status 'pending'
            const pendingApplications = await Application.findAll({ where: { status: 'pending' } });

            // Log the pending applications to the console
            console.log('Pending Applications:', pendingApplications);

            // Send a response with the pending applications
            res.status(200).json({
                message: 'Pending applications retrieved successfully',
                pendingApplications: pendingApplications
            });
        } catch (error) {
            res.status(500).json({ message: 'An error occurred', error });
        }
    }
};

module.exports = withdrawController;
