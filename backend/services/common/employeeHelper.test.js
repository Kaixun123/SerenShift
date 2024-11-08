const { fetchColleagues, fetchSubordinates } = require('./employeeHelper');
const { Employee } = require('../../models');

// Mock the Employee model
jest.mock('../../models', () => ({
    Employee: {
        findByPk: jest.fn(),
        findAll: jest.fn(),
    }
}));

describe('Employee Helper', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchColleagues', () => {
        it('should fetch colleagues excluding the current user', async () => {
            // Mock data
            const userId = 1;
            const currentEmployee = { id: 1, reporting_manager: 2 };
            const colleagues = [
                { id: 2, first_name: 'John', last_name: 'Doe', department: 'Engineering', position: 'Developer', country: 'USA', email: 'john.doe@example.com' },
                { id: 3, first_name: 'Jane', last_name: 'Smith', department: 'Engineering', position: 'Tester', country: 'USA', email: 'jane.smith@example.com' }
            ];

            // Mock database calls
            Employee.findByPk.mockResolvedValue(currentEmployee);
            Employee.findAll.mockResolvedValue(colleagues);

            // Call the function
            const result = await fetchColleagues(userId);

            // Assertions
            expect(Employee.findByPk).toHaveBeenCalledWith(userId);
            expect(Employee.findAll).toHaveBeenCalledWith({ where: { reporting_manager: currentEmployee.reporting_manager } });
            expect(result).toEqual([
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'Engineering', position: 'Developer', country: 'USA', email: 'john.doe@example.com' },
                { user_id: 3, first_name: 'Jane', last_name: 'Smith', department: 'Engineering', position: 'Tester', country: 'USA', email: 'jane.smith@example.com' }
            ]);
        });

        it('should return an empty array if no colleagues are found', async () => {
            const userId = 1;
            const currentEmployee = { id: 1, reporting_manager: 2 };

            // Mock database calls
            Employee.findByPk.mockResolvedValue(currentEmployee);
            Employee.findAll.mockResolvedValue([]);

            const result = await fetchColleagues(userId);

            expect(result).toEqual([]);
        });

        it('should filter out the current user from the colleague list', async () => {
            const userId = 1;
            const currentEmployee = { id: 1, reporting_manager: 2 };
            const colleagues = [
                { id: 1, first_name: 'Current', last_name: 'User', department: 'Engineering', position: 'Developer', country: 'USA', email: 'current.user@example.com' },
                { id: 2, first_name: 'John', last_name: 'Doe', department: 'Engineering', position: 'Developer', country: 'USA', email: 'john.doe@example.com' }
            ];

            // Mock database calls
            Employee.findByPk.mockResolvedValue(currentEmployee);
            Employee.findAll.mockResolvedValue(colleagues);

            const result = await fetchColleagues(userId);

            expect(result).toEqual([
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'Engineering', position: 'Developer', country: 'USA', email: 'john.doe@example.com' }
            ]);
        });
    });

    describe('fetchSubordinates', () => {
        it('should fetch subordinates reporting to the current user', async () => {
            // Mock data
            const userId = 1;
            const subordinates = [
                { id: 2, first_name: 'John', last_name: 'Doe', department: 'Engineering', position: 'Developer', country: 'USA', email: 'john.doe@example.com' },
                { id: 3, first_name: 'Jane', last_name: 'Smith', department: 'Engineering', position: 'Tester', country: 'USA', email: 'jane.smith@example.com' }
            ];

            // Mock database calls
            Employee.findAll.mockResolvedValue(subordinates);

            // Call the function
            const result = await fetchSubordinates(userId);

            // Assertions
            expect(Employee.findAll).toHaveBeenCalledWith({ where: { reporting_manager: userId } });
            expect(result).toEqual([
                { user_id: 2, first_name: 'John', last_name: 'Doe', department: 'Engineering', position: 'Developer', country: 'USA', email: 'john.doe@example.com' },
                { user_id: 3, first_name: 'Jane', last_name: 'Smith', department: 'Engineering', position: 'Tester', country: 'USA', email: 'jane.smith@example.com' }
            ]);
        });

        it('should return an empty array if no subordinates are found', async () => {
            const userId = 1;

            // Mock database calls
            Employee.findAll.mockResolvedValue([]);

            const result = await fetchSubordinates(userId);

            expect(result).toEqual([]);
        });
    });
});
