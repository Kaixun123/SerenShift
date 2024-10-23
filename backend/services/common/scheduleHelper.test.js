const { splitScheduleByDate, scheduleHasNotPassedCurrentDay } = require('./scheduleHelper');
const moment = require('moment');

describe('Schedule Helper', () => {

    describe('splitScheduleByDate', () => {
        it('should correctly split a full-day schedule', async () => {
            const startDate = '2024-10-01T09:00:00';
            const endDate = '2024-10-01T18:00:00';

            const result = await splitScheduleByDate(startDate, endDate);

            expect(result).toEqual([
                {
                    date: '2024-10-01',
                    period: 'Full Day',
                    start_time: '09:00:00',
                    end_time: '18:00:00'
                }
            ]);
        });

        it('should correctly split an AM block', async () => {
            const startDate = '2024-10-01T09:00:00';
            const endDate = '2024-10-01T13:00:00';

            const result = await splitScheduleByDate(startDate, endDate);

            expect(result).toEqual([
                {
                    date: '2024-10-01',
                    period: 'AM',
                    start_time: '09:00:00',
                    end_time: '13:00:00'
                }
            ]);
        });

        it('should correctly split a PM block', async () => {
            const startDate = '2024-10-01T14:00:00';
            const endDate = '2024-10-01T18:00:00';

            const result = await splitScheduleByDate(startDate, endDate);

            expect(result).toEqual([
                {
                    date: '2024-10-01',
                    period: 'PM',
                    start_time: '14:00:00',
                    end_time: '18:00:00'
                }
            ]);
        });

        it('should correctly split a schedule spanning multiple days', async () => {
            const startDate = '2024-10-01T09:00:00';
            const endDate = '2024-10-03T18:00:00';

            const result = await splitScheduleByDate(startDate, endDate);

            expect(result).toEqual([
                {
                    date: '2024-10-01',
                    period: 'Full Day',
                    start_time: '09:00:00',
                    end_time: '18:00:00'
                },
                {
                    date: '2024-10-02',
                    period: 'Full Day',
                    start_time: '09:00:00',
                    end_time: '18:00:00'
                },
                {
                    date: '2024-10-03',
                    period: 'Full Day',
                    start_time: '09:00:00',
                    end_time: '18:00:00'
                }
            ]);
        });

        it('should correctly split a partial day schedule', async () => {
            const startDate = '2024-10-01T09:00:00';
            const endDate = '2024-10-01T12:00:00';

            const result = await splitScheduleByDate(startDate, endDate);

            expect(result).toEqual([
                {
                    date: '2024-10-01',
                    period: 'Partial Day',
                    start_time: '09:00:00',
                    end_time: '12:00:00'
                }
            ]);
        });

        it('should correctly split a partial day schedule', async () => {
            const startDate = '2024-10-01T07:00:00';
            const endDate = '2024-10-01T12:00:00';

            const result = await splitScheduleByDate(startDate, endDate);

            expect(result).toEqual([
                {
                    date: '2024-10-01',
                    period: 'Partial Day',
                    start_time: '07:00:00',
                    end_time: '12:00:00'
                }
            ]);
        });
        
    });

    describe('scheduleHasNotPassedCurrentDay', () => {
        it('should return true if the schedule date is today or before', () => {
            const today = new Date(); // Current date
            const pastDate = new Date('2024-10-01'); // Past date

            expect(scheduleHasNotPassedCurrentDay(today)).toBe(true); // Today
            expect(scheduleHasNotPassedCurrentDay(pastDate)).toBe(true); // Before today
        });

        it('should return false if the schedule date is after today', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

            expect(scheduleHasNotPassedCurrentDay(futureDate)).toBe(false);
        });
    });
});
