const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { Employee } = require('../../models');
const { generateSalt, hashPassword } = require('../security/cryptoHelper');


function mapRole(numericRole) {
    switch (parseInt(numericRole)) {
        case 1:
            return 'HR';
        case 2:
            return 'Staff';
        case 3:
            return 'Manager';
        default:
            return 'Staff';
    }
}

async function seedEmployees() {
    const importedEmployees = [];
    // Adjust the path to the CSV file accordingly
    const csvFilePath = path.join(__dirname, 'employee.csv');
    // Read CSV file
    fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', async (row) => {
            // Assuming your CSV headers match Employee fields
            const { first_name, last_name, department, position, country, email, reporting_manager, role, password } = row;
            const resolvedRole = mapRole(role);
            const salt = generateSalt();
            const hashedPassword = await hashPassword(password, salt);
            importedEmployees.push({
                first_name,
                last_name,
                department,
                position,
                country,
                email,
                reporting_manager: reporting_manager ? parseInt(reporting_manager) : null,
                role: resolvedRole,
                password: hashedPassword,
                salt,
                created_by_system: 'data-migration',
                last_update_by_system: 'data-migration',
            });
        })
        .on('end', async () => {
            try {
                await Employee.bulkCreate(importedEmployees);
                console.log('Employees data seeded successfully.');
            } catch (error) {
                console.error('Error seeding employees data:', error);
            }
        });
}

seedEmployees();