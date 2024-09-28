const { splitScheduleByDate } = require('./scheduleHelper');

describe('splitScheduleByDate', () => {
    test('should split schedule into AM block', async () => {
        const startDate = '2023-10-01T09:00:00';
        const endDate = '2023-10-01T13:00:00';
        const result = await splitScheduleByDate(startDate, endDate);
        expect(result).toEqual([
            {
                date: '2023-10-01',
                period: 'AM',
                start_time: '09:00:00',
                end_time: '13:00:00'
            }
        ]);
    });

    test('should split schedule into PM block', async () => {
        const startDate = '2023-10-01T14:00:00';
        const endDate = '2023-10-01T18:00:00';
        const result = await splitScheduleByDate(startDate, endDate);
        expect(result).toEqual([
            {
                date: '2023-10-01',
                period: 'PM',
                start_time: '14:00:00',
                end_time: '18:00:00'
            }
        ]);
    });

    test('should split schedule into Partial Day block', async () => {
        const startDate = '2023-10-01T10:00:00';
        const endDate = '2023-10-01T15:00:00';
        const result = await splitScheduleByDate(startDate, endDate);
        expect(result).toEqual([
            {
                date: '2023-10-01',
                period: 'Partial Day',
                start_time: '10:00:00',
                end_time: '15:00:00'
            }
        ]);
    });

    test('should split schedule into Full Day block', async () => {
        const startDate = '2023-10-01T09:00:00';
        const endDate = '2023-10-01T18:00:00';
        const result = await splitScheduleByDate(startDate, endDate);
        expect(result).toEqual([
            {
                date: '2023-10-01',
                period: 'Full Day',
                start_time: '09:00:00',
                end_time: '18:00:00'
            }
        ]);
    });
});