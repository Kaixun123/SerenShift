const {
    checkforOverlap,
    checkWhetherSameDate,
    splitConsecutivePeriodByDay,
    extractRemainingDates,
    updateFileDetails,
    generateNewFileName,
    sendNotificationEmail,
    uploadFilesToS3
} = require('./applicationHelper');
const { splitScheduleByDate } = require('./scheduleHelper');
const { uploadFile, checkFileExists } = require('../uploads/s3');
const { File } = require('../../models');
const { send_email } = require('../email/emailService');
const moment = require('moment');

// Mock dependencies
jest.mock('./scheduleHelper', () => ({
    splitScheduleByDate: jest.fn(),
}));

jest.mock('../uploads/s3', () => ({
    uploadFile: jest.fn(),
    checkFileExists: jest.fn(),
}));

jest.mock('../email/emailService', () => ({
    send_email: jest.fn(),
}));

jest.mock('../../models', () => ({
    File: {
        update: jest.fn(),
        create: jest.fn(),
    },
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

            // Mock `splitScheduleByDate` to return different blocks for new date and existing data
            splitScheduleByDate.mockImplementation((startDate) => {
                if (startDate === newStartDate) {
                    return [
                        { date: '2024-10-03', start_time: '08:00', end_time: '17:00' },
                        { date: '2024-10-04', start_time: '08:00', end_time: '17:00' }
                    ];
                } else if (startDate === dataArray[0].start_date) {
                    return [
                        { date: '2024-10-01', start_time: '08:00', end_time: '17:00' }
                    ];
                }
            });

            const result = await checkforOverlap(newStartDate, newEndDate, dataArray, 'existing');
            expect(result).toBe(false);
            expect(splitScheduleByDate).toHaveBeenCalledTimes(3);
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

    describe('uploadFilesToS3', () => {
        it('should upload files to S3 if files are provided', async () => {
            const files = [
                { filename: 'file1.txt' },
                { filename: 'file2.txt' }
            ];
            const userId = 1;
            const applicationId = 1;

            uploadFile.mockResolvedValue(true);

            await uploadFilesToS3(files, applicationId, userId);

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

    describe('extractRemainingDates', () => {
        it('should return remaining dates after withdrawal dates are removed', () => {
            const existingMoments = [moment('2024-10-01'), moment('2024-10-02'), moment('2024-10-03')];
            const withdrawMoments = ['2024-10-02'];

            const result = extractRemainingDates(existingMoments, withdrawMoments);

            expect(result).toEqual([
                [existingMoments[0]],  // '2024-10-01'
                [existingMoments[2]],  // '2024-10-03'
            ]);
        });

        it('should return an empty array if all dates are withdrawn', () => {
            const existingMoments = [moment('2024-10-01'), moment('2024-10-02')];
            const withdrawMoments = ['2024-10-01', '2024-10-02'];

            const result = extractRemainingDates(existingMoments, withdrawMoments);

            expect(result).toEqual([]);
        });
    });

    describe('splitConsecutivePeriodByDay', () => {
        it('should split a period into consecutive days', () => {
            const startDate = '2024-10-01';
            const endDate = '2024-10-03';

            const result = splitConsecutivePeriodByDay(startDate, endDate);

            expect(result).toEqual(['2024-10-01', '2024-10-02', '2024-10-03']);
        });

        it('should return an empty array if dates are invalid', () => {
            const startDate = 'invalid-date';
            const endDate = 'another-invalid-date';

            const result = splitConsecutivePeriodByDay(startDate, endDate);

            expect(result).toEqual([]);
        });
    });

    describe('updateFileDetails', () => {
        it('should update file details if file exists and is not the first block', async () => {
            checkFileExists.mockResolvedValue(true);

            await updateFileDetails(1, 101, 's3-key', { file_name: 'file.txt', file_extension: 'txt', created_by: 1 }, false);

            expect(File.update).toHaveBeenCalledWith(
                {
                    related_entity_id: 101,
                    s3_key: 's3-key',
                },
                {
                    where: { file_id: 1 },
                }
            );
        });

        it('should create a new file row if file does not exist or is the first block', async () => {
            checkFileExists.mockResolvedValue(false);

            await updateFileDetails(1, 101, 's3-key', { file_name: 'file.txt', file_extension: 'txt', created_by: 1 }, true);

            expect(File.create).toHaveBeenCalledWith({
                related_entity_id: 101,
                s3_key: 's3-key',
                file_name: 'file.txt',
                file_extension: 'txt',
                related_entity: "Application",
                created_by: 1,
                last_update_by: 1,
            });
        });
    });

    describe('generateNewFileName', () => {
        it('should generate a new file name with the expected format', () => {
            // Mock the current date to a specific fixed date
            const mockDate = new Date('2024-11-07T08:20:36.435Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

            const result = generateNewFileName('report_file', 1, 101, 'pdf');
            expect(result).toBe('report_1_101_20241107T082036435Z.pdf');

            // Restore the original Date function after the test
            jest.restoreAllMocks();
        });
    });

    describe('sendNotificationEmail', () => {
        it('should send an email with the correct subject and message', async () => {
            const application = { start_date: '2024-10-01', end_date: '2024-10-03', requestor_remarks: 'Need approval' };
            const requestor = { first_name: 'John', last_name: 'Doe' };
            const recipient = { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' };
            const eventType = 'createApplication';

            await sendNotificationEmail(application, requestor, recipient, eventType, null, null);

            expect(send_email).toHaveBeenCalledWith(
                'jane@example.com',
                'A WFH application is pending your approval',
                'Hi Jane Smith,\n\nYou have a pending Work From Home Request from John Doe. Kindly review and make your decision at your earlier convinence.\n\nRequested WFH Start Period: 01/10/2024\nRequested WFH End Period: 03/10/2024\nRemarks: Need approval\n\nThank You,\nSerenShift\n\nThis is an automated email notification, please do not reply to this email", "jane@example.com',
                null,
            );
        });

        it('should log an error if a required parameter is missing', async () => {
            console.error = jest.fn();

            await sendNotificationEmail(null, null, null, null, null, null);

            expect(console.error).toHaveBeenCalledWith("One or more of the required parameters are missing");
        });
    });
});
