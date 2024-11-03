const { Application, Employee, Schedule, Blacklist, Notification } = require('../models');
const {
    retrieveApplications,
    retrievePendingApplications,
    retrieveApprovedApplications,
    createNewApplication,
    approvePendingApplication,
    rejectPendingApplication,
    withdrawPendingApplication,
    withdrawApprovedApplication,
    withdrawApprovedApplicationByEmployee,
    updatePendingApplication,
    updateApprovedApplication,
    rejectWithdrawalOfApprovedApplication,
    withdrawSpecificDates,
    createSimilarApplication
} = require('../controllers/applicationController');
const applicationController = require('../controllers/applicationController');
const { checkforOverlap, extractRemainingDates, splitConsecutivePeriodByDay, uploadFilesToS3, sendNotificationEmail, updateFileDetails, generateNewFileName } = require('../services/common/applicationHelper');
const { fetchSubordinates } = require('../services/common/employeeHelper');
const { scheduleHasNotPassedCurrentDay, scheduleIsAfterCurrentTime, deleteCorrespondingSchedule } = require('../services/common/scheduleHelper');
const { retrieveFileDetails, copyFileInS3 } = require('../services/uploads/s3');
const { Op } = require('sequelize');
const { sequelize } = require('../services/database/mysql');
const moment = require('moment');

jest.mock('../services/database/mysql', () => ({
    sequelize: {
        transaction: jest.fn(() => ({
            commit: jest.fn(),
            rollback: jest.fn(),
        })),
    },
}));

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
    },
    Notification: {
        create: jest.fn(),
    },
}));

jest.mock('../services/common/employeeHelper');
jest.mock('../services/common/scheduleHelper');
jest.mock('../services/uploads/s3');
jest.mock('../services/common/applicationHelper');

