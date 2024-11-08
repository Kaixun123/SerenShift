// Import dependencies
const scheduler = require('node-schedule');
const { Application, Employee } = require('../models');
const { sequelize } = require('../services/database/mysql');
const { sendNotificationEmail } = require('../services/common/applicationHelper');

// Import the job to be tested
const job = require('./housekeepApplications');

// Mock dependencies
jest.mock('../models', () => ({
    Application: { findAll: jest.fn(), save: jest.fn() },
    Employee: { findByPk: jest.fn() }
}));

jest.mock('../services/database/mysql', () => ({
    sequelize: { transaction: jest.fn() }
}));

jest.mock('../services/common/applicationHelper', () => ({
    sendNotificationEmail: jest.fn()
}));

describe('Housekeep Pending Applications Job', () => {
    let transaction;
    let commitMock, rollbackMock;

    beforeEach(() => {
        // Set up mock transaction
        commitMock = jest.fn();
        rollbackMock = jest.fn();
        transaction = { commit: commitMock, rollback: rollbackMock };
        sequelize.transaction.mockResolvedValue(transaction);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should reject pending applications past start date and commit transaction', async () => {
        // Mock data for applications and employees
        const mockApplications = [
            { id: 1, start_date: new Date('2023-01-01'), status: 'Pending', created_by: 1, save: jest.fn() },
            { id: 2, start_date: new Date('2023-01-01'), status: 'Pending', created_by: 2, save: jest.fn() }
        ];
        const mockRequester = { id: 1, reporting_manager: 2 };
        const mockApprover = { id: 2 };

        // Mock Application.findAll to return applications past start date
        Application.findAll.mockResolvedValue(mockApplications);
        // Mock Employee.findByPk to return the requester and approver
        Employee.findByPk
            .mockResolvedValueOnce(mockRequester)
            .mockResolvedValueOnce(mockApprover);

        // Run the job
        await job.invoke();

        // Assertions for Application.findAll
        expect(Application.findAll).toHaveBeenCalledWith({
            where: {
                status: 'Pending',
                start_date: expect.any(Object)
            }
        });

        // Assertions for changing application status and saving
        mockApplications.forEach(app => {
            expect(app.status).toBe('Rejected');
            expect(app.save).toHaveBeenCalledWith({ transaction });
        });

        // Commit should be called
        expect(commitMock).toHaveBeenCalled();

        // Assertions for sending notification emails
        mockApplications.forEach(app => {
            expect(Employee.findByPk).toHaveBeenCalledWith(app.created_by);
            expect(sendNotificationEmail).toHaveBeenCalledWith(
                app,
                mockRequester,
                mockApprover,
                'autoRejectedApplication'
            );
        });
    });

    test('should rollback transaction on error', async () => {
        // Mock Application.findAll to throw an error
        Application.findAll.mockRejectedValue(new Error('Database error'));

        // Run the job
        await job.invoke();

        // Rollback should be called in case of error
        expect(rollbackMock).toHaveBeenCalled();
        expect(commitMock).not.toHaveBeenCalled();
    });
});
