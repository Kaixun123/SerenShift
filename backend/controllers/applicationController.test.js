const { Application, Employee } = require('../models');
const { retrieveApplications, retrievePendingApplications, retrieveApprovedApplications } = require('../controllers/applicationController');
const { fetchSubordinates } = require('../services/common/employeeHelper');
const { scheduleIsAfterCurrentTime } = require('../services/common/scheduleHelper');
const { retrieveFileDetails } = require('../services/uploads/s3');
const { Op } = require('sequelize');

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
    }
}));

jest.mock('../services/common/employeeHelper');
jest.mock('../services/common/scheduleHelper');
jest.mock('../services/uploads/s3');

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
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'IT', position: 'Developer', country: 'US', email: 'john@example.com' }
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

            fetchSubordinates.mockResolvedValue(subordinates);
            Application.findAll.mockResolvedValue(applications);

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
                            last_update_timestamp: futureDate.toISOString()
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

// describe('createNewApplication', () => {
//     it('should return 400 if employee has no reporting manager', async () => {
//         const req = {
//             user: { id: 1 },
//             body: { application_type: 'Regular', startDate: '2024-10-01', endDate: '2024-10-10', requestor_remarks: 'Vacation' },
//             files: []
//         };
//         const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

//         Employee.findByPk.mockResolvedValue({ id: 1, reporting_manager: null });

//         await createNewApplication(req, res);

//         expect(res.status).toHaveBeenCalledWith(400);
//         expect(res.json).toHaveBeenCalledWith({ message: 'Reporting Manager not found.' });
//     });
// });

// describe('approvePendingApplication', () => {
//     it('should return 400 if application is not in Pending status', async () => {
//         const req = { user: { id: 2 }, body: { application_id: 1, approverRemarks: 'Approved' } };
//         const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
//         const transaction = { rollback: jest.fn() };

//         sequelize.transaction.mockResolvedValue(transaction);
//         Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Approved', start_date: '2024-10-01', created_by: 1 });

//         await approvePendingApplication(req, res);

//         expect(res.status).toHaveBeenCalledWith(400);
//         expect(res.json).toHaveBeenCalledWith({ message: 'Application is not in Pending status' });
//     });
// });

// describe('rejectPendingApplication', () => {
//     it('should return 400 if application is not in Pending status', async () => {
//         const req = { user: { id: 2 }, body: { application_id: 1, approverRemarks: 'Rejected' } };
//         const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
//         const transaction = { rollback: jest.fn() };

//         sequelize.transaction.mockResolvedValue(transaction);
//         Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Approved', start_date: '2024-10-01', created_by: 1 });

//         await rejectPendingApplication(req, res);

//         expect(res.status).toHaveBeenCalledWith(400);
//         expect(res.json).toHaveBeenCalledWith({ message: 'Application is not in Pending status' });
//     });

//     it('should return 400 if application start date has passed', async () => {
//         const req = { user: { id: 2 }, body: { application_id: 1, approverRemarks: 'Rejected' } };
//         const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
//         const transaction = { rollback: jest.fn() };

//         sequelize.transaction.mockResolvedValue(transaction);
//         Application.findByPk.mockResolvedValue({ application_id: 1, status: 'Pending', start_date: '2024-09-01', created_by: 1 });
//         scheduleHasNotPassedCurrentDay.mockReturnValue(true); // Indicates the start date has passed

//         await rejectPendingApplication(req, res);

//         expect(res.status).toHaveBeenCalledWith(400);
//         expect(res.json).toHaveBeenCalledWith({ message: 'Cannot reject application which has started' });
//     });
// });

// describe('withdrawPendingApplication', () => {
//     it('should return 404 if application is not found', async () => {
//         const req = { user: { id: 1 }, body: { application_id: 999 } };
//         const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

//         Application.findOne.mockResolvedValue(null);

//         await withdrawPendingApplication(req, res);

//         expect(res.status).toHaveBeenCalledWith(404);
//         expect(res.json).toHaveBeenCalledWith({ message: 'Application not found or not authorized' });
//     });

//     it('should return 404 if the user is not authorized to withdraw the application', async () => {
//         const req = { user: { id: 1 }, body: { application_id: 1 } };
//         const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

//         Application.findOne.mockResolvedValue({ application_id: 1, status: 'Pending', created_by: 2 }); // Created by a different user

//         await withdrawPendingApplication(req, res);

//         expect(res.status).toHaveBeenCalledWith(404);
//         expect(res.json).toHaveBeenCalledWith({ message: 'Application not found or not authorized' });
//     });
// });