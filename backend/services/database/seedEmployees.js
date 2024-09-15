require("dotenv").config({ path: "../../.env" });
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { generateSalt, hashPassword } = require('../security/cryptoHelper');
const { Employee } = require('../../models');

// Function to map numeric role to string role
function mapRole(numericRole) {
    switch (parseInt(numericRole)) {
        case 1:
            return 'HR';
        case 2:
            return 'Staff';
        case 3:
            return 'Manager';
        default:
            return 'Staff'; // Default to 'Staff' if no match
    }
}

// Step 1: Seed employees without the reporting_manager
async function seedEmployees() {
    await sequelize.sync({ force: true });
    const employees = [];
    // Adjust the path to the CSV file accordingly
    const csvFilePath = path.join(__dirname, 'employee.csv');
    // Read CSV file
    fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', async (row) => {
            const { Staff_ID, Staff_FName, Staff_LName, Dept, Position, Country, Email, Role } = row;
            // Hash password before inserting into the database
            let generatedSalt = generateSalt();
            let hashedPassword = await hashPassword('P@ssw0rd', generatedSalt);
            // Map numeric role to string role
            const mappedRole = mapRole(Role);

            // Push employee data without reporting_manager for now
            employees.push({
                id: Staff_ID ? parseInt(Staff_ID) : undefined, // Use staff_id as ID
                first_name: Staff_FName,
                last_name: Staff_LName,
                department: Dept,
                position: Position,
                country: Country,
                email: Email,
                reporting_manager: null, // Leave reporting_manager as null for now
                role: mappedRole,
                password: hashedPassword,
                salt: generatedSalt,
                created_by_system: 'data-migration', // Optional: Track created by system
                last_update_by_system: 'data-migration', // Optional: Track last updated by system
            });
        })
        .on('end', async () => {
            try {
                // Step 1: Bulk insert all employees without reporting_manager
                await Employee.bulkCreate(employees);
                console.log('Employees data seeded successfully.');
                // Step 2: Set reporting_manager after all employees are created
                await updateReportingManagers(csvFilePath);
            } catch (error) {
                console.error('Error seeding employees data:', error);
            }
        });
}

// Step 2: Update the reporting_manager for all employees
async function updateReportingManagers(csvFilePath) {
    const managerUpdates = [];
    // Re-read the CSV file to get reporting_manager IDs
    fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
            const { Staff_ID, Reporting_Manager } = row;

            if (Reporting_Manager) {
                // Prepare the update operation
                managerUpdates.push(
                    Employee.update(
                        { reporting_manager: parseInt(Reporting_Manager) }, // Update reporting_manager
                        { where: { id: parseInt(Staff_ID) } } // Match employee by their staff_id
                    )
                );
            }
        })
        .on('end', async () => {
            try {
                // Step 3: Perform all the updates concurrently using Promise.all
                await Promise.all(managerUpdates);
                console.log('Reporting managers updated successfully.');
            } catch (error) {
                console.error('Error updating reporting managers:', error);
            }
        });
}

// Execute the seeding function
seedEmployees();