describe('Application Controller Additional Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('retrieveApplications', () => {
        it('should return applications when the user and applications are found for pending approval', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const employee = { id: 1 };
            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + 1); // one day in the future

            const applications = [
                {
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Ad Hoc',
                    status: 'Pending',
                    created_by: 1,
                    last_update_by: 1,
                    verify_by: null,
                    verify_timestamp: null,
                    requestor_remarks: 'Needs leave',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                }
            ];

            Employee.findByPk.mockResolvedValue(employee);
            Application.findAll.mockResolvedValue(applications);

            await retrieveApplications(req, res);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalledWith({
                where: {
                    created_by: 1,
                    status: {
                        [Op.or]: ["Pending", "Approved"]
                    }
                }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                expect.objectContaining({
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Ad Hoc',
                    status: 'Pending approval',
                    created_by: 1,
                    last_update_by: 1,
                    verify_by: null,
                    requestor_remarks: 'Needs leave',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                })
            ]);
        });

        it('should return applications when the user and applications are found for pending withdrawal', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const employee = { id: 1 };
            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + 1); // one day in the future

            const applications = [
                {
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Ad Hoc',
                    status: 'Pending',
                    created_by: 1,
                    last_update_by: 1,
                    verify_by: 2,
                    verify_timestamp: "2024-12-01T06:18:43.750Z",
                    requestor_remarks: 'Needs leave',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                }
            ];

            Employee.findByPk.mockResolvedValue(employee);
            Application.findAll.mockResolvedValue(applications);

            await retrieveApplications(req, res);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalledWith({
                where: {
                    created_by: 1,
                    status: {
                        [Op.or]: ["Pending", "Approved"]
                    }
                }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                expect.objectContaining({
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Ad Hoc',
                    status: 'Pending withdrawal',
                    created_by: 1,
                    last_update_by: 1,
                    verify_by: 2,
                    verify_timestamp: "2024-12-01T06:18:43.750Z",
                    requestor_remarks: 'Needs leave',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                })
            ]);
        });

        it('should return applications when the user and applications are found for approved', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const employee = { id: 1 };
            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + 1); // one day in the future

            const applications = [
                {
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Ad Hoc',
                    status: 'Approved',
                    created_by: 1,
                    last_update_by: 1,
                    verify_by: 2,
                    verify_timestamp: "2024-12-01T06:18:43.750Z",
                    requestor_remarks: 'Needs leave',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                }
            ];

            Employee.findByPk.mockResolvedValue(employee);
            Application.findAll.mockResolvedValue(applications);

            await retrieveApplications(req, res);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalledWith({
                where: {
                    created_by: 1,
                    status: {
                        [Op.or]: ["Pending", "Approved"]
                    }
                }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                expect.objectContaining({
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Ad Hoc',
                    status: 'Approved',
                    created_by: 1,
                    last_update_by: 1,
                    verify_by: 2,
                    verify_timestamp: "2024-12-01T06:18:43.750Z",
                    requestor_remarks: 'Needs leave',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                })
            ]);
        });

        it('should return 404 if no employee is found', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            Employee.findByPk.mockResolvedValue(null);

            await retrieveApplications(req, res);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Employee not found.' });
        });

        it('should return 404 if no applications are found', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            Employee.findByPk.mockResolvedValue({ id: 1 });
            Application.findAll.mockResolvedValue([]);

            await retrieveApplications(req, res);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application not found.' });
        });

        it('should filter applications to return only those with a start_date after today', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const employee = { id: 1 };
            const today = new Date();
            const pastDate = new Date(today);
            pastDate.setDate(today.getDate() - 1); // one day in the past
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + 1); // one day in the future

            const applications = [
                {
                    application_id: 1,
                    start_date: pastDate.toISOString(),
                    end_date: pastDate.toISOString(),
                    application_type: 'Ad Hoc',
                    status: 'Pending',
                    created_by: 1,
                    last_update_by: 1,
                    verify_by: null,
                    verify_timestamp: null,
                    requestor_remarks: 'Needs leave',
                    created_timestamp: pastDate.toISOString(),
                    last_update_timestamp: pastDate.toISOString()
                },
                {
                    application_id: 2,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Regular',
                    status: 'Pending',
                    created_by: 1,
                    last_update_by: 1,
                    verify_by: null,
                    verify_timestamp: null,
                    requestor_remarks: 'Needs leave',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                }
            ];

            Employee.findByPk.mockResolvedValue(employee);
            Application.findAll.mockResolvedValue(applications);

            await retrieveApplications(req, res);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                expect.objectContaining({
                    application_id: 2,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Regular',
                    status: 'Pending approval',
                    created_by: 1,
                    last_update_by: 1,
                    verify_by: null,
                    verify_timestamp: null,
                    requestor_remarks: 'Needs leave',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                })
            ]);
        });

        it('should return 500 if there is an error', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            Employee.findByPk.mockRejectedValue(new Error('Database error'));

            await retrieveApplications(req, res);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'An error occurred while fetching application.' });
        });
    });

    describe('retrievePendingApplications', () => {
        it('should retrieve pending applications for subordinates', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + 1); // one day in the future

            const subordinates = [
                {
                    user_id: 2,
                    first_name: 'John',
                    last_name: 'Doe',
                    department: 'IT',
                    position: 'Developer',
                    country: 'US',
                    email: 'john@example.com'
                }
            ];

            const applications = [
                {
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Leave',
                    status: 'Pending',
                    created_by: 2,
                    last_update_by: 2,
                    verify_by: null,
                    verify_timestamp: null,
                    requestor_remarks: 'Family event',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                }
            ];

            const files = [{ file_id: 1, file_name: 'doc1.pdf' }];

            // Mocking fetchSubordinates to return the subordinates data
            fetchSubordinates.mockResolvedValue(subordinates);

            // Mocking Application.findAll to return the applications for the subordinate
            Application.findAll.mockResolvedValue(applications);

            // Mocking retrieveFileDetails to return files for each application
            retrieveFileDetails.mockResolvedValue(files);

            await retrievePendingApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalledWith({
                where: {
                    created_by: 2,
                    status: "Pending"
                }
            });
            expect(retrieveFileDetails).toHaveBeenCalledWith('application', 1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    user_id: 2,
                    first_name: 'John',
                    last_name: 'Doe',
                    department: 'IT',
                    position: 'Developer',
                    country: 'US',
                    email: 'john@example.com',
                    pendingApplications: [
                        expect.objectContaining({
                            application_id: 1,
                            start_date: futureDate.toISOString(),
                            end_date: futureDate.toISOString(),
                            application_type: 'Leave',
                            status: 'Pending approval',
                            created_by: 2,
                            last_update_by: 2,
                            verify_by: null,
                            verify_timestamp: null,
                            requestor_remarks: 'Family event',
                            created_timestamp: futureDate.toISOString(),
                            last_update_timestamp: futureDate.toISOString(),
                            files
                        })
                    ]
                }
            ]);
        });

        it('should return empty list if no subordinates found', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            fetchSubordinates.mockResolvedValue([]);

            await retrievePendingApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return subordinate without pending applications', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const subordinates = [
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'IT', position: 'Developer', country: 'US', email: 'john@example.com' }
            ];

            fetchSubordinates.mockResolvedValue(subordinates);
            Application.findAll.mockResolvedValue([]); // No pending applications

            await retrievePendingApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalledWith({
                where: {
                    created_by: 2,
                    status: "Pending"
                }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    user_id: 2,
                    first_name: 'John',
                    last_name: 'Doe',
                    department: 'IT',
                    position: 'Developer',
                    country: 'US',
                    email: 'john@example.com',
                    pendingApplications: [] // No pending applications
                }
            ]);
        });

        it('should filter applications to return only those with start_date after today', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const today = new Date();
            const pastDate = new Date(today);
            pastDate.setDate(today.getDate() - 1); // one day in the past
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + 1); // one day in the future

            const subordinates = [
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'IT', position: 'Developer', country: 'US', email: 'john@example.com' }
            ];

            const applications = [
                {
                    application_id: 1,
                    start_date: pastDate.toISOString(),
                    end_date: pastDate.toISOString(),
                    application_type: 'Ad Hoc',
                    status: 'Pending',
                    created_by: 2,
                    last_update_by: 2,
                    verify_by: null,
                    verify_timestamp: null,
                    requestor_remarks: 'Needs leave',
                    created_timestamp: pastDate.toISOString(),
                    last_update_timestamp: pastDate.toISOString()
                },
                {
                    application_id: 2,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Regular',
                    status: 'Pending',
                    created_by: 2,
                    last_update_by: 2,
                    verify_by: null,
                    verify_timestamp: null,
                    requestor_remarks: 'Needs leave',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                }
            ];

            fetchSubordinates.mockResolvedValue(subordinates);
            Application.findAll.mockResolvedValue(applications);

            await retrievePendingApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    user_id: 2,
                    first_name: 'John',
                    last_name: 'Doe',
                    department: 'IT',
                    position: 'Developer',
                    country: 'US',
                    email: 'john@example.com',
                    pendingApplications: [
                        expect.objectContaining({
                            application_id: 2,
                            start_date: futureDate.toISOString(),
                            end_date: futureDate.toISOString(),
                            application_type: 'Regular',
                            status: 'Pending approval',
                            created_by: 2,
                            last_update_by: 2,
                            verify_by: null,
                            verify_timestamp: null,
                            requestor_remarks: 'Needs leave',
                            created_timestamp: futureDate.toISOString(),
                            last_update_timestamp: futureDate.toISOString()
                        })
                    ]
                }
            ]);
        });

        it('should filter applications to return only those for withdrawing approval', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const today = new Date();
            const pastDate = new Date(today);
            pastDate.setDate(today.getDate() - 1); // one day in the past
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + 1); // one day in the future

            const subordinates = [
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'IT', position: 'Developer', country: 'US', email: 'john@example.com' }
            ];

            const applications = [
                {
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Regular',
                    status: 'Pending',
                    created_by: 2,
                    last_update_by: 2,
                    verify_by: 1,
                    verify_timestamp: "2024-11-01T07:22:20.585Z",
                    requestor_remarks: 'Family Event',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                }
            ];

            fetchSubordinates.mockResolvedValue(subordinates);
            Application.findAll.mockResolvedValue(applications);

            await retrievePendingApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    user_id: 2,
                    first_name: 'John',
                    last_name: 'Doe',
                    department: 'IT',
                    position: 'Developer',
                    country: 'US',
                    email: 'john@example.com',
                    pendingApplications: [
                        expect.objectContaining({
                            application_id: 1,
                            start_date: futureDate.toISOString(),
                            end_date: futureDate.toISOString(),
                            application_type: 'Regular',
                            status: 'Pending withdrawal',
                            created_by: 2,
                            last_update_by: 2,
                            verify_by: 1,
                            verify_timestamp: "2024-11-01T07:22:20.585Z",
                            requestor_remarks: 'Family Event',
                            created_timestamp: futureDate.toISOString(),
                            last_update_timestamp: futureDate.toISOString()
                        })
                    ]
                }
            ]);
        });

        it('should return 500 if there is an error', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            fetchSubordinates.mockRejectedValue(new Error('Database error'));

            await retrievePendingApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'An error occurred while fetching application.' });
        });
    });

    describe('retrieveApprovedApplications', () => {
        it('should retrieve approved applications for subordinates', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + 1); // one day in the future

            const subordinates = [
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'IT', position: 'Developer', country: 'US', email: 'john@example.com' }
            ];

            const applications = [
                {
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Leave',
                    status: 'Approved',
                    created_by: 2,
                    last_update_by: 2,
                    verify_by: null,
                    verify_timestamp: null,
                    requestor_remarks: 'Family event',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                }
            ];

            const files = [{ file_id: 1, file_name: 'doc1.pdf' }];

            fetchSubordinates.mockResolvedValue(subordinates);
            Application.findAll.mockResolvedValue(applications);
            scheduleIsAfterCurrentTime.mockReturnValue(true);
            retrieveFileDetails.mockResolvedValue(files);

            await retrieveApprovedApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalledWith({
                where: {
                    created_by: 2,
                    status: "Approved"
                }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    user_id: 2,
                    first_name: 'John',
                    last_name: 'Doe',
                    department: 'IT',
                    position: 'Developer',
                    country: 'US',
                    email: 'john@example.com',
                    approvedApplications: [
                        expect.objectContaining({
                            application_id: 1,
                            start_date: futureDate.toISOString(),
                            end_date: futureDate.toISOString(),
                            application_type: 'Leave',
                            status: 'Approved',
                            created_by: 2,
                            last_update_by: 2,
                            verify_by: null,
                            verify_timestamp: null,
                            requestor_remarks: 'Family event',
                            created_timestamp: futureDate.toISOString(),
                            last_update_timestamp: futureDate.toISOString(),
                            files: files
                        })
                    ]
                }
            ]);
        });

        it('should retrieve approved applications for subordinates without any s3 upload', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + 1); // one day in the future

            const subordinates = [
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'IT', position: 'Developer', country: 'US', email: 'john@example.com' }
            ];

            const applications = [
                {
                    application_id: 1,
                    start_date: futureDate.toISOString(),
                    end_date: futureDate.toISOString(),
                    application_type: 'Leave',
                    status: 'Approved',
                    created_by: 2,
                    last_update_by: 2,
                    verify_by: null,
                    verify_timestamp: null,
                    requestor_remarks: 'Family event',
                    created_timestamp: futureDate.toISOString(),
                    last_update_timestamp: futureDate.toISOString()
                }
            ];

            const files = [];

            fetchSubordinates.mockResolvedValue(subordinates);
            Application.findAll.mockResolvedValue(applications);
            scheduleIsAfterCurrentTime.mockReturnValue(true);
            retrieveFileDetails.mockResolvedValue(files);

            await retrieveApprovedApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalledWith({
                where: {
                    created_by: 2,
                    status: "Approved"
                }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    user_id: 2,
                    first_name: 'John',
                    last_name: 'Doe',
                    department: 'IT',
                    position: 'Developer',
                    country: 'US',
                    email: 'john@example.com',
                    approvedApplications: [
                        expect.objectContaining({
                            application_id: 1,
                            start_date: futureDate.toISOString(),
                            end_date: futureDate.toISOString(),
                            application_type: 'Leave',
                            status: 'Approved',
                            created_by: 2,
                            last_update_by: 2,
                            verify_by: null,
                            verify_timestamp: null,
                            requestor_remarks: 'Family event',
                            created_timestamp: futureDate.toISOString(),
                            last_update_timestamp: futureDate.toISOString(),
                            files: []
                        })
                    ]
                }
            ]);
        });

        it('should return empty list if subordinate has no approved applications', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const subordinates = [
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'IT', position: 'Developer', country: 'US', email: 'john@example.com' }
            ];

            fetchSubordinates.mockResolvedValue(subordinates);
            Application.findAll.mockResolvedValue([]); // No approved applications

            await retrieveApprovedApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(Application.findAll).toHaveBeenCalledWith({
                where: {
                    created_by: 2,
                    status: "Approved"
                }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    user_id: 2,
                    first_name: 'John',
                    last_name: 'Doe',
                    department: 'IT',
                    position: 'Developer',
                    country: 'US',
                    email: 'john@example.com',
                    approvedApplications: [] // No approved applications
                }
            ]);
        });

        it('should return 500 if there is an error', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            fetchSubordinates.mockRejectedValue(new Error('Database error'));

            await retrieveApprovedApplications(req, res);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'An error occurred while fetching application.' });
        });
    });

    describe('createNewApplication', () => {
        let req, res, transaction;

        beforeEach(() => {
            // Common mock setup for req and res
            req = {
                user: { id: 1 },
                body: {
                    application_type: 'Regular',
                    startDate: '2024-10-01',
                    endDate: '2024-10-10',
                    requestor_remarks: 'Vacation',
                    recurrence_rule: 'week',
                    recurrence_end_date: '2024-12-01'
                },
                files: []
            };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mock transaction object
            transaction = {
                commit: jest.fn(),
                rollback: jest.fn()
            };

            sequelize.transaction.mockResolvedValue(transaction);

            // Clear mocks before each test
            jest.clearAllMocks();
        });

        it('should return 404 if employee is not found', async () => {
            Employee.findByPk.mockResolvedValue(null); // Employee not found

            await createNewApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Employee not found." });
        });

        it('should return 404 if reporting manager is not found', async () => {
            const employeeInfo = { id: 1, reporting_manager: null };
            Employee.findByPk.mockResolvedValueOnce(employeeInfo); // Employee without reporting manager

            await createNewApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Reporting Manager not found." });
        });

        it('should return 400 if overlapping pending or approved applications are found', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const managerInfo = { id: 2 };

            // Mock database calls
            Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce(managerInfo);
            Application.findAll.mockResolvedValue([{ application_id: 2, start_date: '2024-10-05', end_date: '2024-10-15' }]); // Overlapping application
            Schedule.findAll.mockResolvedValue([]); // No approved schedules
            Blacklist.findAll.mockResolvedValue([]);

            // Mock `checkforOverlap` to return `true` indicating overlap
            checkforOverlap.mockReturnValueOnce(true);

            // Call the controller
            await createNewApplication(req, res);

            // Check that the response is a 400 with the expected message
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Invalid application period. New application cannot overlap with the existing or approved application."
            });
        });

        it('should return 400 if application period overlaps with approved schedules', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const managerInfo = { id: 2 };

            Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce(managerInfo);
            Application.findAll.mockResolvedValue([]); // No overlapping pending applications
            Schedule.findAll.mockResolvedValue([{ schedule_id: 1, start_date: '2024-10-05', end_date: '2024-10-15' }]); // Overlapping approved schedule
            Blacklist.findAll.mockResolvedValue([]);
            checkforOverlap.mockReturnValueOnce(true);

            await createNewApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid application period. New application cannot overlap with the existing or approved application." });
        });

        it('should return 400 if application period overlaps with blacklist period', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const managerInfo = { id: 2 };

            Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce(managerInfo);
            Application.findAll.mockResolvedValue([]);
            Schedule.findAll.mockResolvedValue([]);
            Blacklist.findAll.mockResolvedValue([{ blacklist_id: 1, start_date: '2024-10-01', end_date: '2024-10-15' }]); // Overlapping blacklist period

            await createNewApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Application period overlaps with blacklist period." });
        });

        it('should create a new application successfully', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const managerInfo = { id: 2 };
            const newApplication = { application_id: 1 };

            Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce(managerInfo);
            Application.findAll.mockResolvedValue([]); // No overlapping pending applications
            Schedule.findAll.mockResolvedValue([]); // No approved schedules
            Blacklist.findAll.mockResolvedValue([]); // No blacklist overlaps
            Application.create.mockResolvedValue(newApplication); // New application created
            Notification.create.mockResolvedValue({}); // Notification created

            await createNewApplication(req, res);

            expect(sequelize.transaction).toHaveBeenCalled();
            expect(Application.create).toHaveBeenCalledWith(expect.any(Object), { transaction });
            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "New application successfully created.",
                result: newApplication
            });
        });

        it('should handle error and return 500 if an exception is thrown', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };

            Employee.findByPk.mockResolvedValue(employeeInfo);
            Application.findAll.mockRejectedValue(new Error('Database error')); // Force an error to simulate failure

            await createNewApplication(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "An error occurred while creating new application." });
        });
    });

    describe('approvePendingApplication', () => {
        let req, res, transaction;

        beforeEach(() => {
            req = {
                user: { id: 2 },
                body: { application_id: 1, approverRemarks: 'Approved' }
            };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            transaction = { commit: jest.fn(), rollback: jest.fn() };
            sequelize.transaction.mockResolvedValue(transaction);

            jest.clearAllMocks();
        });

        it('should return 404 if application is not found', async () => {
            Application.findByPk.mockResolvedValue(null);

            await approvePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Application not found" });
        });

        it('should return 400 if application is not in Pending status', async () => {
            Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Approved', start_date: '2024-10-01', created_by: 1 });

            await approvePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application is not in Pending status' });
        });

        it('should return 400 if application start date has passed', async () => {
            Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Pending', start_date: '2024-01-01', created_by: 1 });
            scheduleHasNotPassedCurrentDay.mockReturnValue(true); // Indicates the start date has passed

            await approvePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Cannot approve application which has passed' });
        });

        it('should return 400 if approver is not the direct reporting manager', async () => {
            Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Pending', start_date: '2024-10-01', created_by: 1 });
            Employee.findByPk.mockResolvedValueOnce({ id: 1, reporting_manager: 3 }).mockResolvedValueOnce({ id: 2 }); // Reporting manager does not match
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);

            await approvePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Only the direct reporting manager can approve this application" });
        });

        it('should return 400 if there is a conflicting schedule', async () => {
            Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Pending', start_date: '2024-10-01', end_date: '2024-10-10', created_by: 1 });
            Employee.findByPk.mockResolvedValueOnce({ id: 1, reporting_manager: 2 }).mockResolvedValueOnce({ id: 2 });
            Schedule.findAll.mockResolvedValue([{ schedule_id: 1, start_date: '2024-10-05', end_date: '2024-10-07', created_by: 1 }]); // Overlapping schedule
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);

            await approvePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "A conflicting schedule was found" });
        });

        it('should approve the application successfully if no conflicts are found', async () => {
            const application = {
                application_id: 1,
                status: 'Pending',
                start_date: '2024-10-01',
                end_date: '2024-10-10',
                created_by: 1,
                save: jest.fn().mockResolvedValue(true)
            };
            const requestor = { id: 1, reporting_manager: 2 };
            const approver = { id: 2 };

            Application.findByPk.mockResolvedValue(application);
            Employee.findByPk.mockResolvedValueOnce(requestor).mockResolvedValueOnce(approver);
            Schedule.findAll.mockResolvedValue([]); // No conflicting schedule
            Notification.create.mockResolvedValue({}); // Notification created

            await approvePendingApplication(req, res);

            expect(application.save).toHaveBeenCalledWith({ transaction });
            expect(Schedule.create).toHaveBeenCalledWith({
                start_date: application.start_date,
                end_date: application.end_date,
                created_by: requestor.id,
                schedule_type: application.application_type,
                verify_by: req.user.id,
                verify_timestamp: expect.any(Date),
                last_update_by: req.user.id
            }, { transaction });
            expect(Notification.create).toHaveBeenCalledWith({
                notification_type: 'Approved',
                content: expect.stringContaining('has approved your'),
                read_status: 0,
                sender_id: approver.id,
                recipient_id: requestor.id,
                linked_application_id: application.application_id,
                created_by: approver.id,
                last_update_by: approver.id
            }, { transaction });
            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Application approved successfully" });
        });

        it('should return 500 and rollback transaction if an error occurs', async () => {
            Application.findByPk.mockRejectedValue(new Error('Database error'));

            await approvePendingApplication(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "An error occurred while approving the application", error: expect.anything() });
        });
    });

    describe('rejectPendingApplication', () => {
        let req, res, transaction;

        beforeEach(() => {
            req = {
                user: { id: 2 },
                body: { application_id: 1, approverRemarks: 'Rejected due to conflict' },
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            transaction = {
                commit: jest.fn(),
                rollback: jest.fn(),
            };

            sequelize.transaction.mockResolvedValue(transaction);
            jest.clearAllMocks();
        });

        it('should return 404 if application is not found', async () => {
            Application.findByPk.mockResolvedValue(null);

            await rejectPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application not found' });
        });

        it('should return 400 if application is not in Pending status', async () => {
            Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Approved', start_date: '2024-10-01', created_by: 1 });

            await rejectPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application is not in Pending status' });
        });

        it('should return 400 if application start date has passed', async () => {
            const application = { application_id: 1, status: 'Pending', start_date: '2024-09-01', created_by: 1 };
            Application.findByPk.mockResolvedValue(application);
            scheduleHasNotPassedCurrentDay.mockReturnValue(true);

            await rejectPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Cannot reject application which has started' });
        });

        it('should return 400 if approver is not the direct reporting manager', async () => {
            const application = { application_id: 1, status: 'Pending', start_date: '2024-10-01', created_by: 1 };
            const requestor = { id: 1, reporting_manager: 3 };
            const approver = { id: 2 };

            scheduleHasNotPassedCurrentDay.mockReturnValue(false);
            Application.findByPk.mockResolvedValue(application);
            Employee.findByPk.mockResolvedValueOnce(requestor).mockResolvedValueOnce(approver);

            await rejectPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Only the direct reporting manager can reject this application' });
        });

        it('should successfully reject the application', async () => {
            const application = {
                application_id: 1,
                status: 'Pending',
                start_date: '2024-10-01',
                created_by: 1,
                application_type: 'WFH',
                save: jest.fn().mockResolvedValue(true),
            };
            const requestor = { id: 1, reporting_manager: 2 };
            const approver = { id: 2 };

            scheduleHasNotPassedCurrentDay.mockReturnValue(false);
            Application.findByPk.mockResolvedValue(application);
            Employee.findByPk.mockResolvedValueOnce(requestor).mockResolvedValueOnce(approver);
            Notification.create.mockResolvedValue({});

            await rejectPendingApplication(req, res);

            expect(application.save).toHaveBeenCalledWith({ transaction });
            expect(Notification.create).toHaveBeenCalledWith({
                notification_type: 'Rejected',
                content: expect.stringContaining('has rejected your'),
                read_status: 0,
                sender_id: approver.id,
                recipient_id: requestor.id,
                linked_application_id: application.application_id,
                created_by: approver.id,
                last_update_by: approver.id
            }, { transaction });
            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application rejected successfully' });
        });

        it('should handle errors and rollback the transaction if an error occurs', async () => {
            Application.findByPk.mockRejectedValue(new Error('Database error'));

            await rejectPendingApplication(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'An error occurred while rejecting the application',
                error: expect.any(Error)
            });
        });
    });

    describe('withdrawPendingApplication', () => {
        let req, res;

        beforeEach(() => {
            req = { user: { id: 1 }, body: { application_id: 1 } };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            jest.clearAllMocks();
        });

        it('should return 400 if employee is not found', async () => {
            Employee.findByPk.mockResolvedValue(null); // Employee not found

            await withdrawPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Employee not found' });
        });

        it('should return 404 if the employee id is not found', async () => {
            const employee = { id: null, reporting_manager: 1 };
            Employee.findByPk.mockResolvedValueOnce(employee); // Employee exists without a reporting manager

            await withdrawPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Staff ID not found' });
        });

        it('should return 404 if the reporting manager is not found', async () => {
            const employee = { id: 1, reporting_manager: null };
            Employee.findByPk.mockResolvedValueOnce(employee); // Employee exists without a reporting manager

            await withdrawPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Reporting Manager not found." });
        });

        it('should return 404 if reporting manager information is not found', async () => {
            const employee = { id: 1, reporting_manager: 2 };
            Employee.findByPk.mockResolvedValueOnce(employee).mockResolvedValueOnce(null); // Reporting manager not found

            await withdrawPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Reporting Manager Information not found." });
        });

        it('should return 404 if application is not found', async () => {
            const employee = { id: 1, reporting_manager: 2 };
            const manager = { id: 2 };

            Employee.findByPk
                .mockResolvedValueOnce(employee) // First call for current employee
                .mockResolvedValueOnce(manager); // Second call for manager information
            Application.findOne.mockResolvedValue(null);

            await withdrawPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application not found or not authorized' });
        });

        it('should update application status to Withdrawn if all conditions are met', async () => {
            const application = {
                application_id: 1,
                status: 'Pending',
                created_by: 1,
                save: jest.fn().mockResolvedValue(true),
            };
            const currentEmployee = { id: 1, reporting_manager: 2 };
            const managerInfo = { id: 2 };

            Employee.findByPk.mockResolvedValueOnce(currentEmployee).mockResolvedValueOnce(managerInfo);
            Application.findOne.mockResolvedValue(application);
            sendNotificationEmail.mockResolvedValue(true); // Mock email sending

            await withdrawPendingApplication(req, res);

            expect(application.status).toBe('Withdrawn');
            expect(application.save).toHaveBeenCalled();
            expect(sendNotificationEmail).toHaveBeenCalledWith(application, currentEmployee, managerInfo, "withdrawnApplication");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Application updated to withdrawn successfully',
                application: application,
            });
        });

        it('should handle errors and return 500 if an error occurs', async () => {
            const application = {
                application_id: 1,
                status: 'Pending',
                created_by: 1,
                save: jest.fn().mockResolvedValue(true),
            };
            const currentEmployee = { id: 1, reporting_manager: 2 };
            const managerInfo = { id: 2 };

            Employee.findByPk.mockResolvedValueOnce(currentEmployee).mockResolvedValueOnce(managerInfo);
            Application.findOne.mockRejectedValue(new Error('Database error'));
            sendNotificationEmail.mockResolvedValue(true); // Mock email sending

            await withdrawPendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'An error occurred', error: expect.any(Error) });
        });
    });

    describe('withdrawApprovedApplication', () => {
        let req, res, transaction;

        beforeEach(() => {
            req = {
                user: { id: 1 },
                body: { application_id: 1, remarks: "Withdrawing application" }
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            transaction = {
                commit: jest.fn(),
                rollback: jest.fn()
            };

            jest.clearAllMocks();
            sequelize.transaction.mockResolvedValue(transaction);
        });

        it('should return 404 if application is not found', async () => {
            Application.findByPk.mockResolvedValue(null);

            await withdrawApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application not found or not authorized' });
        });

        it('should return 400 if application start date has passed', async () => {
            const application = { application_id: 1, start_date: '2024-09-01' };
            Application.findByPk.mockResolvedValue(application);
            scheduleHasNotPassedCurrentDay.mockReturnValue(true); // Indicates the start date has passed

            await withdrawApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Cannot withdraw application which has started" });
        });

        it('should return 404 if requestor or approver is not found', async () => {
            const application = { application_id: 1, created_by: 2, start_date: '2024-10-01' };
            Application.findByPk.mockResolvedValue(application);
            scheduleHasNotPassedCurrentDay.mockReturnValue(false); // Start date has not passed
            Employee.findByPk.mockResolvedValueOnce(null); // Requestor not found

            await withdrawApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Requestor or Approver not found' });
        });

        it('should return 400 if approver is not the direct reporting manager', async () => {
            const application = { application_id: 1, created_by: 2, start_date: '2024-10-01' };
            const requestor = { id: 2, reporting_manager: 3 }; // Different manager ID
            const approver = { id: 1 };

            Application.findByPk.mockResolvedValue(application);
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);
            Employee.findByPk.mockResolvedValueOnce(requestor).mockResolvedValueOnce(approver);

            await withdrawApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Only the direct reporting manager can withdraw this application" });
        });

        it('should return 404 if schedule is not found', async () => {
            const application = {
                application_id: 1,
                created_by: 2,
                start_date: '2024-10-01',
                end_date: '2024-10-10'
            };
            const requestor = { id: 2, reporting_manager: 1 };
            const approver = { id: 1 };

            Application.findByPk.mockResolvedValue(application);
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);
            Employee.findByPk.mockResolvedValueOnce(requestor).mockResolvedValueOnce(approver);
            Schedule.findOne.mockResolvedValue(null); // No linked schedule found

            await withdrawApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Schedule not found' });
        });

        it('should withdraw the application successfully if no conflicts are found', async () => {
            const application = {
                application_id: 1,
                status: 'Approved',
                start_date: '2024-10-01',
                end_date: '2024-10-10',
                created_by: 2,
                application_type: 'WFH',
                save: jest.fn().mockResolvedValue(true)
            };
            const requestor = { id: 2, reporting_manager: 1 };
            const approver = { id: 1 };
            const schedule = {
                start_date: '2024-10-01',
                end_date: '2024-10-10',
                created_by: 2,
                schedule_type: 'WFH',
                destroy: jest.fn().mockResolvedValue(true)
            };

            Application.findByPk.mockResolvedValue(application);
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);
            Employee.findByPk.mockResolvedValueOnce(requestor).mockResolvedValueOnce(approver);
            Schedule.findOne.mockResolvedValue(schedule);
            Notification.create.mockResolvedValue({});

            await withdrawApprovedApplication(req, res);

            expect(application.save).toHaveBeenCalledWith();
            expect(schedule.destroy).toHaveBeenCalledWith();
            expect(Notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    notification_type: 'Withdrawn',
                    content: expect.stringContaining('has withdrawn your approved'),
                    sender_id: approver.id,
                    recipient_id: requestor.id,
                    linked_application_id: req.body.application_id,
                    created_by: approver.id,
                    last_update_by: approver.id
                }),
                { transaction }
            );
            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Application updated to withdrawn successfully'
            });
        });

        it('should handle errors and return 500 if an error is thrown', async () => {
            Application.findByPk.mockRejectedValue(new Error('Database error'));

            await withdrawApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'An error occurred',
                error: 'Database error'
            });
        });
    });

    describe('withdrawApprovedApplicationByEmployee', () => {
        let req, res, transaction;

        beforeEach(() => {
            req = {
                user: { id: 1 },
                body: { application_id: 1 }
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            transaction = {
                commit: jest.fn(),
                rollback: jest.fn()
            };

            jest.clearAllMocks();
            sequelize.transaction.mockResolvedValue(transaction);
        });

        it('should return 404 if employee is not found', async () => {
            const applicationInfo = {
                application_id: 1,
                status: 'Approved',
                start_date: '2024-10-01',
                end_date: '2024-10-10',
                created_by: 1,
                application_type: 'WFH'
            };

            Application.findByPk.mockResolvedValue(applicationInfo);
            Employee.findByPk.mockResolvedValue(null);

            await withdrawApprovedApplicationByEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Employee not found." });
        });

        it('should return 404 if reporting manager is not found', async () => {
            const applicationInfo = {
                application_id: 1,
                status: 'Approved',
                start_date: '2024-10-01',
                end_date: '2024-10-10',
                created_by: 1,
                application_type: 'WFH'
            };
            Application.findByPk.mockResolvedValue(applicationInfo);
            Employee.findByPk.mockResolvedValue({ id: 1, reporting_manager: null });

            await withdrawApprovedApplicationByEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Reporting Manager not found." });
        });

        it('should return 404 if approved application is not found', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            Employee.findByPk.mockResolvedValue(employeeInfo);
            Application.findByPk.mockResolvedValue(null);

            await withdrawApprovedApplicationByEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Approved application not found." });
        });

        it('should return 400 if application is not in Approved status', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const applicationInfo = { application_id: 1, status: 'Pending' };

            Employee.findByPk.mockResolvedValue(employeeInfo);
            Application.findByPk.mockResolvedValue(applicationInfo);

            await withdrawApprovedApplicationByEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Application is not in Approved status" });
        });

        it('should return 404 if application start date has passed', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const applicationInfo = { application_id: 1, status: 'Approved', start_date: '2024-09-01' };

            Employee.findByPk.mockResolvedValue(employeeInfo);
            Application.findByPk.mockResolvedValue(applicationInfo);
            scheduleHasNotPassedCurrentDay.mockReturnValue(true); // Indicates the start date has passed

            await withdrawApprovedApplicationByEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Cannot withdraw application which has started" });
        });

        it('should return 404 if linked schedule is not found', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const applicationInfo = {
                application_id: 1,
                status: 'Approved',
                start_date: '2024-10-01',
                end_date: '2024-10-10',
                created_by: 1,
                application_type: 'WFH'
            };

            Employee.findByPk.mockResolvedValue(employeeInfo);
            Application.findByPk.mockResolvedValue(applicationInfo);
            scheduleHasNotPassedCurrentDay.mockReturnValue(false); // Start date has not passed
            Schedule.findOne.mockResolvedValue(null); // No linked schedule found

            await withdrawApprovedApplicationByEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Linked application not found." });
        });

        it('should submit a withdrawal request successfully if no conflicts are found', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const applicationInfo = {
                application_id: 1,
                status: 'Approved',
                start_date: '2024-10-01',
                end_date: '2024-10-10',
                created_by: 1,
                application_type: 'WFH',
                save: jest.fn().mockResolvedValue(true)
            };
            const linkedSchedule = {
                start_date: '2024-10-01',
                end_date: '2024-10-10',
                created_by: 1,
                schedule_type: 'WFH'
            };

            Employee.findByPk.mockResolvedValue(employeeInfo);
            Application.findByPk.mockResolvedValue(applicationInfo);
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);
            Schedule.findOne.mockResolvedValue(linkedSchedule);
            Notification.create.mockResolvedValue({});

            await withdrawApprovedApplicationByEmployee(req, res);

            expect(applicationInfo.save).toHaveBeenCalledWith({ transaction });
            expect(Notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    notification_type: 'Pending',
                    content: expect.stringContaining('has submitted for a withdrawal of approved'),
                    sender_id: req.user.id,
                    recipient_id: employeeInfo.reporting_manager,
                    linked_application_id: applicationInfo.application_id,
                    created_by: req.user.id,
                    last_update_by: req.user.id
                }),
                { transaction }
            );
            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Your Withdrawal request of approved application successfully sent to the manager."
            });
        });

        it('should handle errors and return 500 if an error is thrown', async () => {
            Employee.findByPk.mockRejectedValue(new Error('Database error'));

            await withdrawApprovedApplicationByEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "An error occurred while withdrawing application."
            });
        });
    });

    describe('updatePendingApplication', () => {
        let req, res, transaction;

        beforeEach(() => {
            req = {
                user: { id: 1 },
                body: {
                    application_id: 1,
                    application_type: 'Regular',
                    originalStartDate: '2024-10-01',
                    originalEndDate: '2024-10-05',
                    newStartDate: '2024-10-10',
                    newEndDate: '2024-10-15',
                    requestor_remarks: 'Updated request',
                    recurrence_rule: 'week',
                    recurrence_end_date: '2024-12-01'
                },
                files: []
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            transaction = {
                commit: jest.fn(),
                rollback: jest.fn()
            };

            jest.clearAllMocks();
            sequelize.transaction.mockResolvedValue(transaction);
        });

        it('should return 404 if employee is not found', async () => {
            Employee.findByPk.mockResolvedValue(null);

            await updatePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Employee not found." });
        });

        it('should return 404 if reporting manager is not found', async () => {
            Employee.findByPk.mockResolvedValue({ id: 1, reporting_manager: null });

            await updatePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Reporting Manager not found." });
        });

        it('should return 400 if application ID is not provided', async () => {
            req.body.application_id = null;
            Employee.findByPk.mockResolvedValue({ id: 1, reporting_manager: 2 });

            await updatePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Application ID is required for updates." });
        });

        it('should return 404 if pending application is not found', async () => {
            Employee.findByPk.mockResolvedValue({ id: 1, reporting_manager: 2 });
            Application.findOne.mockResolvedValue(null);

            await updatePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Pending application not found." });
        });

        it('should return 400 if new dates overlap with existing pending applications', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const application = { application_id: 1, status: 'Pending', save: jest.fn() };

            Employee.findByPk.mockResolvedValue(employeeInfo);
            Application.findOne.mockResolvedValue(application);
            Application.findAll.mockResolvedValue([{ application_id: 2, start_date: '2024-10-12', end_date: '2024-10-14' }]); // Overlapping pending applications
            Schedule.findAll.mockResolvedValue([]);
            checkforOverlap.mockReturnValueOnce(true); // Mock overlap detection

            await updatePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid application period. Updated application cannot overlap with existing or approved applications." });
        });

        it('should return 400 if new dates overlap with approved applications', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const application = { application_id: 1, status: 'Pending', save: jest.fn() };

            Employee.findByPk.mockResolvedValue(employeeInfo);
            Application.findOne.mockResolvedValue(application);
            Application.findAll.mockResolvedValue([]);
            Schedule.findAll.mockResolvedValue([{ schedule_id: 1, start_date: '2024-10-12', end_date: '2024-10-14' }]); // Overlapping approved schedules
            checkforOverlap.mockReturnValueOnce(false).mockReturnValueOnce(true); // Mock overlap detection for approved schedules

            await updatePendingApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid application period. Updated application cannot overlap with existing or approved applications." });
        });

        it('should handle recurring application updates and detect overlaps within recurrence', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const application = { application_id: 1, status: 'Pending', save: jest.fn() };

            Employee.findByPk.mockResolvedValue(employeeInfo);
            Application.findOne.mockResolvedValue(application);
            Application.findAll.mockResolvedValue([]);
            Schedule.findAll.mockResolvedValue([]);
            checkforOverlap.mockReturnValueOnce(false); // No overlap initially
            Blacklist.findAll.mockResolvedValue([{ start_date: '2024-10-15', end_date: '2024-10-20' }]); // Overlap during recurrence

            await updatePendingApplication(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Application period overlaps with blacklist period." });
        });

        // it('should update application, handle recurrence, and commit transaction if no conflicts are found', async () => {
        //     const employeeInfo = { id: 1, reporting_manager: 2 };
        //     const application = {
        //         application_id: 1,
        //         status: 'Pending',
        //         save: jest.fn().mockResolvedValue(true),
        //         start_date: req.body.newStartDate,
        //         end_date: req.body.newEndDate,
        //         application_type: req.body.application_type,
        //         requestor_remarks: req.body.requestor_remarks,
        //         last_update_by: req.user.id
        //     };

        //     const transaction = {
        //         commit: jest.fn(),
        //         rollback: jest.fn()
        //     };
        //     sequelize.transaction.mockResolvedValue(transaction);

        //     Employee.findByPk.mockResolvedValue(employeeInfo);
        //     Application.findOne.mockResolvedValue(application);
        //     Application.findAll.mockResolvedValue([]); // No overlapping applications
        //     Schedule.findAll.mockResolvedValue([]);    // No overlapping schedules
        //     checkforOverlap.mockReturnValueOnce(false);
        //     Blacklist.findAll.mockResolvedValue([]);   // No overlapping blacklist entries

        //     // Set up req.body to trigger recurring application creation
        //     req.body.application_type = "Regular";
        //     req.body.recurrence_rule = 'week';
        //     req.body.recurrence_end_date = '2024-12-31'; // End date for recurrence

        //     Application.create = jest.fn().mockResolvedValue(true); // Mock Application.create for recurrences

        //     await updatePendingApplication(req, res);

        //     // Verify that application.save and transaction.commit are called for the update
        //     expect(application.save).toHaveBeenCalledWith({ transaction });
        //     expect(transaction.commit).toHaveBeenCalled();

        //     // Verify that Application.create is called for recurring dates
        //     expect(Application.create).toHaveBeenCalled();
        //     expect(res.status).toHaveBeenCalledWith(200);
        //     expect(res.json).toHaveBeenCalledWith({
        //         message: "Pending application successfully updated.",
        //         result: application
        //     });
        // });

        it('should handle errors and return 500 if an exception is thrown', async () => {
            Employee.findByPk.mockRejectedValue(new Error('Database error'));

            await updatePendingApplication(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "An error occurred while updating the application."
            });
        });
    });

    describe('updateApprovedApplication', () => {
        let req, res, transaction;

        beforeEach(() => {
            req = {
                user: { id: 1 },
                body: {
                    application_id: 1,
                    application_type: 'Regular',
                    originalStartDate: '2024-01-01',
                    originalEndDate: '2024-01-07',
                    newStartDate: '2024-01-08',
                    newEndDate: '2024-01-15',
                    requestor_remarks: 'Updated remarks',
                    recurrence_rule: 'week',
                    recurrence_end_date: '2024-12-31'
                },
                files: []
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            transaction = {
                commit: jest.fn(),
                rollback: jest.fn()
            };
            sequelize.transaction.mockResolvedValue(transaction);

            // Clear all mocks before each test
            jest.clearAllMocks();
        });

        // it('should update the application, handle recurrence, and commit transaction if no conflicts are found', async () => {
        //     const employeeInfo = { id: 1, reporting_manager: 2 };
        //     const application = {
        //         application_id: 1,
        //         status: 'Approved',
        //         save: jest.fn().mockResolvedValue(true)
        //     };
        //     const schedule = { destroy: jest.fn().mockResolvedValue(true) };

        //     // Set up mocks for the required methods
        //     Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce({ id: 2 });
        //     Application.findOne.mockResolvedValue(application);
        //     Schedule.findOne.mockResolvedValue(schedule);
        //     Application.findAll.mockResolvedValue([]); // No overlapping applications
        //     Schedule.findAll.mockResolvedValue([]);    // No overlapping schedules
        //     checkforOverlap.mockReturnValue(false); // No conflicts
        //     Blacklist.findAll.mockResolvedValue([]); // No blacklist conflicts
        //     Application.create.mockResolvedValue(true); // Mock for creating recurrence applications

        //     await updateApprovedApplication(req, res);

        //     // Assertions
        //     expect(application.save).toHaveBeenCalled();
        //     expect(schedule.destroy).toHaveBeenCalled();
        //     expect(Application.create).toHaveBeenCalled(); // Verify recurrence creation
        //     expect(transaction.commit).toHaveBeenCalled();
        //     expect(res.status).toHaveBeenCalledWith(500);
        //     expect(res.json).toHaveBeenCalledWith({
        //         message: "Application has been updated for manager approval"
        //     });
        // });

        it('should return 404 if employee is not found', async () => {
            Employee.findByPk.mockResolvedValue(null);

            await updateApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Employee not found." });
        });

        it('should return 404 if reporting manager is not found', async () => {
            const employeeInfo = { id: 1, reporting_manager: null };
            Employee.findByPk.mockResolvedValue(employeeInfo);

            await updateApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Reporting Manager not found." });
        });

        it('should return 404 if application does not exist or is not approved', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce({ id: 2 });
            Application.findOne.mockResolvedValue(null); // Application not found

            await updateApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Pending application not found." });
        });

        it('should return 404 if schedule does not exist for the application dates', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const application = { application_id: 1, status: 'Approved' };

            Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce({ id: 2 });
            Application.findOne.mockResolvedValue(application);
            Schedule.findOne.mockResolvedValue(null); // Schedule not found

            await updateApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Pending schedule not found." });
        });

        it('should return 400 if there are conflicts with existing applications or schedules', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const application = { application_id: 1, status: 'Approved' };
            const schedule = { destroy: jest.fn().mockResolvedValue(true) };

            Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce({ id: 2 });
            Application.findOne.mockResolvedValue(application);
            Schedule.findOne.mockResolvedValue(schedule);
            Application.findAll.mockResolvedValue([{ application_id: 2 }]); // Conflict found
            checkforOverlap.mockReturnValue(true); // Mock overlap detection

            await updateApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Invalid application period. Updated application cannot overlap with existing or approved applications."
            });
        });

        it('should return 404 if there is an error creating the new application', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const application = {
                application_id: 1,
                status: 'Approved',
                save: jest.fn().mockResolvedValue(true)
            };
            const schedule = { destroy: jest.fn().mockResolvedValue(true) };

            Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce({ id: 2 });
            Application.findOne.mockResolvedValue(application);
            Schedule.findOne.mockResolvedValue(schedule);
            Application.findAll.mockResolvedValue([]); // No overlapping applications
            Schedule.findAll.mockResolvedValue([]);    // No overlapping schedules
            checkforOverlap.mockReturnValue(false); // No conflicts
            Blacklist.findAll.mockResolvedValue([]); // No blacklist conflicts
            Application.create.mockResolvedValue(null); // New application creation fails

            await updateApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Error creating a new application" });
        });

        it('should return 500 if an error occurs during the update process', async () => {
            const employeeInfo = { id: 1, reporting_manager: 2 };
            const schedule = { destroy: jest.fn().mockResolvedValue(true) };
            const error = new Error('Database error');

            Employee.findByPk.mockResolvedValueOnce(employeeInfo).mockResolvedValueOnce({ id: 2 });
            Application.findOne.mockRejectedValue(error);
            Schedule.findOne.mockResolvedValue(schedule);
            Application.findAll.mockResolvedValue([]); // No overlapping applications
            Schedule.findAll.mockResolvedValue([]);    // No overlapping schedules
            checkforOverlap.mockReturnValue(false); // No conflicts
            Blacklist.findAll.mockResolvedValue([]); // No blacklist conflicts
            Application.create.mockResolvedValue(true); // Recurring event creation mock

            await updateApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "An error occurred while retrieving the schedule."
            });
        });
    });

    describe('rejectWithdrawalOfApprovedApplication', () => {
        let req, res;

        beforeEach(() => {
            req = {
                user: { id: 2 },
                body: { application_id: 1 }
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            jest.clearAllMocks();
        });

        it('should return 404 if application is not found', async () => {
            Application.findByPk.mockResolvedValue(null);

            await rejectWithdrawalOfApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Application not found or not authorized' });
        });

        it('should return 404 if application has already started', async () => {
            const application = {
                application_id: 1,
                start_date: '2023-01-01'
            };

            Application.findByPk.mockResolvedValue(application);
            scheduleHasNotPassedCurrentDay.mockReturnValue(true);

            await rejectWithdrawalOfApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Cannot withdraw application which has started' });
        });

        it('should return 404 if requestor or approver is not found', async () => {
            const application = { application_id: 1, created_by: 3, start_date: '2024-01-01' };

            Application.findByPk.mockResolvedValue(application);
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);
            Employee.findByPk.mockResolvedValueOnce(null); // Requestor not found

            await rejectWithdrawalOfApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Requestor or Approver not found' });
        });

        it('should return 404 if approver is not the direct reporting manager', async () => {
            const application = { application_id: 1, created_by: 3, start_date: '2024-01-01' };
            const requestor = { id: 3, reporting_manager: 4 };
            const approver = { id: 2 }; // Not the reporting manager

            Application.findByPk.mockResolvedValue(application);
            scheduleHasNotPassedCurrentDay.mockReturnValue(false);
            Employee.findByPk.mockResolvedValueOnce(requestor).mockResolvedValueOnce(approver);

            await rejectWithdrawalOfApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Only the direct reporting manager can reject this withdrawal of approved application' });
        });

        // it('should update application status to "Approved" and return 200 if valid conditions are met', async () => {
        //     const application = {
        //         application_id: 1,
        //         created_by: 3,
        //         start_date: '2024-01-01',
        //         status: 'Withdrawn',
        //         save: jest.fn().mockResolvedValue(true)
        //     };
        //     const requestor = { id: 3, reporting_manager: 2 };
        //     const approver = { id: 2 };

        //     Application.findByPk.mockResolvedValue(application);
        //     scheduleHasNotPassedCurrentDay.mockReturnValue(true);
        //     Employee.findByPk.mockResolvedValueOnce(requestor).mockResolvedValueOnce(approver);

        //     await rejectWithdrawalOfApprovedApplication(req, res);

        //     expect(application.status).toBe('Approved');
        //     expect(application.last_update_by).toBe(req.user.id);
        //     expect(application.save).toHaveBeenCalled();
        //     expect(res.status).toHaveBeenCalledWith(200);
        //     expect(res.json).toHaveBeenCalledWith({ message: 'Reject withdrawal of approved application successfully' });
        // });

        it('should return 500 if there is an internal error', async () => {
            Application.findByPk.mockRejectedValue(new Error('Database error'));

            await rejectWithdrawalOfApprovedApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'An error occurred while approving withdrawal of approved application.'
            });
        });
    });

    describe('withdrawSpecificDates', () => {
        let req, res, transaction;
    
        beforeEach(() => {
            req = {
                body: {
                    application_id: 1,
                    withdrawDates: ['2024-01-02', '2024-01-03'],
                    remarks: 'Withdrawing specific dates',
                },
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            transaction = sequelize.transaction();
            jest.clearAllMocks();
        });
    
        it('should successfully withdraw specific dates and create new applications for remaining dates', async () => {
            const existingApprovedApp = {
                application_id: 1,
                dataValues: { start_date: '2024-01-01', end_date: '2024-01-05' },
                status: 'Approved',
                save: jest.fn().mockResolvedValue(true),
            };
    
            const remainingDates = [['2024-01-01'], ['2024-01-04', '2024-01-05']];
    
            Application.findOne.mockResolvedValue(existingApprovedApp);
            splitConsecutivePeriodByDay.mockReturnValue([
                '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05',
            ]);
            extractRemainingDates.mockReturnValue(remainingDates);
            deleteCorrespondingSchedule.mockResolvedValue(true);
            retrieveFileDetails.mockResolvedValue([]);
    
            // Spy on createSimilarApplication within the same module
            const createSimilarApplicationSpy = jest.spyOn(applicationController, 'createSimilarApplication').mockResolvedValue(true);
    
            await applicationController.withdrawSpecificDates(req, res);
    
            expect(Application.findOne).toHaveBeenCalledWith({
                where: { application_id: 1, status: 'Approved' },
            });
            expect(existingApprovedApp.save).toHaveBeenCalledWith({ transaction });
            expect(transaction.commit).toHaveBeenCalled();
            expect(deleteCorrespondingSchedule).toHaveBeenCalledWith(existingApprovedApp);
            expect(createSimilarApplicationSpy).toHaveBeenCalledTimes(2); // Called for each block in remainingDates
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Specific dates successfully withdrawn.",
            });
        });

        it('should return 404 if no approved application is found', async () => {
            Application.findOne.mockResolvedValue(null);

            await withdrawSpecificDates(req, res);

            expect(Application.findOne).toHaveBeenCalledWith({
                where: { application_id: 1, status: 'Approved' },
            });
            expect(transaction.commit).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "An error occurred while withdrawing specific dates.",
            });
        });

        it('should return 500 if an error occurs while updating the application status', async () => {
            const existingApprovedApp = {
                application_id: 1,
                dataValues: { start_date: '2024-01-01', end_date: '2024-01-05' },
                status: 'Approved',
                save: jest.fn().mockRejectedValue(new Error('Update error')),
            };

            Application.findOne.mockResolvedValue(existingApprovedApp);
            splitConsecutivePeriodByDay.mockReturnValue([
                '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05',
            ]);

            await withdrawSpecificDates(req, res);

            expect(existingApprovedApp.save).toHaveBeenCalledWith({ transaction });
            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "An error occurred while updating existing application.",
            });
        });

        it('should return 500 if an error occurs while deleting the schedule', async () => {
            const existingApprovedApp = {
                application_id: 1,
                dataValues: { start_date: '2024-01-01', end_date: '2024-01-05' },
                status: 'Approved',
                save: jest.fn().mockResolvedValue(true),
            };

            Application.findOne.mockResolvedValue(existingApprovedApp);
            splitConsecutivePeriodByDay.mockReturnValue([
                '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05',
            ]);
            deleteCorrespondingSchedule.mockRejectedValue(new Error('Delete schedule error'));

            await withdrawSpecificDates(req, res);

            expect(existingApprovedApp.save).toHaveBeenCalledWith({ transaction });
            expect(deleteCorrespondingSchedule).toHaveBeenCalledWith(existingApprovedApp);
            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "An error occurred while deleting corresponding schedule.",
            });
        });

        it('should return 500 if an error occurs while creating new applications for remaining dates', async () => {
            const existingApprovedApp = {
                application_id: 1,
                dataValues: { start_date: '2024-01-01', end_date: '2024-01-05' },
                status: 'Approved',
                save: jest.fn().mockResolvedValue(true),
            };

            const remainingDates = [['2024-01-01'], ['2024-01-04', '2024-01-05']];

            Application.findOne.mockResolvedValue(existingApprovedApp);
            splitConsecutivePeriodByDay.mockReturnValue([
                '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05',
            ]);
            extractRemainingDates.mockReturnValue(remainingDates);
            deleteCorrespondingSchedule.mockResolvedValue(true);
            retrieveFileDetails.mockResolvedValue([]);

            const createSimilarApplicationSpy = jest.spyOn(require('../controllers/applicationController'), 'createSimilarApplication').mockRejectedValue(new Error('Create application error'));

            await withdrawSpecificDates(req, res);

            expect(existingApprovedApp.save).toHaveBeenCalledWith({ transaction });
            expect(deleteCorrespondingSchedule).toHaveBeenCalledWith(existingApprovedApp);
            expect(transaction.rollback).toHaveBeenCalled();
            expect(createSimilarApplicationSpy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "An error occurred while creating new application.",
            });
        });
    });

    describe('createSimilarApplication', () => {
        let transaction;

        beforeEach(() => {
            transaction = {
                commit: jest.fn(),
                rollback: jest.fn(),
            };
            sequelize.transaction.mockResolvedValue(transaction); // Mock transaction with commit and rollback
            jest.clearAllMocks();
        });

        it('should create a new application and commit transaction if no overlaps are found', async () => {
            const newStartEnd = ['2024-01-10', '2024-01-15'];
            const existingApprovedApp = {
                application_id: 1,
                start_date: new Date('2024-01-01T08:00:00Z'),
                end_date: new Date('2024-01-05T17:00:00Z'),
                created_by: 3,
                application_type: 'Regular',
                verify_by: 2,
                requestor_remarks: 'Initial remarks',
                approver_remarks: 'Approved remarks',
                verify_timestamp: new Date('2024-01-05T10:00:00Z'),
            };
            const files = [{ file_id: 1, file_name: 'doc', file_extension: '.pdf', s3_key: 'old-key' }];
            const isFirstBlock = true;

            retrieveFileDetails.mockResolvedValue(files);
            checkforOverlap.mockReturnValue(false);
            Application.findAll.mockResolvedValue([]); // No conflicting applications
            Schedule.findAll.mockResolvedValue([]); // No conflicting schedules
            Application.create.mockResolvedValue({ application_id: 2 });
            Schedule.create.mockResolvedValue(true);
            copyFileInS3.mockResolvedValue(true);
            updateFileDetails.mockResolvedValue(true);

            const result = await createSimilarApplication(newStartEnd, existingApprovedApp, files, isFirstBlock);

            expect(result.status).toBe(201);
            expect(Application.create).toHaveBeenCalled();
            expect(Schedule.create).toHaveBeenCalled();
            expect(transaction.commit).toHaveBeenCalled(); // Ensure transaction.commit is called
        });

        it('should return 400 if there is an overlap with existing applications or schedules', async () => {
            const newStartEnd = ['2024-01-10', '2024-01-15'];
            const existingApprovedApp = { application_id: 1, start_date: new Date('2024-01-01'), end_date: new Date('2024-01-05') };
            const files = [];

            checkforOverlap.mockReturnValue(true); // Simulate overlap

            const result = await createSimilarApplication(newStartEnd, existingApprovedApp, files, true);

            expect(result.status).toBe(400);
            expect(result.message).toBe("Invalid application period. New application cannot overlap with the existing or approved application.");
        });

        it('should return 500 if there is an error during application creation', async () => {
            const newStartEnd = ['2024-01-10', '2024-01-15'];
            const existingApprovedApp = {
                application_id: 1,
                start_date: new Date('2024-01-01T08:00:00Z'),
                end_date: new Date('2024-01-05T17:00:00Z'),
                created_by: 3,
                application_type: 'Regular',
                verify_by: 2,
                requestor_remarks: 'Initial remarks',
                approver_remarks: 'Approved remarks',
                verify_timestamp: new Date('2024-01-05T10:00:00Z'),
            };
            const files = [{ file_id: 1, file_name: 'doc', file_extension: '.pdf', s3_key: 'old-key' }];
            const isFirstBlock = true;

            retrieveFileDetails.mockResolvedValue(files);
            checkforOverlap.mockReturnValue(false);
            Application.findAll.mockResolvedValue([]); // No conflicting applications
            Schedule.findAll.mockResolvedValue([]); // No conflicting schedules
            Application.create.mockRejectedValue(new Error('Database error')); // Simulate error during application creation
            Schedule.create.mockResolvedValue(true);
            copyFileInS3.mockResolvedValue(true);
            updateFileDetails.mockResolvedValue(true);

            const result = await createSimilarApplication(newStartEnd, existingApprovedApp, files, true);

            expect(result.status).toBe(500);
            expect(result.error).toBe("An error occurred while creating new application.");
            expect(transaction.rollback).toHaveBeenCalled();
        });

        it('should return 500 if there is an error while copying files', async () => {
            const newStartEnd = ['2024-01-10', '2024-01-15'];
            const existingApprovedApp = {
                application_id: 1,
                start_date: new Date('2024-01-01'),
                end_date: new Date('2024-01-05'),
                created_by: 3,
            };
            const files = [{ file_id: 1, file_name: 'doc', file_extension: '.pdf', s3_key: 'old-key' }];

            retrieveFileDetails.mockResolvedValue(files);
            checkforOverlap.mockReturnValue(false);
            copyFileInS3.mockRejectedValue(new Error('S3 copy error'));

            const result = await createSimilarApplication(newStartEnd, existingApprovedApp, files, true);

            expect(result.status).toBe(500);
            expect(result.error).toBe("An error occurred while creating new application.");
            expect(transaction.rollback).toHaveBeenCalled();
        });
    });
});