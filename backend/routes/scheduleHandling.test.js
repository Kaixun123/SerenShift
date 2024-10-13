const request = require('supertest');
const express = require('express');
const router = require('../routes/scheduleHandling');
const scheduleController = require('../controllers/scheduleController');

// Create an express app for testing
const app = express();
app.use(express.json());
app.use(router);

// Mock controller methods and middleware
jest.mock('../controllers/scheduleController', () => ({
    retrieveOwnSchedule: jest.fn(),
    retrieveTeamSchedule: jest.fn(),
    retrieveSubordinateSchedule: jest.fn(),
}));

jest.mock('../middlewares/authMiddleware', () => ({
    ensureLoggedIn: (req, res, next) => next(),  // Mock to bypass auth middleware
    ensureManager: (req, res, next) => next(),   // Mock to bypass manager auth
    ensureHR: (req, res, next) => next(),        // Mock to bypass HR auth
}));

describe('Schedule Handling Routes', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /ownSchedule', () => {
        it('should retrieve the own schedule for the logged-in user', async () => {
            scheduleController.retrieveOwnSchedule.mockImplementation((req, res) => res.status(200).json([
                { title: 'WFH (Full Day)', start: '2024-10-10T08:00', end: '2024-10-10T17:00', allDay: true }
            ]));

            const response = await request(app)
                .get('/ownSchedule');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([
                { title: 'WFH (Full Day)', start: '2024-10-10T08:00', end: '2024-10-10T17:00', allDay: true }
            ]);
            expect(scheduleController.retrieveOwnSchedule).toHaveBeenCalled();
        });

        it('should return 404 if no schedule found', async () => {
            scheduleController.retrieveOwnSchedule.mockImplementation((req, res) => res.status(404).json({ message: 'No schedules found for this user.' }));

            const response = await request(app)
                .get('/ownSchedule');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'No schedules found for this user.' });
        });
    });

    describe('GET /teamSchedule', () => {
        it('should retrieve the team schedule', async () => {
            scheduleController.retrieveTeamSchedule.mockImplementation((req, res) => res.status(200).json({
                '2024-10-10': {
                    'Full Day': ['John Doe']
                }
            }));

            const response = await request(app)
                .get('/teamSchedule');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                '2024-10-10': {
                    'Full Day': ['John Doe']
                }
            });
            expect(scheduleController.retrieveTeamSchedule).toHaveBeenCalled();
        });

        it('should return 404 if no WFH schedules found for the team', async () => {
            scheduleController.retrieveTeamSchedule.mockImplementation((req, res) => res.status(404).json({ message: 'No WFH schedules found for this team.' }));

            const response = await request(app)
                .get('/teamSchedule');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'No WFH schedules found for this team.' });
        });

        it('should return 500 if there is an error retrieving the team schedule', async () => {
            scheduleController.retrieveTeamSchedule.mockImplementation((req, res) => res.status(500).json({ error: 'An error occurred while retrieving the team schedule.' }));

            const response = await request(app)
                .get('/teamSchedule');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error occurred while retrieving the team schedule.' });
        });
    });

    describe('GET /subordinateSchedule', () => {
        it('should retrieve the subordinate schedule for a manager', async () => {
            scheduleController.retrieveSubordinateSchedule.mockImplementation((req, res) => res.status(200).json({
                '2024-10-11': {
                    'Full Day': ['Jane Doe']
                }
            }));

            const response = await request(app)
                .get('/subordinateSchedule');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                '2024-10-11': {
                    'Full Day': ['Jane Doe']
                }
            });
            expect(scheduleController.retrieveSubordinateSchedule).toHaveBeenCalled();
        });

        it('should return 404 if no subordinate schedules found', async () => {
            scheduleController.retrieveSubordinateSchedule.mockImplementation((req, res) => res.status(404).json({ message: 'No WFH schedules found for this team.' }));

            const response = await request(app)
                .get('/subordinateSchedule');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'No WFH schedules found for this team.' });
        });

        it('should return 500 if there is an error retrieving the subordinate schedule', async () => {
            scheduleController.retrieveSubordinateSchedule.mockImplementation((req, res) => res.status(500).json({ error: 'An error occurred while retrieving the team schedule.' }));

            const response = await request(app)
                .get('/subordinateSchedule');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error occurred while retrieving the team schedule.' });
        });
    });
});
