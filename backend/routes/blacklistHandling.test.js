const request = require('supertest');
const express = require('express');
const router = require('../routes/blacklistHandling');
const blacklistController = require('../controllers/blacklistController');

// Mock the middleware and controller
jest.mock('../controllers/blacklistController', () => ({
    getBlacklistDates: jest.fn(),
    getBlacklistDatesManager: jest.fn(),
    getBlacklistDate: jest.fn(),
    createBlacklistDate: jest.fn(),
    updateBlacklistDate: jest.fn(),
    deleteBlacklistDate: jest.fn(),
}));

jest.mock('../middlewares/authMiddleware', () => ({
    ensureLoggedIn: (req, res, next) => next(),
    ensureManagerAndAbove: (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Blacklist Handling Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /getBlockedDates', () => {
        it('should retrieve blacklist dates when valid parameters are provided', async () => {
            blacklistController.getBlacklistDates.mockImplementation((req, res) => res.status(200).json({ message: 'Blacklist Dates Retrieved' }));

            const response = await request(app)
                .get('/getBlockedDates')
                .query({ start_date: '2024-10-01', end_date: '2024-10-10' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Blacklist Dates Retrieved' });
            expect(blacklistController.getBlacklistDates).toHaveBeenCalled();
        });

        it('should return 422 for invalid query parameters', async () => {
            const response = await request(app)
                .get('/getBlockedDates')
                .query({ start_date: 'invalid-date', end_date: '2024-10-10' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });

    describe('GET /getBlacklistDates', () => {
        it('should retrieve blacklist dates for a manager', async () => {
            blacklistController.getBlacklistDatesManager.mockImplementation((req, res) => res.status(200).json({ message: 'Manager Blacklist Dates Retrieved' }));

            const response = await request(app)
                .get('/getBlacklistDates');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Manager Blacklist Dates Retrieved' });
            expect(blacklistController.getBlacklistDatesManager).toHaveBeenCalled();
        });
    });

    describe('GET /getBlacklistDate/:blacklist_id', () => {
        it('should retrieve a specific blacklist date', async () => {
            blacklistController.getBlacklistDate.mockImplementation((req, res) => res.status(200).json({ message: 'Blacklist Date Retrieved' }));

            const response = await request(app)
                .get('/getBlacklistDate/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Blacklist Date Retrieved' });
            expect(blacklistController.getBlacklistDate).toHaveBeenCalled();
        });

        it('should return 422 for invalid blacklist ID', async () => {
            const response = await request(app)
                .get('/getBlacklistDate/invalid-id');

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });

    describe('POST /createBlacklistDate', () => {
        it('should create a new blacklist date when valid data is provided', async () => {
            blacklistController.createBlacklistDate.mockImplementation((req, res) => res.status(201).json({ message: 'Blacklist Date Created Successfully' }));

            const response = await request(app)
                .post('/createBlacklistDate')
                .send({
                    startDateTime: '2024-11-01T00:00:00Z',
                    endDateTime: '2024-11-02T23:59:59Z',
                    remarks: 'Test Entry',
                    recurrenceRule: 'day',
                    recurrenceEndDate: '2024-11-05T23:59:59Z'
                });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'Blacklist Date Created Successfully' });
            expect(blacklistController.createBlacklistDate).toHaveBeenCalled();
        });

        it('should return 422 for invalid input data', async () => {
            const response = await request(app)
                .post('/createBlacklistDate')
                .send({
                    startDateTime: 'InvalidDate',
                    endDateTime: '2024-11-02T23:59:59Z',
                    remarks: 'Test Entry'
                });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });

    describe('PATCH /updateBlacklistDate/:blacklist_id', () => {
        it('should update an existing blacklist date', async () => {
            blacklistController.updateBlacklistDate.mockImplementation((req, res) => res.status(200).json({ message: 'Blacklist Date Updated Successfully' }));

            const response = await request(app)
                .patch('/updateBlacklistDate/1')
                .send({
                    startDateTime: '2024-12-01T00:00:00Z',
                    endDateTime: '2024-12-01T23:59:59Z',
                    remarks: 'Updated Remarks'
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Blacklist Date Updated Successfully' });
            expect(blacklistController.updateBlacklistDate).toHaveBeenCalled();
        });

        it('should return 422 for invalid update data', async () => {
            const response = await request(app)
                .patch('/updateBlacklistDate/1')
                .send({
                    startDateTime: 'InvalidDate',
                    endDateTime: '2024-12-01T23:59:59Z',
                    remarks: 'Updated Remarks'
                });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });

    describe('DELETE /deleteBlacklistDate/:blacklist_id', () => {
        it('should delete an existing blacklist date', async () => {
            blacklistController.deleteBlacklistDate.mockImplementation((req, res) => res.status(200).json({ message: 'Blacklist Date Deleted Successfully' }));

            const response = await request(app)
                .delete('/deleteBlacklistDate/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Blacklist Date Deleted Successfully' });
            expect(blacklistController.deleteBlacklistDate).toHaveBeenCalled();
        });

        it('should return 422 for invalid blacklist ID', async () => {
            const response = await request(app)
                .delete('/deleteBlacklistDate/invalid-id');

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });
});
