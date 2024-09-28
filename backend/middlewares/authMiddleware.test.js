// This is a example unit test for the authMiddleware.js file in the middlewares folder

const { ensureHR, ensureManager, ensureManagerAndAbove, ensureLoggedIn } = require('./authMiddleware');

describe('Authorisation Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { user: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            end: jest.fn()
        };
        next = jest.fn();
    });

    test('ensureHR authorisation guard allows users with the HR role', () => {
        req.user.role = 'HR';
        ensureHR(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('ensureHR authorisation guard denies users without the HR role', () => {
        req.user.role = 'Employee';
        ensureHR(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.end).toHaveBeenCalled();
    });

    test('ensureManager authorisation guard allows users with the Manager role', () => {
        req.user.role = 'Manager';
        ensureManager(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('ensureManager authorisation guard denies users without the Manager role', () => {
        req.user.role = 'Employee';
        ensureManager(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.end).toHaveBeenCalled();
    });

    test('ensureManagerAndAbove authorisation guard allows users with either Manager or HR roles', () => {
        req.user.role = 'Manager';
        ensureManagerAndAbove(req, res, next);
        expect(next).toHaveBeenCalled();

        req.user.role = 'HR';
        ensureManagerAndAbove(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('ensureManagerAndAbove authorisation guard denies users without either Manager or HR roles', () => {
        req.user.role = 'Employee';
        ensureManagerAndAbove(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.end).toHaveBeenCalled();
    });

    test('ensureLoggedIn authorisation guard allows user with any role', () => {
        req.user = { role: 'Employee' };
        ensureLoggedIn(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('ensureLoggedIn authorisation guard denies users that are not logged in', () => {
        req.user = null;
        ensureLoggedIn(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.end).toHaveBeenCalled();
    });
});