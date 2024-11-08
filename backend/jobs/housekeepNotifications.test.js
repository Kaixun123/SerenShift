// Import dependencies
const scheduler = require('node-schedule');
const { Notification } = require('../models');
const { sequelize } = require('../services/database/mysql');

// Import the job to be tested
const job = require('./housekeepNotifications');

// Mock dependencies
jest.mock('../models', () => ({
    Notification: { findAll: jest.fn() }
}));

jest.mock('../services/database/mysql', () => ({
    sequelize: { transaction: jest.fn() }
}));

describe('Housekeep Notifications Job', () => {
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

    test('should delete read notifications older than one year and commit transaction', async () => {
        // Mock notifications that should be deleted
        const mockNotifications = [
            { notification_id: 1, destroy: jest.fn() },
            { notification_id: 2, destroy: jest.fn() }
        ];

        // Mock Notification.findAll to return read notifications older than a year
        Notification.findAll.mockResolvedValue(mockNotifications);

        // Run the job
        await job.invoke();

        // Check that Notification.findAll was called with the correct criteria
        expect(Notification.findAll).toHaveBeenCalledWith({
            where: {
                read_status: true,
                created_timestamp: expect.any(Object), // Matcher to check date condition
                paranoid: false
            }
        });

        // Check that each notification's destroy method was called with the transaction
        mockNotifications.forEach(notification => {
            expect(notification.destroy).toHaveBeenCalledWith({ force: true, transaction });
        });

        // Verify the transaction commit
        expect(commitMock).toHaveBeenCalled();
    });

    test('should rollback transaction on error', async () => {
        // Mock Notification.findAll to throw an error
        Notification.findAll.mockRejectedValue(new Error('Database error'));

        // Run the job
        await job.invoke();

        // Verify that the transaction was rolled back due to the error
        expect(rollbackMock).toHaveBeenCalled();
        expect(commitMock).not.toHaveBeenCalled();
    });
});
