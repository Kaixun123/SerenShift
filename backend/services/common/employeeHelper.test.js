const { fetchColleagues } = require('./employeeHelper');
const { Employee } = require('../../models');

jest.mock('../../models', () => ({
    Employee: {
        findByPk: jest.fn(),
        findAll: jest.fn(),
    },
}));

describe('fetchColleagues', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return colleagues excluding the current employee', async () => {
        const userId = 1;
        const currentEmployee = { id: userId, reporting_manager: 2 };
        const colleagues = [
            { id: 2, first_name: 'John', last_name: 'Doe', department: 'IT', position: 'Developer', country: 'USA', email: 'john.doe@example.com', reporting_manager: 2 },
            { id: 3, first_name: 'Jane', last_name: 'Smith', department: 'HR', position: 'Manager', country: 'USA', email: 'jane.smith@example.com', reporting_manager: 2 },
        ];

        Employee.findByPk.mockResolvedValue(currentEmployee);
        Employee.findAll.mockResolvedValue(colleagues);

        const result = await fetchColleagues(userId);

        expect(Employee.findByPk).toHaveBeenCalledWith(userId);
        expect(Employee.findAll).toHaveBeenCalledWith({ where: { reporting_manager: currentEmployee.reporting_manager } });
        expect(result).toEqual([
            { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'IT', position: 'Developer', country: 'USA', email: 'john.doe@example.com' },
            { user_id: 3, first_name: 'Jane', last_name: 'Smith', department: 'HR', position: 'Manager', country: 'USA', email: 'jane.smith@example.com' },
        ]);
    });

    test('should return an empty array if no colleagues are found', async () => {
        const userId = 1;
        const currentEmployee = { id: userId, reporting_manager: 2 };

        Employee.findByPk.mockResolvedValue(currentEmployee);
        Employee.findAll.mockResolvedValue([]);

        const result = await fetchColleagues(userId);

        expect(result).toEqual([]);
    });
});