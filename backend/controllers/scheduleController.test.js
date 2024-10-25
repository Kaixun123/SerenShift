const {
    retrieveTeamSchedule,
    retrieveSubordinateSchedule,
    retrieveOwnSchedule
} = require('../controllers/scheduleController');
const { Schedule } = require('../models');
const { fetchColleagues, fetchSubordinates } = require('../services/common/employeeHelper');
const { splitScheduleByDate } = require('../services/common/scheduleHelper');

jest.mock('../models', () => ({
    Schedule: {
        findAll: jest.fn()
    }
}));
jest.mock('../services/common/employeeHelper');
jest.mock('../services/common/scheduleHelper');

describe('Schedule Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('retrieveTeamSchedule', () => {
        it('should return WFH schedules for the team', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchColleagues.mockResolvedValue([{ user_id: 2, first_name: 'John', last_name: 'Doe' }]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-10', end_date: '2024-10-10' }]);

            await retrieveTeamSchedule(req, res, next);

            expect(fetchColleagues).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                '2024-10-10': {
                    'Full Day': ['John Doe']
                }
            });
        });

        it('should return 404 if period is partial day', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchColleagues.mockResolvedValue([{ user_id: 2, first_name: 'John', last_name: 'Doe' }]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Partial Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-10', end_date: '2024-10-10' }]);

            await retrieveTeamSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No WFH schedules found for this team." });
        });

        it('should return 404 if date is before start date', async () => {
            const req = { user: { id: 1 }, query: { start_date: '2024-10-12 09:00:00', end_date: '2024-10-13 13:00:00' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchColleagues.mockResolvedValue([{ user_id: 2, first_name: 'John', last_name: 'Doe' }]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-10', end_date: '2024-10-10' }]);

            await retrieveTeamSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No WFH schedules found for this team." });
        });

        it('should return 404 if date is after end date', async () => {
            const req = { user: { id: 1 }, query: { start_date: '2024-10-01 09:00:00', end_date: '2024-10-05 13:00:00' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchColleagues.mockResolvedValue([{ user_id: 2, first_name: 'John', last_name: 'Doe' }]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-10', end_date: '2024-10-10' }]);

            await retrieveTeamSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No WFH schedules found for this team." });
        });

        it('should return 404 if no schedules found', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchColleagues.mockResolvedValue([{ user_id: 2, first_name: 'John', last_name: 'Doe' }]);
            splitScheduleByDate.mockResolvedValue([]);

            await retrieveTeamSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No WFH schedules found for this team." });
        });

        it('should return 500 if an error occurs', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchColleagues.mockRejectedValue(new Error('Database error'));

            await retrieveTeamSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "An error occurred while retrieving the team schedule." });
        });

        it('should return WFH schedules for multiple colleagues', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchColleagues.mockResolvedValue([
                { user_id: 2, first_name: 'John', last_name: 'Doe' },
                { user_id: 3, first_name: 'Jane', last_name: 'Smith' }
            ]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-10', end_date: '2024-10-10' }]);

            await retrieveTeamSchedule(req, res, next);

            expect(fetchColleagues).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                '2024-10-10': {
                    'Full Day': ['John Doe', 'Jane Smith'],
                }
            });
        });

        it('should return WFH schedules for multiple colleagues with same wfh date', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            // Mock fetchColleagues to return two colleagues
            fetchColleagues.mockResolvedValue([
                { user_id: 2, first_name: 'John', last_name: 'Doe' },
                { user_id: 3, first_name: 'Jane', last_name: 'Smith' }
            ]);

            // Mock splitScheduleByDate for both colleagues with the same date
            splitScheduleByDate
                .mockResolvedValueOnce([{ date: '2024-10-10', period: 'Full Day' }])  // John's schedule
                .mockResolvedValueOnce([{ date: '2024-10-10', period: 'Full Day' }]); // Jane's schedule

            // Mock Schedule.findAll to return different start and end dates for each colleague
            Schedule.findAll.mockResolvedValue([
                { start_date: '2024-10-10', end_date: '2024-10-10' },
                { start_date: '2024-10-10', end_date: '2024-10-10' }
            ]);

            await retrieveTeamSchedule(req, res, next);

            expect(fetchColleagues).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                '2024-10-10': {
                    'Full Day': ['John Doe', 'Jane Smith'],
                },
            });
        });

        it('should filter colleagues by the specified colleague_id and return WFH schedules', async () => {
            const req = { user: { id: 1 }, query: { colleague_id: '2' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchColleagues.mockResolvedValue([
                { user_id: 2, first_name: 'John', last_name: 'Doe' },
                { user_id: 3, first_name: 'Jane', last_name: 'Smith' }
            ]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-10', end_date: '2024-10-10' }]);

            await retrieveTeamSchedule(req, res, next);

            expect(fetchColleagues).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                '2024-10-10': {
                    'Full Day': ['John Doe'],
                }
            });
        });
    });

    describe('retrieveSubordinateSchedule', () => {
        it('should return WFH schedules for subordinates', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockResolvedValue([{ user_id: 3, first_name: 'Jane', last_name: 'Smith' }]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-11', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-11', end_date: '2024-10-11' }]);

            await retrieveSubordinateSchedule(req, res, next);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                '2024-10-11': {
                    'Full Day': ['Jane Smith']
                }
            });
        });

        it('should return WFH schedules for multiple subordinates', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockResolvedValue([
                { user_id: 2, first_name: 'John', last_name: 'Doe' },
                { user_id: 3, first_name: 'Jane', last_name: 'Smith' }
            ]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-11', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-11', end_date: '2024-10-11' }]);

            await retrieveSubordinateSchedule(req, res, next);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                '2024-10-11': {
                    'Full Day': ['John Doe', 'Jane Smith']
                }
            });
        });

        it('should return WFH schedules for multiple subordinates with same wfh date', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();
        
            // Clear any existing mocks to avoid contamination from previous tests
            jest.clearAllMocks();
        
            // Mock fetchSubordinates to return two subordinates
            fetchSubordinates.mockResolvedValue([
                { user_id: 2, first_name: 'John', last_name: 'Doe' },
                { user_id: 3, first_name: 'Jane', last_name: 'Smith' }
            ]);
        
            // Return the same date and period for both colleagues in splitScheduleByDate
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Full Day' }]);
        
            // Mock Schedule.findAll to return identical schedules for both subordinates
            Schedule.findAll.mockResolvedValue([
                { start_date: '2024-10-10', end_date: '2024-10-10' },
                { start_date: '2024-10-10', end_date: '2024-10-10' }
            ]);
        
            // Execute the function
            await retrieveSubordinateSchedule(req, res, next);
        
            // Verify expectations
            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                '2024-10-10': {
                    'Full Day': ['John Doe', 'Jane Smith'],
                },
            });
        });
        
        it('should return 404 if no schedules found for subordinates', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockResolvedValue([{ user_id: 3, first_name: 'Jane', last_name: 'Smith' }]);
            splitScheduleByDate.mockResolvedValue([]);

            await retrieveSubordinateSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No WFH schedules found for this team." });
        });

        it('should return 500 if an error occurs', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockRejectedValue(new Error('Database error'));

            await retrieveSubordinateSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "An error occurred while retrieving the team schedule." });
        });

        it('should return 404 if period is partial day for subordinate', async () => {
            const req = { user: { id: 1 }, query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockResolvedValue([{ user_id: 2, first_name: 'John', last_name: 'Doe' }]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Partial Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-10', end_date: '2024-10-10' }]);

            await retrieveSubordinateSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No WFH schedules found for this team." });
        });


        it('should filter subordinate by the specified subordinate_id and return WFH schedules', async () => {
            const req = { user: { id: 1 }, query: { colleague_id: "3" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockResolvedValue([
                { user_id: 2, first_name: 'John', last_name: 'Doe' },
                { user_id: 3, first_name: 'Jane', last_name: 'Smith' }
            ]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-11', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-11', end_date: '2024-10-11' }]);

            await retrieveSubordinateSchedule(req, res, next);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                '2024-10-11': {
                    'Full Day': ['Jane Smith']
                }
            });
        });

        it('should return 404 if date is before start date for subordinate', async () => {
            const req = { user: { id: 1 }, query: { start_date: '2024-10-12 09:00:00', end_date: '2024-10-13 13:00:00' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockResolvedValue([{ user_id: 2, first_name: 'John', last_name: 'Doe' }]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-10', end_date: '2024-10-10' }]);

            await retrieveSubordinateSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No WFH schedules found for this team." });
        });

        it('should return 404 if date is after end date for subordinate', async () => {
            const req = { user: { id: 1 }, query: { start_date: '2024-10-01 09:00:00', end_date: '2024-10-05 13:00:00' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockResolvedValue([{ user_id: 2, first_name: 'John', last_name: 'Doe' }]);
            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-10', period: 'Full Day' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-10', end_date: '2024-10-10' }]);

            await retrieveSubordinateSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No WFH schedules found for this team." });
        });
    });

    describe('retrieveOwnSchedule', () => {
        it('should return own WFH schedule', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            splitScheduleByDate.mockResolvedValue([{ date: '2024-10-12', period: 'Full Day', start_time: '08:00', end_time: '17:00' }]);

            Schedule.findAll.mockResolvedValue([{ start_date: '2024-10-12', end_date: '2024-10-12' }]);

            await retrieveOwnSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    title: 'WFH (Full Day)',
                    start: '2024-10-12T08:00',
                    end: '2024-10-12T17:00',
                    allDay: true,
                    extendedProps: { type: 'Full Day' }
                }
            ]);
        });

        it('should return 404 if no own schedule found', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            Schedule.findAll.mockResolvedValue([]);

            await retrieveOwnSchedule(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No schedules found for this user." });
        });

        it('should return 500 if an error occurs', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Schedule.findAll.mockRejectedValue(new Error('Database error'));

            await retrieveOwnSchedule(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "An error occurred while retrieving the schedule." });
        });
    });
});
