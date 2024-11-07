// Import dependencies
const scheduler = require('node-schedule');
const { Schedule, Application } = require('../models');
const { sequelize } = require('../services/database/mysql');

// Import the job to be tested
const job = require('./housekeepSchedules');

// Mock dependencies
jest.mock('../models', () => ({
    Schedule: { findAll: jest.fn() },
    Application: { findOne: jest.fn() }
}));

jest.mock('../services/database/mysql', () => ({
    sequelize: { transaction: jest.fn() }
}));

describe('Housekeep Schedules Job', () => {
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

    test('should delete future schedules with no matching application and commit transaction', async () => {
        // Mock schedules to be deleted
        const mockSchedules = [
            { schedule_id: 1, start_date: new Date('2024-12-01'), end_date: new Date('2024-12-10'), created_by: 1, verify_by: 2, destroy: jest.fn() },
            { schedule_id: 2, start_date: new Date('2024-12-05'), end_date: new Date('2024-12-15'), created_by: 2, verify_by: 3, destroy: jest.fn() }
        ];

        // Mock Schedule.findAll to return future schedules
        Schedule.findAll.mockResolvedValue(mockSchedules);

        // Mock Application.findOne to return null (indicating no matching application)
        Application.findOne.mockResolvedValue(null);

        // Run the job
        await job.invoke();

        // Verify Schedule.findAll was called with correct criteria
        expect(Schedule.findAll).toHaveBeenCalledWith({
            where: { start_date: expect.any(Object) } // Date comparison
        });

        // Verify destroy was called for each schedule with no matching application
        mockSchedules.forEach(schedule => {
            expect(schedule.destroy).toHaveBeenCalledWith({ transaction });
        });

        // Commit transaction
        expect(commitMock).toHaveBeenCalled();
    });

    test('should not delete schedules with a matching application', async () => {
        // Mock schedules that should not be deleted due to matching applications
        const mockSchedules = [
            { schedule_id: 3, start_date: new Date('2024-12-01'), end_date: new Date('2024-12-10'), created_by: 3, verify_by: 4, destroy: jest.fn() }
        ];

        // Mock Schedule.findAll to return future schedules
        Schedule.findAll.mockResolvedValue(mockSchedules);

        // Mock Application.findOne to return a matching application
        Application.findOne.mockResolvedValue({ application_id: 1 });

        // Run the job
        await job.invoke();

        // Verify destroy was not called on schedules with a matching application
        mockSchedules.forEach(schedule => {
            expect(schedule.destroy).not.toHaveBeenCalled();
        });

        // Commit transaction
        expect(commitMock).toHaveBeenCalled();
    });

    test('should rollback transaction on error', async () => {
        // Mock Schedule.findAll to throw an error
        Schedule.findAll.mockRejectedValue(new Error('Database error'));

        // Run the job
        await job.invoke();

        // Verify rollback is called due to error
        expect(rollbackMock).toHaveBeenCalled();
        expect(commitMock).not.toHaveBeenCalled();
    });
});
