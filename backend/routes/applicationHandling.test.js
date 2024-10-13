const request = require('supertest');
const express = require('express');
const router = require('../routes/applicationHandling');
const applicationController = require('../controllers/applicationController');

// Mock the middleware and controller
jest.mock('../controllers/applicationController', () => ({
    retrieveApplications: jest.fn(),
    retrievePendingApplications: jest.fn(),
    createNewApplication: jest.fn(),
    approvePendingApplication: jest.fn(),
    rejectPendingApplication: jest.fn(),
    withdrawPendingApplication: jest.fn(),
    withdrawApprovedApplication: jest.fn(),
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

    describe('GET /retrieveApplication', () => {
        it('should retrieve applications when valid parameters are provided', async () => {
            applicationController.retrieveApplications.mockImplementation((req, res) => res.status(200).json({ message: 'Success' }));

            const response = await request(app)
                .get('/retrieveApplication')
                .query({ id: 1, status: 'Pending' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Success' });
            expect(applicationController.retrieveApplications).toHaveBeenCalled();
        });

        it('should return 422 for invalid query parameters', async () => {
            const response = await request(app)
                .get('/retrieveApplication')
                .query({ id: 'invalid', status: 'Pending' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invaild Input Received');
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
            expect(response.body).toHaveProperty('message', 'Invaild Input Received');
        });
    });

    describe('PUT /approveApplication', () => {
        it('should approve an application when valid data is provided', async () => {
            applicationController.approvePendingApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Application Approved' }));

            const response = await request(app)
                .put('/approveApplication')
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
                .put('/approveApplication')
                .send({
                    application_id: 'invalid',
                    approverRemarks: 'Approved'
                });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invaild Input Received');
        });
    });

    describe('PUT /rejectApplication', () => {
        it('should reject an application when valid data is provided', async () => {
            applicationController.rejectPendingApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Application Rejected' }));

            const response = await request(app)
                .put('/rejectApplication')
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
                .put('/rejectApplication')
                .send({
                    application_id: 'invalid',
                    approverRemarks: 'Rejected'
                });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invaild Input Received');
        });
    });

    describe('PUT /withdrawPending', () => {
        it('should withdraw a pending application when valid data is provided', async () => {
            applicationController.withdrawPendingApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Application Withdrawn' }));

            const response = await request(app)
                .put('/withdrawPending')
                .send({ application_id: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Application Withdrawn' });
            expect(applicationController.withdrawPendingApplication).toHaveBeenCalled();
        });

        it('should return 422 for invalid input data', async () => {
            const response = await request(app)
                .put('/withdrawPending')
                .send({ application_id: 'invalid' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invaild Input Received');
        });
    });

    describe('PUT /withdrawApproved', () => {
        it('should withdraw an approved application when valid data is provided', async () => {
            applicationController.withdrawApprovedApplication.mockImplementation((req, res) => res.status(200).json({ message: 'Approved Application Withdrawn' }));

            const response = await request(app)
                .put('/withdrawApproved')
                .send({ application_id: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Approved Application Withdrawn' });
            expect(applicationController.withdrawApprovedApplication).toHaveBeenCalled();
        });

        it('should return 422 for invalid input data', async () => {
            const response = await request(app)
                .put('/withdrawApproved')
                .send({ application_id: 'invalid' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invaild Input Received');
        });
    });
});
