const { Application, Employee, Schedule } = require('../models');
const {
    retrieveApplications,
    retrievePendingApplications,
    createNewApplication,
    approvePendingApplication,
    rejectPendingApplication,
    withdrawPendingApplication,
    withdrawApprovedApplication
} = require('../controllers/applicationController');
const { fetchSubordinates } = require('../services/common/employeeHelper');
const { checkforOverlap } = require('../services/common/applicationHelper');
const { scheduleHasNotPassedCurrentDay } = require('../services/common/scheduleHelper');
const { sequelize } = require('../services/database/mysql');

jest.mock('../models', () => ({
    Application: {
        findAll: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    },
    Employee: {
        findByPk: jest.fn(),
        findAll: jest.fn()
    },
    Schedule: {
        findAll: jest.fn(),
        create: jest.fn()
    }
}));
jest.mock('../services/common/employeeHelper');
jest.mock('../services/common/applicationHelper');
jest.mock('../services/common/scheduleHelper');
jest.mock('../services/database/mysql', () => ({
    transaction: jest.fn(() => ({
        commit: jest.fn(),
        rollback: jest.fn(),
    })),
}));

describe('Application Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('retrieveApplications', () => {
        it('should return applications based on userId and status', async () => {
            const req = { query: { id: 1, status: 'Pending' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Application.findAll.mockResolvedValue([{ application_id: 1, created_by: 1, status: 'Pending' }]);

            await retrieveApplications(req, res, next);

            expect(Application.findAll).toHaveBeenCalledWith({
                where: { created_by: 1, status: 'Pending' }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                expect.objectContaining({ application_id: 1, created_by: 1, status: 'Pending' })
            ]);
        });

        it('should return 404 if no applications are found', async () => {
            const req = { query: { id: 1, status: 'Pending' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Application.findAll.mockResolvedValue([]);

            await retrieveApplications(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'No Pending application.' });
        });
    });

    describe('createNewApplication', () => {
        it('should create a new application successfully', async () => {
            const req = {
                user: { id: 1 },
                body: { application_type: 'Regular', startDate: '2024-10-01', endDate: '2024-10-10', requestor_remarks: 'Vacation' },
                files: []
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Employee.findByPk.mockResolvedValue({ id: 1, reporting_manager: 2 });
            Application.findAll.mockResolvedValue([]);
            Schedule.findAll.mockResolvedValue([]);
            checkforOverlap.mockResolvedValue(false);
            Application.create.mockResolvedValue({ application_id: 1 });

            await createNewApplication(req, res, next);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(Application.create).toHaveBeenCalledWith(expect.objectContaining({
                start_date: '2024-10-01',
                end_date: '2024-10-10',
                application_type: 'Regular',
                created_by: 1
            }));
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'New application successfully created.',
                result: expect.objectContaining({ application_id: 1 })
            });
        });

        it('should return 400 if overlapping application exists', async () => {
            const req = {
                user: { id: 1 },
                body: { application_type: 'Regular', startDate: '2024-10-01', endDate: '2024-10-10', requestor_remarks: 'Vacation' },
                files: []
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Employee.findByPk.mockResolvedValue({ id: 1, reporting_manager: 2 });
            Application.findAll.mockResolvedValue([{ application_id: 2 }]);
            checkforOverlap.mockResolvedValue(true);

            await createNewApplication(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('Invalid application period') });
        });
    });

    describe('approvePendingApplication', () => {
        it('should approve the pending application', async () => {
            const req = { user: { id: 2 }, body: { application_id: 1, approverRemarks: 'Approved' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const transaction = { commit: jest.fn(), rollback: jest.fn() };

            sequelize.transaction.mockResolvedValue(transaction);
            Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Pending', start_date: '2024-10-01', created_by: 1 });
            Employee.findByPk.mockResolvedValueOnce({ id: 1, reporting_manager: 2 }).mockResolvedValueOnce({ id: 2 });
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);
            Schedule.create.mockResolvedValue({});

            await approvePendingApplication(req, res);

            expect(Application.findByPk).toHaveBeenCalledWith(1);
            expect(Schedule.create).toHaveBeenCalled();
            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application approved successfully' });
        });

        it('should return 400 if the application has passed the start date', async () => {
            const req = { user: { id: 2 }, body: { application_id: 1, approverRemarks: 'Approved' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const transaction = { rollback: jest.fn() };

            sequelize.transaction.mockResolvedValue(transaction);
            Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Pending', start_date: '2024-10-01', created_by: 1 });
            scheduleHasNotPassedCurrentDay.mockReturnValue(true);

            await approvePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Cannot approve application which has passed' });
        });
    });

    describe('rejectPendingApplication', () => {
        it('should reject the pending application', async () => {
            const req = { user: { id: 2 }, body: { application_id: 1, approverRemarks: 'Rejected' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const transaction = { commit: jest.fn(), rollback: jest.fn() };

            sequelize.transaction.mockResolvedValue(transaction);
            Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Pending', start_date: '2024-10-01', created_by: 1 });
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);

            await rejectPendingApplication(req, res);

            expect(Application.findByPk).toHaveBeenCalledWith(1);
            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application rejected successfully' });
        });
    });

    describe('withdrawPendingApplication', () => {
        it('should withdraw a pending application', async () => {
            const req = { user: { id: 1 }, body: { application_id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            Employee.findByPk.mockResolvedValue({ id: 1 });
            Application.findOne.mockResolvedValue({ application_id: 1, status: 'Pending', created_by: 1 });

            await withdrawPendingApplication(req, res);

            expect(Application.findOne).toHaveBeenCalledWith({
                where: {
                    application_id: 1,
                    status: 'Pending',
                    created_by: 1
                }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Application updated to withdrawn successfully',
                application: expect.objectContaining({ application_id: 1 })
            });
        });
    });
});
