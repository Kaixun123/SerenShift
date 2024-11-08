const { Employee } = require('../models');
const {
    retrieveColleagues,
    retrieveSubordinates,
    getEmployee
} = require('../controllers/employeeController');
const { fetchColleagues, fetchSubordinates } = require('../services/common/employeeHelper');

jest.mock('../models', () => ({
    Employee: {
        findByPk: jest.fn(),
        findAll: jest.fn()
    }
}));
jest.mock('../services/common/employeeHelper');

describe('Employee Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('retrieveColleagues', () => {
        it('should return a list of colleagues', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchColleagues.mockResolvedValue([
                { id: 2, first_name: 'John', last_name: 'Doe' }
            ]);

            await retrieveColleagues(req, res, next);

            expect(fetchColleagues).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                { id: 2, first_name: 'John', last_name: 'Doe' }
            ]);
        });

        it('should return 500 if employee retrieval fails', async () => {
            const req = { query: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            // Simulate a database failure
            Employee.findByPk.mockRejectedValue(new Error('Database Error'));

            await getEmployee(req, res, next);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'An error occurred while retrieving employee details' });
        });
    });

    describe('retrieveSubordinates', () => {
        it('should return a list of subordinates', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockResolvedValue([
                { id: 3, first_name: 'Jane', last_name: 'Smith' }
            ]);

            await retrieveSubordinates(req, res, next);

            expect(fetchSubordinates).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                { id: 3, first_name: 'Jane', last_name: 'Smith' }
            ]);
        });

        it('should return 500 if an error occurs', async () => {
            const req = { user: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            fetchSubordinates.mockRejectedValue(new Error('Database Error'));

            await retrieveSubordinates(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'An error occurred while retrieving subordinates' });
        });
    });

    describe('getEmployee', () => {
        it('should return employee details', async () => {
            const req = { query: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Employee.findByPk.mockResolvedValue({
                id: 1,
                first_name: 'John',
                last_name: 'Doe',
                department: 'Engineering',
                position: 'Developer',
                country: 'USA',
                email: 'john.doe@example.com'
            });

            await getEmployee(req, res, next);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                first_name: 'John',
                last_name: 'Doe',
                department: 'Engineering',
                position: 'Developer',
                country: 'USA',
                email: 'john.doe@example.com'
            });
        });

        it('should return 500 if employee retrieval fails', async () => {
            const req = { query: { id: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Employee.findByPk.mockRejectedValue(new Error('Database Error'));

            await getEmployee(req, res, next);

            expect(Employee.findByPk).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'An error occurred while retrieving employee details' });
        });
    });
});
