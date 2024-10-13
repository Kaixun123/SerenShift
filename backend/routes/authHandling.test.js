const request = require('supertest');
const express = require('express');
const router = require('../routes/authHandling');
const authController = require('../controllers/authController');

// Create an express app for testing
const app = express();
app.use(express.json());
app.use(router);  // Mount the router

// Mock controller methods and middleware
jest.mock('../controllers/authController', () => ({
    login: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
    validateToken: jest.fn(),
    extendDuration: jest.fn(),
}));

jest.mock('../middlewares/authMiddleware', () => ({
    ensureLoggedIn: (req, res, next) => next(),  // Mock middleware to bypass authentication
}));

describe('Auth Handling Routes', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /login', () => {
        it('should log in with valid credentials', async () => {
            authController.login.mockImplementation((req, res) => res.status(200).json({ message: 'Login successful' }));

            const response = await request(app)
                .post('/login')
                .send({
                    emailAddress: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Login successful' });
            expect(authController.login).toHaveBeenCalled();
        });

        it('should return 422 for invalid email or password', async () => {
            const response = await request(app)
                .post('/login')
                .send({
                    emailAddress: 'invalid-email',
                    password: '',
                });

            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty('message', 'Invaild Input Received');
            expect(response.body.errors).toHaveLength(2);  // Expect 2 validation errors
        });
    });

    describe('GET /logout', () => {
        it('should log out successfully', async () => {
            authController.logout.mockImplementation((req, res) => res.status(200).json({ message: 'Logged out successfully' }));

            const response = await request(app)
                .get('/logout');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Logged out successfully' });
            expect(authController.logout).toHaveBeenCalled();
        });
    });

    describe('GET /me', () => {
        it('should return the current user details', async () => {
            authController.me.mockImplementation((req, res) => res.status(200).json({
                id: 1,
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com'
            }));

            const response = await request(app)
                .get('/me');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 1,
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com'
            });
            expect(authController.me).toHaveBeenCalled();
        });

        it('should return 404 if user is not found', async () => {
            authController.me.mockImplementation((req, res) => res.status(404).json({ message: 'Employee not found' }));

            const response = await request(app)
                .get('/me');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Employee not found' });
        });
    });

    describe('GET /validateToken', () => {
        it('should validate token successfully', async () => {
            authController.validateToken.mockImplementation((req, res) => res.status(200).json({
                valid: true,
                message: 'Token is valid'
            }));

            const response = await request(app)
                .get('/validateToken')
                .set('Cookie', ['jwt=valid-token']);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                valid: true,
                message: 'Token is valid'
            });
            expect(authController.validateToken).toHaveBeenCalled();
        });

        it('should return 401 if token is invalid or expired', async () => {
            authController.validateToken.mockImplementation((req, res) => res.status(401).json({ valid: false, message: 'Invalid or expired token' }));

            const response = await request(app)
                .get('/validateToken')
                .set('Cookie', ['jwt=invalid-token']);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ valid: false, message: 'Invalid or expired token' });
        });
    });

    describe('PATCH /extendDuration', () => {
        it('should extend token duration successfully', async () => {
            authController.extendDuration.mockImplementation((req, res) => res.status(200).json({
                message: 'Token duration extended successfully',
                token: 'new-token'
            }));

            const response = await request(app)
                .patch('/extendDuration')
                .set('Cookie', ['jwt=valid-token']);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Token duration extended successfully',
                token: 'new-token'
            });
            expect(authController.extendDuration).toHaveBeenCalled();
        });

        it('should return 401 if token is invalid or expired', async () => {
            authController.extendDuration.mockImplementation((req, res) => res.status(401).json({ valid: false, message: 'Invalid or expired token' }));

            const response = await request(app)
                .patch('/extendDuration')
                .set('Cookie', ['jwt=invalid-token']);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ valid: false, message: 'Invalid or expired token' });
        });
    });
});
