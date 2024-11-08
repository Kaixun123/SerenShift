// Imports and mocks remain the same
const scheduler = require('node-schedule');
const { Application, Employee } = require('../models');
const { sequelize } = require('../services/database/mysql');
const { sendNotificationEmail } = require('../services/common/applicationHelper');
const job = require('./housekeepApplications');
const { Op } = require('sequelize');

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

        // Mock the date to ensure consistent test results
        jest.useFakeTimers().setSystemTime(new Date('2023-02-01').getTime());
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    test('should reject pending applications past start date and commit transaction', async () => {
        // Mock applications to match the expectations
        const mockApplications = [
            { id: 2, start_date: new Date('2023-01-01'), status: 'Pending', created_by: 2, save: jest.fn() },
            { id: 1, start_date: new Date('2023-01-02'), status: 'Pending', created_by: 1, save: jest.fn() }
        ];

        // Mock employees with clear requester and approver relationships
        const mockRequester = { id: 1, reporting_manager: 2 };
        const mockApprover = { id: 2 };

        // Set up the mock responses for findByPk to handle `created_by` and `reporting_manager` relationships
        Employee.findByPk
            .mockImplementation((id) => {
                if (id === 1) return Promise.resolve(mockRequester); // Requester with id 1
                if (id === 2) return Promise.resolve(mockApprover);   // Approver with id 2
                return Promise.resolve(undefined);                    // Fallback if unexpected id
            });

        // Mock Application.findAll to return our mock applications
        Application.findAll.mockResolvedValue(mockApplications);

        // Run the job
        await job.invoke();

        // Verify Application.findAll was called with the correct filters
        expect(Application.findAll).toHaveBeenCalledWith({
            where: {
                status: 'Pending',
                start_date: { [Op.lt]: expect.any(Date) }
            }
        });

        // Ensure each application was marked as rejected and saved within the transaction
        mockApplications.forEach(app => {
            expect(app.status).toBe('Rejected');
            expect(app.save).toHaveBeenCalledWith({ transaction });
        });

        // Ensure the transaction was committed
        expect(commitMock).toHaveBeenCalled();
    });

    test('should rollback transaction on error', async () => {
        // Mock Application.findAll to throw an error
        Application.findAll.mockRejectedValue(new Error('Database error'));

        // Run the job
        await job.invoke();

        // Ensure rollback was called and commit was not
        expect(rollbackMock).toHaveBeenCalled();
        expect(commitMock).not.toHaveBeenCalled();
    });
});
