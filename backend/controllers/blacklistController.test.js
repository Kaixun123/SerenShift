const {
    getBlacklistDates,
    getBlacklistDatesManager,
    getBlacklistDate,
    createBlacklistDate,
    updateBlacklistDate,
    deleteBlacklistDate
} = require('./blacklistController');
const { Blacklist, Employee } = require('../models');
const { sequelize } = require('../services/database/mysql');
const moment = require('moment');

jest.mock('../models', () => ({
    Application: {
        findAll: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
    },
    Employee: {
        findByPk: jest.fn(),
        findAll: jest.fn(),
    },
    Schedule: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    },
    Blacklist: {
        findAll: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
    },
    Notification: {
        create: jest.fn(),
    },
}));

jest.mock('../services/database/mysql');

const mockReq = (data) => ({ ...data });
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Blacklist Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getBlacklistDates', () => {
        it('should retrieve blacklist dates for a valid employee', async () => {
            // Setup
            const req = mockReq({
                user: { id: 1 },
                body: { start_date: '2024-10-01', end_date: '2024-10-02' }
            });
            const res = mockRes();
            const mockEmployee = { id: 1, reporting_manager: 2 };
            const mockApprover = { id: 2 };
            const mockBlacklistDates = [{ start_date: '2024-10-01', end_date: '2024-10-02' }];

            Employee.findByPk
                .mockResolvedValueOnce(mockEmployee)
                .mockResolvedValueOnce(mockApprover);
            Blacklist.findAll.mockResolvedValue(mockBlacklistDates);

            // Execution
            await getBlacklistDates(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockBlacklistDates);
        });

        it('should return 404 if employee is not found', async () => {
            // Setup
            const req = mockReq({
                user: { id: 1 },
                body: { start_date: '2024-10-01', end_date: '2024-10-02' }
            });
            const res = mockRes();

            Employee.findByPk.mockResolvedValue(null);

            // Execution
            await getBlacklistDates(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Employee Not Found' });
        });
    });

    describe('getBlacklistDatesManager', () => {
        it('should retrieve blacklist dates for the manager', async () => {
            // Setup
            const req = mockReq({ user: { id: 1 } });
            const res = mockRes();
            const mockManager = { id: 1 };
            const mockBlacklistDates = [{ start_date: '2024-10-01', end_date: '2024-10-02' }];

            Employee.findByPk.mockResolvedValue(mockManager);
            Blacklist.findAll.mockResolvedValue(mockBlacklistDates);

            // Execution
            await getBlacklistDatesManager(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockBlacklistDates);
        });

        it('should return 404 if manager is not found', async () => {
            // Setup
            const req = mockReq({ user: { id: 1 } });
            const res = mockRes();

            Employee.findByPk.mockResolvedValue(null);

            // Execution
            await getBlacklistDatesManager(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Manager Not Found' });
        });
    });

    describe('createBlacklistDate', () => {
        it('should create a blacklist date', async () => {
            // Setup
            const req = mockReq({
                user: { id: 1 },
                body: {
                    startDateTime: '2024-10-01T09:00:00Z',
                    endDateTime: '2024-10-02T17:00:00Z',
                    remarks: 'Test remark'
                }
            });
            const res = mockRes();
    
            // Mock the transaction to return an object with commit and rollback functions
            const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
            sequelize.transaction.mockResolvedValue(mockTransaction);
            
            // Set up Blacklist.create to return an object with an `id` field
            const mockBlacklistDate = { id: 1, start_date: '2024-10-01', end_date: '2024-10-02' };
            Blacklist.create.mockResolvedValue(mockBlacklistDate);
            Blacklist.findAll.mockResolvedValue([]);
    
            // Execution
            await createBlacklistDate(req, res);
    
            // Assertion
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Blacklist Date Created Successfully',
            });
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        it('should return 400 if a conflicting date exists', async () => {
            // Setup
            const req = mockReq({
                user: { id: 1 },
                body: {
                    startDateTime: '2024-10-01T09:00:00Z',
                    endDateTime: '2024-10-02T17:00:00Z'
                }
            });
            const res = mockRes();

            Blacklist.findAll.mockResolvedValue([{ id: 1 }]);

            // Execution
            await createBlacklistDate(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'A Conflicting Blacklist Date Entry Already Exists' });
        });
    });

    describe('updateBlacklistDate', () => {
        it('should update a blacklist date', async () => {
            // Setup
            const req = mockReq({
                params: { id: 1 },
                user: { id: 1 },
                body: {
                    startDateTime: '2024-10-01T08:00:00Z',
                    endDateTime: '2024-10-02T17:00:00Z',
                    remarks: 'Updated remark'
                }
            });
            const res = mockRes();
            const mockBlacklistDate = { save: jest.fn(), created_by: 1, start_date: '2024-10-01' };
            Blacklist.findByPk.mockResolvedValue(mockBlacklistDate);
            Blacklist.findAll.mockResolvedValue([]);

            // Execution
            await updateBlacklistDate(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Blacklist Date Updated Successfully' });
            expect(mockBlacklistDate.save).toHaveBeenCalled();
        });

        it('should return 404 if the blacklist date is not found', async () => {
            // Setup
            const req = mockReq({
                params: { id: 999 },
                user: { id: 1 },
                body: {
                    startDateTime: '2024-10-01T08:00:00Z',
                    endDateTime: '2024-10-02T17:00:00Z'
                }
            });
            const res = mockRes();

            Blacklist.findByPk.mockResolvedValue(null);

            // Execution
            await updateBlacklistDate(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Blacklist Date Not Found' });
        });
    });

    describe('getBlacklistDate', () => {
        it('should retrieve a specific blacklist date successfully', async () => {
            // Setup
            const req = mockReq({ params: { blacklist_id: 1 } });
            const res = mockRes();
            const mockBlacklistDate = { id: 1, start_date: '2024-10-01', end_date: '2024-10-02' };

            Blacklist.findByPk.mockResolvedValue(mockBlacklistDate);

            // Execution
            await getBlacklistDate(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockBlacklistDate);
        });

        it('should return 404 if the blacklist date is not found', async () => {
            // Setup
            const req = mockReq({ params: { blacklist_id: 999 } });
            const res = mockRes();

            Blacklist.findByPk.mockResolvedValue(null);

            // Execution
            await getBlacklistDate(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Blacklist Date Not Found' });
        });
    });

    describe('deleteBlacklistDate', () => {
        it('should delete a blacklist date successfully', async () => {
            // Setup
            const req = mockReq({ params: { blacklist_id: 1 }, user: { id: 1 } });
            const res = mockRes();
            const mockBlacklistDate = {
                id: 1,
                start_date: new Date('2099-10-01'), // Set start_date to a future date to avoid date check interference
                created_by: 1,
                destroy: jest.fn()
            };
    
            Blacklist.findByPk.mockResolvedValue(mockBlacklistDate);
    
            // Execution
            await deleteBlacklistDate(req, res);
    
            // Assertion
            expect(mockBlacklistDate.destroy).toHaveBeenCalled(); // Confirm destroy is called
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Blacklist Date Deleted Successfully' });
        });

        it('should return 404 if the blacklist date is not found', async () => {
            // Setup
            const req = mockReq({ params: { blacklist_id: 999 }, user: { id: 1 } });
            const res = mockRes();

            Blacklist.findByPk.mockResolvedValue(null);

            // Execution
            await deleteBlacklistDate(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Blacklist Date Not Found' });
        });

        it('should return 403 if the user is not authorized to delete the blacklist date', async () => {
            // Setup
            const req = mockReq({ params: { blacklist_id: 1 }, user: { id: 2 } }); // Different user ID
            const res = mockRes();
            const mockBlacklistDate = { id: 1, created_by: 1 };

            Blacklist.findByPk.mockResolvedValue(mockBlacklistDate);

            // Execution
            await deleteBlacklistDate(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
        });

        it('should return 400 if the blacklist date has already passed', async () => {
            // Setup
            const req = mockReq({ params: { blacklist_id: 1 }, user: { id: 1 } });
            const res = mockRes();
            const mockBlacklistDate = {
                id: 1,
                start_date: new Date('2023-10-01'), // A past date
                created_by: 1,
                destroy: jest.fn()
            };

            Blacklist.findByPk.mockResolvedValue(mockBlacklistDate);

            // Execution
            await deleteBlacklistDate(req, res);

            // Assertion
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Blacklist Date Has Already Passed' });
        });
    });
});
