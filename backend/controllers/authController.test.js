const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Employee } = require('../models');

jest.mock('passport');
jest.mock('jsonwebtoken');
jest.mock('../models', () => ({
    Employee: {
        findByPk: jest.fn()
    }
}));

describe('AuthController', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            cookies: {},
            logIn: jest.fn((user, callback) => callback(null)),
            session: {
                cookie: { maxAge: null },
                save: jest.fn(),
                destroy: jest.fn(),
            },
            logout: jest.fn(),
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn(),
            clearCookie: jest.fn(),
        };
        next = jest.fn();
    });

    describe('login', () => {
        it('should login a user and return a JWT token', async () => {
            passport.authenticate.mockImplementation((strategy, callback) => (req, res, next) => {
                callback(null, { id: 1 }, { message: 'Logged in successfully' });
            });
            jwt.sign.mockReturnValue('mockedJWTToken');

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login successfully',
                token: 'mockedJWTToken',
            });
            expect(res.cookie).toHaveBeenCalledWith('jwt', 'mockedJWTToken', expect.any(Object));
        });

        it('should return 401 if authentication fails', async () => {
            passport.authenticate.mockImplementation((strategy, callback) => (req, res, next) => {
                callback(null, false, { message: 'Invalid credentials' });
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        it('should return 500 if there is a server error', async () => {
            passport.authenticate.mockImplementation((strategy, callback) => (req, res, next) => {
                callback(new Error('Server error'), null, null);
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: new Error('Server error') });
        });
    });

    describe('me', () => {
        it('should return the authenticated user information', async () => {
            req.user = { id: 1 };
            // Mock the Employee.findByPk method for user and manager retrieval
            Employee.findByPk.mockResolvedValueOnce({
                id: 1,
                first_name: 'John',
                last_name: 'Doe',
                department: 'Engineering',
                position: 'Developer',
                country: 'USA',
                email: 'john.doe@example.com',
                role: 'Staff',
                reporting_manager: 2,
            });
            Employee.findByPk.mockResolvedValueOnce({
                first_name: 'Jane',
                last_name: 'Smith',
                department: 'Management',
                position: 'Manager',
                country: 'USA',
                email: 'jane.smith@example.com',
            });

            await authController.me(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                id: 1,
                first_name: 'John',
                last_name: 'Doe',
                department: 'Engineering',
                position: 'Developer',
                country: 'USA',
                email: 'john.doe@example.com',
                role: 'Staff',
                manager: {
                    first_name: 'Jane',
                    last_name: 'Smith',
                    department: 'Management',
                    position: 'Manager',
                    country: 'USA',
                    email: 'jane.smith@example.com',
                },
            });
        });
        it('should return 404 if the user is not found', async () => {
            req.user = { id: 1 };

            // Mock Employee.findByPk to return null (user not found)
            Employee.findByPk.mockResolvedValueOnce(null);

            req.logout.mockImplementationOnce((callback) => callback()); // Simulate the logout method with a callback

            await authController.me(req, res);

            expect(req.logout).toHaveBeenCalled(); // Ensure logout is called
            expect(res.status).toHaveBeenCalledWith(404); // Status 404 should be called
            expect(res.json).toHaveBeenCalledWith({ message: 'Employee not found' });
        });
    });

    describe('validateToken', () => {
        it('should validate a valid JWT token', async () => {
            req.cookies.jwt = 'mockedJWTToken';
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { id: 1 });
            });

            await authController.validateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                valid: true,
                message: 'Token is valid',
                user: { id: 1 },
            });
        });

        it('should return 401 if no token is provided', async () => {
            req.cookies.jwt = null;

            await authController.validateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ valid: false, message: 'No token provided' });
        });

        it('should return 401 for an invalid or expired token', async () => {
            req.cookies.jwt = 'mockedJWTToken';
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error('Invalid token'), null);
            });

            await authController.validateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ valid: false, message: 'Invalid or expired token' });
        });
    });

    describe('extendDuration', () => {
        it('should extend the session duration and return a new token', async () => {
            req.cookies.jwt = 'mockedJWTToken';
            req.user = { id: 1 };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { id: 1 });
            });
            jwt.sign.mockReturnValue('newMockedJWTToken');

            await authController.extendDuration(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token duration extended successfully',
                token: 'newMockedJWTToken',
            });
            expect(res.cookie).toHaveBeenCalledWith('jwt', 'newMockedJWTToken', expect.any(Object));
        });

        it('should return 401 for an invalid token during session extension', async () => {
            req.cookies.jwt = 'mockedJWTToken';
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error('Invalid token'), null);
            });

            await authController.extendDuration(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ valid: false, message: 'Invalid or expired token' });
        });
    });

    describe('logout', () => {
        it('should log the user out and clear cookies', async () => {
            // Mock req.logout to call the callback after logging out
            req.logout.mockImplementationOnce((callback) => callback());

            await authController.logout(req, res);

            expect(req.logout).toHaveBeenCalled(); // Check that logout was called
            expect(res.clearCookie).toHaveBeenCalledWith('jwt'); // Check that jwt cookie was cleared
            expect(res.clearCookie).toHaveBeenCalledWith('connect.sid'); // Check that session cookie was cleared
            expect(res.status).toHaveBeenCalledWith(200); // Check the response status
            expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' }); // Check the success message
        });
    });
});
