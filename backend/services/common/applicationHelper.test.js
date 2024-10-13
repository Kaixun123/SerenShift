const {
    checkforOverlap,
    checkWhetherSameDate,
    splitDatesByDay,
    uploadFilesToS3
} = require('./applicationHelper');
const { splitScheduleByDate } = require('./scheduleHelper');
const { uploadFile } = require('../uploads/s3');
const moment = require('moment');

// Mock dependencies
jest.mock('./scheduleHelper', () => ({
    splitScheduleByDate: jest.fn()
}));

jest.mock('../uploads/s3', () => ({
    uploadFile: jest.fn()
}));

describe('Application Helper', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('checkforOverlap', () => {
        it('should return true if there is an overlap', async () => {
            const newStartDate = '2024-10-01';
            const newEndDate = '2024-10-02';
            const dataArray = [
                { start_date: '2024-10-01', end_date: '2024-10-01' }
            ];

            splitScheduleByDate.mockResolvedValue([
                { date: '2024-10-01', start_time: '08:00', end_time: '17:00' }
            ]);

            const result = await checkforOverlap(newStartDate, newEndDate, dataArray, 'existing');
            expect(result).toBe(true);
            expect(splitScheduleByDate).toHaveBeenCalledTimes(2);
        });

        it('should return false if there is no overlap', async () => {
            const newStartDate = '2024-10-03';
            const newEndDate = '2024-10-04';
            const dataArray = [
                { start_date: '2024-10-01', end_date: '2024-10-01' }
            ];

            splitScheduleByDate.mockResolvedValue([
                { date: '2024-10-01', start_time: '08:00', end_time: '17:00' }
            ]);

            const result = await checkforOverlap(newStartDate, newEndDate, dataArray, 'existing');
            expect(result).toBe(false);
            expect(splitScheduleByDate).toHaveBeenCalledTimes(2);
        });

        it('should throw an error if splitScheduleByDate fails', async () => {
            const newStartDate = '2024-10-01';
            const newEndDate = '2024-10-02';
            const dataArray = [{ start_date: '2024-10-01', end_date: '2024-10-02' }];

            splitScheduleByDate.mockRejectedValue(new Error('splitScheduleByDate error'));

            await expect(checkforOverlap(newStartDate, newEndDate, dataArray, 'existing')).rejects.toThrow('Error fetching existing application.');
        });
    });

    describe('checkWhetherSameDate', () => {
        it('should return true if two dates are the same', () => {
            const date1 = new Date('2024-10-01T08:00:00');
            const date2 = new Date('2024-10-01T17:00:00');

            const result = checkWhetherSameDate(date1, date2);
            expect(result).toBe(true);
        });

        it('should return false if two dates are not the same', () => {
            const date1 = new Date('2024-10-01T08:00:00');
            const date2 = new Date('2024-10-02T17:00:00');

            const result = checkWhetherSameDate(date1, date2);
            expect(result).toBe(false);
        });
    });

    describe('splitDatesByDay', () => {
        it('should correctly split dates into day ranges', () => {
            const startDate = new Date('2024-10-01T08:00:00');
            const endDate = new Date('2024-10-03T17:00:00');

            const result = splitDatesByDay(startDate, endDate);

            expect(result.length).toBe(3);
            expect(result[0][0].toISOString()).toBe('2024-10-01T08:00:00.000Z');
            expect(result[2][1].toISOString()).toBe('2024-10-03T17:00:00.000Z');
        });
    });

    describe('uploadFilesToS3', () => {
        it('should upload files to S3 if files are provided', async () => {
            const files = [
                { filename: 'file1.txt' },
                { filename: 'file2.txt' }
            ];
            const userId = 1;

            uploadFile.mockResolvedValue(true);

            await uploadFilesToS3(files, userId);

            expect(uploadFile).toHaveBeenCalledTimes(2);
            expect(uploadFile).toHaveBeenCalledWith(files[0], 'application', userId, false, { id: userId });
            expect(uploadFile).toHaveBeenCalledWith(files[1], 'application', userId, false, { id: userId });
        });

        it('should not upload files if no files are provided', async () => {
            const files = [];
            const userId = 1;

            await uploadFilesToS3(files, userId);

            expect(uploadFile).not.toHaveBeenCalled();
        });
    });
});
