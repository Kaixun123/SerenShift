const { managerAndAbove, hr, employee, anybody, retrieveColleagues } = require('./dummyController');
const { Employee } = require('../models');

jest.mock('../models', () => ({
    Employee: {
        findByPk: jest.fn(),
        findAll: jest.fn()
    }
}));

describe('dummyController', () => {
    let req, res, next;

    beforeEach(() => {
        req = { user: { id: 1 } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    test('managerAndAbove should return correct message', () => {
        managerAndAbove(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Only Managers and HR should be able to see this' });
    });

    test('hr should return correct message', () => {
        hr(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Only HR should be able to see this' });
    });

    test('employee should return correct message', () => {
        employee(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Only logged in employees should be able to see this' });
    });

    test('anybody should return correct message', () => {
        anybody(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Anybody can see this' });
    });

    test('retrieveColleagues should return colleagues list', async () => {
        const mockEmployee = { id: 1, reporting_manager: 2 };
        const mockColleagues = [
            { first_name: 'Jon', last_name: 'Goh', department: 'IT', position: 'Developer', country: 'Singapore', email: 'Jon.Goh@allinone.com.sg' },
            { first_name: 'Jay', last_name: 'Choa', department: 'HR', position: 'Manager', country: 'Singapore', email: 'Jay.Choa@allinone.com.sg' }
        ];

        Employee.findByPk.mockResolvedValue(mockEmployee);
        Employee.findAll.mockResolvedValue(mockColleagues);

        await retrieveColleagues(req, res, next);

        expect(Employee.findByPk).toHaveBeenCalledWith(1);
        expect(Employee.findAll).toHaveBeenCalledWith({ where: { reporting_manager: 2 } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            { first_name: 'Jon', last_name: 'Goh', department: 'IT', position: 'Developer', country: 'Singapore', email: 'Jon.Goh@allinone.com.sg' },
            { first_name: 'Jay', last_name: 'Choa', department: 'HR', position: 'Manager', country: 'Singapore', email: 'Jay.Choa@allinone.com.sg' }
        ]);
    });
});