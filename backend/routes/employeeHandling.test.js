const request = require('supertest');
const express = require('express');
const router = require('../routes/employeeHandling');
const employeeController = require('../controllers/employeeController');

// Create an express app for testing
const app = express();
app.use(express.json());
app.use(router);

// Mock controller methods and middleware
jest.mock('../controllers/employeeController', () => ({
    retrieveColleagues: jest.fn(),
    retrieveSubordinates: jest.fn(),
    getEmployee: jest.fn(),
}));

jest.mock('../middlewares/authMiddleware', () => ({
    ensureLoggedIn: (req, res, next) => next(),  // Mock to bypass auth middleware
    ensureManager: (req, res, next) => next(),   // Mock to bypass manager auth
    ensureHR: (req, res, next) => next(),        // Mock to bypass HR auth
}));

describe('Employee Handling Routes', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /colleagues', () => {
        it('should retrieve colleagues for a logged-in user', async () => {
            employeeController.retrieveColleagues.mockImplementation((req, res) => res.status(200).json([{ id: 1, first_name: 'John' }]));

            const response = await request(app)
                .get('/colleagues');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([{ id: 1, first_name: 'John' }]);
            expect(employeeController.retrieveColleagues).toHaveBeenCalled();
        });

        it('should return 500 if there is an error retrieving colleagues', async () => {
            employeeController.retrieveColleagues.mockImplementation((req, res) => res.status(500).json({ error: 'An error occurred' }));

            const response = await request(app)
                .get('/colleagues');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error occurred' });
        });
    });

    describe('GET /subordinates', () => {
        it('should retrieve subordinates for a manager', async () => {
            employeeController.retrieveSubordinates.mockImplementation((req, res) => res.status(200).json([{ id: 2, first_name: 'Jane' }]));

            const response = await request(app)
                .get('/subordinates');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([{ id: 2, first_name: 'Jane' }]);
            expect(employeeController.retrieveSubordinates).toHaveBeenCalled();
        });
    });

    describe('GET /employee', () => {
        it('should retrieve an employee by ID when valid parameters are provided', async () => {
            employeeController.getEmployee.mockImplementation((req, res) => res.status(200).json({
                first_name: 'John',
                last_name: 'Doe',
                department: 'Engineering',
                position: 'Developer',
                country: 'USA',
                email: 'john.doe@example.com'
            }));

            const response = await request(app)
                .get('/employee')
                .query({ id: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                first_name: 'John',
                last_name: 'Doe',
                department: 'Engineering',
                position: 'Developer',
                country: 'USA',
                email: 'john.doe@example.com'
            });
            expect(employeeController.getEmployee).toHaveBeenCalled();
        });

        it('should return 422 for invalid parameters', async () => {
            const response = await request(app)
                .get('/employee')
                .query({ id: 'invalid' });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invalid Input Received');
        });
    });
});
