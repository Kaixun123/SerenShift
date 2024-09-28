const request = require('supertest');
const express = require('express');
const router = require('./dummyHandling');

// Mock the controller methods
jest.mock('../controllers/dummyController', () => ({
    anybody: jest.fn((req, res) => res.status(200).send('anybody')),
    employee: jest.fn((req, res) => res.status(200).send('employee')),
    manager: jest.fn((req, res) => res.status(200).send('manager')),
    managerAndAbove: jest.fn((req, res) => res.status(200).send('managerAndAbove')),
    hr: jest.fn((req, res) => res.status(200).send('hr')),
    retrieveColleagues: jest.fn((req, res) => res.status(200).send('colleagues')),
    getEmployee: jest.fn((req, res) => res.status(200).send('employee'))
}));

// Mock the middleware
jest.mock('../middlewares/authMiddleware', () => ({
    ensureLoggedIn: jest.fn((req, res, next) => next()),
    ensureManager: jest.fn((req, res, next) => next()),
    ensureManagerAndAbove: jest.fn((req, res, next) => next()),
    ensureHR: jest.fn((req, res, next) => next())
}));

const app = express();
app.use(express.json());
app.use('/', router);

describe('dummyHandling routes', () => {
    test('GET /anybody', async () => {
        const response = await request(app).get('/anybody');
        expect(response.status).toBe(200);
        expect(response.text).toBe('anybody');
    });

    test('GET /staff', async () => {
        const response = await request(app).get('/staff');
        expect(response.status).toBe(200);
        expect(response.text).toBe('employee');
    });

    test('GET /manager', async () => {
        const response = await request(app).get('/manager');
        expect(response.status).toBe(200);
        expect(response.text).toBe('manager');
    });

    test('GET /managerAndAbove', async () => {
        const response = await request(app).get('/managerAndAbove');
        expect(response.status).toBe(200);
        expect(response.text).toBe('managerAndAbove');
    });

    test('GET /hr', async () => {
        const response = await request(app).get('/hr');
        expect(response.status).toBe(200);
        expect(response.text).toBe('hr');
    });

    test('GET /colleagues', async () => {
        const response = await request(app).get('/colleagues');
        expect(response.status).toBe(200);
        expect(response.text).toBe('colleagues');
    });

    test('GET /employee with valid id', async () => {
        const response = await request(app).get('/employee').query({ id: 130002 });
        expect(response.status).toBe(200);
        expect(response.text).toBe('employee');
    });

    test('GET /employee with invalid id', async () => {
        const response = await request(app).get('/employee').query({ id: 'invalid' });
        expect(response.status).toBe(422);
        expect(response.body.message).toBe('Invaild Input Received');
    });
});