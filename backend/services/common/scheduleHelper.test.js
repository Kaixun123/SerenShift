const moment = require('moment');
const { splitScheduleByDate, scheduleHasNotPassedCurrentDay, scheduleIsAfterCurrentTime, deleteCorrespondingSchedule } = require('./scheduleHelper');
const { Schedule } = require('../../models');

// Mocking Schedule model for database operations
jest.mock('../../models', () => ({
    Schedule: {
        findOne: jest.fn(),
    },
}));

describe('splitScheduleByDate', () => {
    it('should return a full day block for same-day 09:00 to 18:00 range', async () => {
        const result = await splitScheduleByDate('2023-11-08T09:00:00', '2023-11-08T18:00:00');
        expect(result).toEqual([
            { date: '2023-11-08', period: 'Full Day', start_time: '09:00:00', end_time: '18:00:00' }
        ]);
    });

    it('should return an AM block for 09:00 to 13:00 range on the same day', async () => {
        const result = await splitScheduleByDate('2023-11-08T09:00:00', '2023-11-08T13:00:00');
        expect(result).toEqual([
            { date: '2023-11-08', period: 'AM', start_time: '09:00:00', end_time: '13:00:00' }
        ]);
    });

    it('should return Partial Day if time does not match specific blocks', async () => {
        const result = await splitScheduleByDate('2023-11-08T10:00:00', '2023-11-08T12:00:00');
        expect(result).toEqual([
            { date: '2023-11-08', period: 'Partial Day', start_time: '10:00:00', end_time: '12:00:00' }
        ]);
    });
});

describe('scheduleHasNotPassedCurrentDay', () => {
    it('should return true if the date is today or in the past', () => {
        const today = new Date();
        expect(scheduleHasNotPassedCurrentDay(today)).toBe(true);

        const pastDate = new Date('2022-01-01');
        expect(scheduleHasNotPassedCurrentDay(pastDate)).toBe(true);
    });

    it('should return false if the date is in the future', () => {
        const futureDate = new Date(new Date().setDate(new Date().getDate() + 1));
        expect(scheduleHasNotPassedCurrentDay(futureDate)).toBe(false);
    });
});

describe('scheduleIsAfterCurrentTime', () => {
    it('should return true if the date is in the future', () => {
        const futureDate = new Date(new Date().getTime() + 10000);  // 10 seconds from now
        expect(scheduleIsAfterCurrentTime(futureDate.toISOString())).toBe(true);
    });

    it('should return false if the date is in the past', () => {
        const pastDate = new Date(new Date().getTime() - 10000);  // 10 seconds ago
        expect(scheduleIsAfterCurrentTime(pastDate.toISOString())).toBe(false);
    });
});

describe('deleteCorrespondingSchedule', () => {
    it('should return true if the schedule is found and deleted', async () => {
        Schedule.findOne.mockResolvedValue({ destroy: jest.fn().mockResolvedValue(true) });
        const application = { created_by: 1, start_date: '2023-11-08', end_date: '2023-11-09' };
        const result = await deleteCorrespondingSchedule(application);
        expect(result).toBe(true);
    });

    it('should return false if the schedule is not found', async () => {
        Schedule.findOne.mockResolvedValue(null);
        const application = { created_by: 1, start_date: '2023-11-08', end_date: '2023-11-09' };
        const result = await deleteCorrespondingSchedule(application);
        expect(result).toBe(false);
    });

    it('should return false if an error occurs during the deletion process', async () => {
        Schedule.findOne.mockRejectedValue(new Error('Database error'));
        const application = { created_by: 1, start_date: '2023-11-08', end_date: '2023-11-09' };
        const result = await deleteCorrespondingSchedule(application);
        expect(result).toBe(false);
    });
});
