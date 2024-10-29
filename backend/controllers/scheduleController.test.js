const {
    retrieveTeamSchedule,
    retrieveSubordinateSchedule,
    retrieveOwnSchedule,
    retrieveCompanySchedule,
    retrieveDepartmentSchedule
} = require('../controllers/scheduleController');
const { Schedule, Employee } = require('../models');
const { fetchColleagues, fetchSubordinates } = require('../services/common/employeeHelper');
const { splitScheduleByDate } = require('../services/common/scheduleHelper');

jest.mock('../models', () => ({
    Schedule: {
        findAll: jest.fn(),
        findOne: jest.fn()
    },
    Employee: {
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

    describe('retrieveCompanySchedule', () => {
        it('should return WFH and WFO counts for each department on the given date', async () => {
            const req = { query: { date: '2024-10-29' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const mockEmployees = [
                { id: 1, department: 'Engineering' },
                { id: 2, department: 'Engineering' },
                { id: 3, department: 'Marketing' }
            ];
            const mockSchedules = [
                { created_by: 1, start_date: '2024-10-29T09:00:00', end_date: '2024-10-29T18:00:00' },
                { created_by: 3, start_date: '2024-10-29T09:00:00', end_date: '2024-10-29T18:00:00' },
                { created_by: 2, start_date: '2024-10-29T09:00:00', end_date: '2024-10-29T18:00:00' }
            ];

            Employee.findAll.mockResolvedValue(mockEmployees);
            Schedule.findOne.mockImplementation(({ where }) => {
                const { created_by } = where;
                const schedule = mockSchedules.find(s => s.created_by === created_by);
                return Promise.resolve(schedule || null);
            });

            await retrieveCompanySchedule(req, res);

            expect(Employee.findAll).toHaveBeenCalled();
            expect(Schedule.findOne).toHaveBeenCalledTimes(3);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                Engineering: { wfh: 2, wfo: 0 },
                Marketing: { wfh: 1, wfo: 0 }
            });
        });

        it('should increment wfh count for employees with schedules on the target date', async () => {
            req = { query: { date: '2024-10-29' } }; // Target date for testing
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            // Mock employees from two departments
            const mockEmployees = [
                { id: 1, department: 'Engineering' },
                { id: 2, department: 'Engineering' },
                { id: 3, department: 'Marketing' }
            ];
            const mockSchedules = [
                { created_by: 1, start_date: '2024-10-29T09:00:00', end_date: '2024-10-29T18:00:00' },
                { created_by: 3, start_date: '2024-10-29T09:00:00', end_date: '2024-10-29T18:00:00' },
            ];

            // Mock Schedule.findOne to simulate a WFH schedule for certain employees
            Employee.findAll.mockResolvedValue(mockEmployees);
            Schedule.findOne.mockImplementation(({ where }) => {
                const { created_by } = where;
                const schedule = mockSchedules.find(s => s.created_by === created_by);
                return Promise.resolve(schedule || null);
            });

            await retrieveCompanySchedule(req, res);

            // Verify that findAll was called and correct number of calls to findOne
            expect(Employee.findAll).toHaveBeenCalled();
            expect(Schedule.findOne).toHaveBeenCalledTimes(3);

            // Check the response to see if the wfh count incremented correctly
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                Engineering: { wfo: 1, wfh: 1 }, // 1 WFH and 1 WFO in Engineering
                Marketing: { wfo: 0, wfh: 1 }    // 1 WFH and 0 WFO in Marketing
            });
        });

        it('should return an empty response if no employees are found', async () => {
            const req = { query: { date: '2023-04-15' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            Employee.findAll.mockResolvedValue([]);

            await retrieveCompanySchedule(req, res);

            expect(Employee.findAll).toHaveBeenCalled();
            expect(Schedule.findOne).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({});
        });

        it('should handle errors and return a 500 status code', async () => {
            const req = { query: { date: '2023-04-15' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            Employee.findAll.mockRejectedValue(new Error('Database error'));

            await retrieveCompanySchedule(req, res);

            expect(Employee.findAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'An error occurred while retrieving staff data.'
            });
        });
    });

    describe('retrieveDepartmentSchedule', () => {
        it('should return counts of AM, PM, and Full-Day WFH schedules along with staff details', async () => {
            // Define request and response mocks
            const req = {
                query: {
                    date: '2023-04-15',
                    department: 'Engineering'
                }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mock employee data
            const mockEmployees = [
                { id: 1, first_name: 'Alice', last_name: 'Smith', department: 'Engineering' },
                { id: 2, first_name: 'Bob', last_name: 'Jones', department: 'Engineering' },
                { id: 3, first_name: 'Taylor', last_name: 'Swift', department: 'Engineering' }
            ];
            Employee.findAll.mockResolvedValue(mockEmployees);

            // Mock schedule data
            const mockSchedules = [
                { created_by: 1, start_date: new Date('2023-04-15T09:00:00'), end_date: new Date('2023-04-15T18:00:00') }, // Full-Day WFH
                { created_by: 2, start_date: new Date('2023-04-15T09:00:00'), end_date: new Date('2023-04-15T13:00:00') }, // AM WFH
                { created_by: 3, start_date: new Date('2023-04-15T14:00:00'), end_date: new Date('2023-04-15T18:00:00') }  // AM WFH
            ];
            Schedule.findAll.mockImplementation(({ where }) => {
                const { created_by } = where;
                return Promise.resolve(
                    mockSchedules.filter(schedule => schedule.created_by === created_by)
                );
            });

            // Call the function
            await retrieveDepartmentSchedule(req, res);

            // Define expected output
            const expectedOutput = {
                "wfhStats": {
                    "department": "Engineering",
                    "wfh": {
                        "am": 0.3333333333333333333333333333,
                        "pm": 0.33333333333333333333333333,
                        "fullDay": 0.333333333333333333333333
                    }
                },
                "wfhStaff": [
                    {
                        "id": 1,
                        "name": "Alice Smith",
                        "wfhPeriod": "Full-Day"
                    },
                    {
                        "id": 2,
                        "name": "Bob Jones",
                        "wfhPeriod": "AM"
                    },
                    {
                        "id": 3,
                        "name": "Taylor Swift",
                        "wfhPeriod": "PM"
                    },
                ]
            };

            // Assertions
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedOutput);
            expect(Employee.findAll).toHaveBeenCalledWith({ where: { department: 'Engineering' } });
            expect(Schedule.findAll).toHaveBeenCalledTimes(3);
        });

        it('should return counts of AM, PM, and Full-Day WFH schedules along with staff details, with data not in the specified date', async () => {
            // Define request and response mocks
            const req = {
                query: {
                    date: '2023-04-15',
                    department: 'Engineering'
                }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mock employee data
            const mockEmployees = [
                { id: 1, first_name: 'Alice', last_name: 'Smith', department: 'Engineering' },
                { id: 2, first_name: 'Bob', last_name: 'Jones', department: 'Engineering' },
                { id: 3, first_name: 'Taylor', last_name: 'Swift', department: 'Engineering' }
            ];
            Employee.findAll.mockResolvedValue(mockEmployees);

            // Mock schedule data
            const mockSchedules = [
                { created_by: 1, start_date: new Date('2023-04-15T09:00:00'), end_date: new Date('2023-04-15T18:00:00') }, // Full-Day WFH
                { created_by: 2, start_date: new Date('2023-04-16T09:00:00'), end_date: new Date('2023-04-16T13:00:00') }, // AM WFH
                { created_by: 3, start_date: new Date('2023-04-13T14:00:00'), end_date: new Date('2023-04-13T18:00:00') }  // AM WFH
            ];
            Schedule.findAll.mockImplementation(({ where }) => {
                const { created_by } = where;
                return Promise.resolve(
                    mockSchedules.filter(schedule => schedule.created_by === created_by)
                );
            });

            // Call the function
            await retrieveDepartmentSchedule(req, res);

            // Define expected output
            const expectedOutput = {
                "wfhStats": {
                    "department": "Engineering",
                    "wfh": {
                        "am": 0,
                        "pm": 0,
                        "fullDay": 1
                    }
                },
                "wfhStaff": [
                    {
                        "id": 1,
                        "name": "Alice Smith",
                        "wfhPeriod": "Full-Day"
                    },
                ]
            };

            // Assertions
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedOutput);
            expect(Employee.findAll).toHaveBeenCalledWith({ where: { department: 'Engineering' } });
            expect(Schedule.findAll).toHaveBeenCalledTimes(3);
        });

        it('should set fullDay to 0 when total is 0', async () => {
            const req = {
                query: {
                    date: '2023-04-15',
                    department: 'Engineering'
                }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const mockEmployees = [
                { id: 1, first_name: 'Alice', last_name: 'Smith', department: 'Engineering' },
                { id: 2, first_name: 'Bob', last_name: 'Jones', department: 'Engineering' }
            ];
    
            // Mock schedules with no WFH
            Schedule.findAll.mockResolvedValue([]); // No schedules found
    
            Employee.findAll.mockResolvedValue(mockEmployees);
    
            await retrieveDepartmentSchedule(req, res);
    
            // Expect that the fullDay is set to 0 when no WFH found
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                wfhStats: expect.objectContaining({
                    department: 'Engineering',
                    wfh: expect.objectContaining({
                        fullDay: 0 // Total is 0 since no schedules are found
                    })
                })
            }));
        });    

        it('should handle errors and return a 500 status code', async () => {
            // Define request and response mocks
            const req = {
                query: {
                    date: '2023-04-15',
                    department: 'Engineering'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            // Mock an error in Employee model
            Employee.findAll.mockRejectedValue(new Error('Database error'));

            // Call the function
            await retrieveDepartmentSchedule(req, res);

            // Assertions
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'An error occurred while retrieving staff data.' });
        });
    });
});
