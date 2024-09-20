'use strict';

const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { generateSalt, hashPassword } = require('../services/security/cryptoHelper');
const csvFilePath = path.join(__dirname, 'employee.csv'); // Adjust CSV path

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
      return 'Staff'; // Default to 'Staff' if there is no match
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const employees = [];

    // Step 1: Read CSV and collect employee data
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', async (row) => {
          const { Staff_ID, Staff_FName, Staff_LName, Dept, Position, Country, Email, Role } = row;

          // Hash password before inserting into the database
          let generatedSalt = generateSalt();
          let hashedPassword = await hashPassword('P@ssw0rd', generatedSalt);

          // Map numeric role to string role
          const mappedRole = mapRole(Role);

          // Push employee data into array (excluding reporting_manager for now)
          employees.push({
            id: Staff_ID ? parseInt(Staff_ID) : undefined, // Use Staff_ID as ID
            first_name: Staff_FName,
            last_name: Staff_LName,
            department: Dept,
            position: Position,
            country: Country,
            email: Email,
            reporting_manager: null, // Set reporting_manager to null for now
            role: mappedRole,
            password: hashedPassword,
            salt: generatedSalt,
            created_by_system: 'data-migration', // Track created_by_system
            last_update_by_system: 'data-migration', // Track last_update_by_system
            created_timestamp: new Date(),
            last_update_timestamp: new Date()
          });
        })
        .on('end', async () => {
          try {
            // Step 2: Insert all employee records using queryInterface
            await queryInterface.bulkInsert('Employees', employees);

            // Step 3: Update reporting_manager after all employees are inserted
            await updateReportingManagers(queryInterface, csvFilePath, Sequelize);

            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all seeded employees using queryInterface
    await queryInterface.bulkDelete('Employees', null, {});
  }
};

// Function to update the reporting_manager for all employees
async function updateReportingManagers(queryInterface, csvFilePath, Sequelize) {
  const managerUpdates = [];

  // Re-read the CSV file to get reporting_manager IDs
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const { Staff_ID, Reporting_Manager } = row;

        if (Reporting_Manager) {
          // Prepare the update query for each employee's reporting_manager
          managerUpdates.push(
            queryInterface.sequelize.query(
              'UPDATE Employees SET reporting_manager = :reporting_manager WHERE id = :id',
              {
                replacements: {
                  reporting_manager: parseInt(Reporting_Manager),
                  id: parseInt(Staff_ID),
                },
                type: Sequelize.QueryTypes.UPDATE,
              }
            )
          );
        }
      })
      .on('end', async () => {
        try {
          // Perform all the updates
          await Promise.all(managerUpdates);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
