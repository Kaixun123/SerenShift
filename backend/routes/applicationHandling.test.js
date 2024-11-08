const request = require('supertest');
const express = require('express');
const router = require('../routes/applicationHandling');
const applicationController = require('../controllers/applicationController');

// Mock the middleware and controller
jest.mock('../controllers/applicationController', () => ({
    retrieveApplications: jest.fn(),
    retrievePendingApplications: jest.fn(),
    retrieveApprovedApplications: jest.fn(),
    createNewApplication: jest.fn(),
    approvePendingApplication: jest.fn(),
    rejectPendingApplication: jest.fn(),
    withdrawPendingApplication: jest.fn(),
    withdrawApprovedApplication: jest.fn(),
    withdrawSpecificDates: jest.fn(),
    updatePendingApplication: jest.fn(),
    withdrawApprovedApplicationByEmployee: jest.fn(),
    rejectWithdrawalOfApprovedApplication: jest.fn(),
    updateApprovedApplication: jest.fn(),
}));

jest.mock('../middlewares/authMiddleware', () => ({
    ensureLoggedIn: (req, res, next) => next(),
    ensureManagerAndAbove: (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use(router);  // Add the router to the app

describe('Application Handling Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /retrieveApplications', () => {
        it('should retrieve applications when valid parameters are provided', async () => {
            applicationController.retrieveApplications.mockImplementation((req, res) => res.status(200).json({ message: 'Success' }));

            const response = await request(app)
                .get('/retrieveApplications')
                .query({ id: 1, status: 'Pending' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Success' });
            expect(applicationController.retrieveApplications).toHaveBeenCalled();
        });

        it('should return 422 for invalid query parameters', async () => {
            const response = await request(app)
                .get('/retrieveApplications')
                .query({ id: 'invalid', status: 'Pending' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });

    describe('GET /retrievePendingApplications', () => {
        it('should retrieve pending applications for manager', async () => {
            applicationController.retrievePendingApplications.mockImplementation((req, res) => res.status(200).json({ message: 'Pending Applications Retrieved' }));

            const response = await request(app)
                .get('/retrievePendingApplications');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Pending Applications Retrieved' });
            expect(applicationController.retrievePendingApplications).toHaveBeenCalled();
        });
    });

    describe('GET /retrieveApprovedApplications', () => {
        it('should retrieve approved applications for manager', async () => {
            applicationController.retrieveApprovedApplications.mockImplementation((req, res) => res.status(200).json({ message: 'Approved Applications Retrieved' }));

            const response = await request(app)
                .get('/retrieveApprovedApplications');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Approved Applications Retrieved' });
            expect(applicationController.retrieveApprovedApplications).toHaveBeenCalled();
        });
    });

    describe('POST /createNewApplication', () => {
        it('should create a new application when valid data is provided', async () => {
            applicationController.createNewApplication.mockImplementation((req, res) => res.status(201).json({ message: 'Application Created' }));

            const response = await request(app)
                .post('/createNewApplication')
                .send({
                    application_type: 'Regular',
                    startDate: '2024-10-01',
                    endDate: '2024-10-05',
                    requestor_remarks: 'Vacation'
                });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'Application Created' });
            expect(applicationController.createNewApplication).toHaveBeenCalled();
        });

        it('should return 422 for invalid input data', async () => {
            const response = await request(app)
                .post('/createNewApplication')
                .send({
                    application_type: 'InvalidType',
                    startDate: 'InvalidDate',
                    endDate: '2024-10-05'
                });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });

    describe('PATCH /approveApplication', () => {
        it('should approve an application when valid data is provided', async () => {
            applicationController.approvePendingApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Application Approved' }));

            const response = await request(app)
                .patch('/approveApplication')
                .send({
                    application_id: 1,
                    approverRemarks: 'Approved'
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Application Approved' });
            expect(applicationController.approvePendingApplication).toHaveBeenCalled();
        });

        it('should return 422 for invalid input data', async () => {
            const response = await request(app)
                .patch('/approveApplication')
                .send({
                    application_id: 'invalid',
                    approverRemarks: 'Approved'
                });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });

    describe('PATCH /rejectApplication', () => {
        it('should reject an application when valid data is provided', async () => {
            applicationController.rejectPendingApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Application Rejected' }));

            const response = await request(app)
                .patch('/rejectApplication')
                .send({
                    application_id: 1,
                    approverRemarks: 'Rejected'
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Application Rejected' });
            expect(applicationController.rejectPendingApplication).toHaveBeenCalled();
        });

        it('should return 422 for invalid input data', async () => {
            const response = await request(app)
                .patch('/rejectApplication')
                .send({
                    application_id: 'invalid',
                    approverRemarks: 'Rejected'
                });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });

    describe('PATCH /withdrawPending', () => {
        it('should withdraw a pending application when valid data is provided', async () => {
            applicationController.withdrawPendingApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Application Withdrawn' }));

            const response = await request(app)
                .patch('/withdrawPending')
                .send({ application_id: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Application Withdrawn' });
            expect(applicationController.withdrawPendingApplication).toHaveBeenCalled();
        });

        it('should return 422 for invalid input data', async () => {
            const response = await request(app)
                .patch('/withdrawPending')
                .send({ application_id: 'invalid' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });

    describe('PATCH /withdrawSpecificApproved', () => {
        it('should withdraw specific dates from approved application', async () => {
            applicationController.withdrawSpecificDates.mockImplementation((req, res) => res.status(200).json({ message: 'Specific Dates Withdrawn' }));

            const response = await request(app)
                .patch('/withdrawSpecificApproved')
                .send({ application_id: 1, withdrawDates: ['2024-10-03'] });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Specific Dates Withdrawn' });
            expect(applicationController.withdrawSpecificDates).toHaveBeenCalled();
        });
    });

    describe('PATCH /updatePendingApplication', () => {
        it('should update a pending application', async () => {
            applicationController.updatePendingApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Pending Application Updated' }));

            const response = await request(app)
                .patch('/updatePendingApplication')
                .send({ application_id: 1, newStartDate: '2024-10-05', newEndDate: '2024-10-10' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Pending Application Updated' });
            expect(applicationController.updatePendingApplication).toHaveBeenCalled();
        });
    });

    describe('PATCH /withdrawApprovedApplicationByEmployee', () => {
        it('should submit withdrawal request for approved application by employee', async () => {
            applicationController.withdrawApprovedApplicationByEmployee.mockImplementation((req, res) => res.status(200).json({ message: 'Withdrawal request sent to manager' }));

            const response = await request(app)
                .patch('/withdrawApprovedApplicationByEmployee')
                .send({ application_id: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Withdrawal request sent to manager' });
            expect(applicationController.withdrawApprovedApplicationByEmployee).toHaveBeenCalled();
        });
    });

    describe('PATCH /rejectWithdrawalOfApprovedApplication', () => {
        it('should reject withdrawal of approved application by manager', async () => {
            applicationController.rejectWithdrawalOfApprovedApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Reject withdrawal of approved application' }));

            const response = await request(app)
                .patch('/rejectWithdrawalOfApprovedApplication')
                .send({ application_id: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Reject withdrawal of approved application' });
            expect(applicationController.rejectWithdrawalOfApprovedApplication).toHaveBeenCalled();
        });
    });

    describe('PATCH /updateApprovedApplication', () => {
        it('should update an approved application', async () => {
            applicationController.updateApprovedApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Approved Application Updated' }));

            const response = await request(app)
                .patch('/updateApprovedApplication')
                .send({ application_id: 1, newStartDate: '2024-10-15', newEndDate: '2024-10-20' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Approved Application Updated' });
            expect(applicationController.updateApprovedApplication).toHaveBeenCalled();
        });
    });
});
