'use strict';

// Helper function to generate a random date within a range
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate random start and end dates
const generateRandomDates = () => {
  const startDate = getRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Start date within the next 30 days
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1); // End date between 1 and 7 days after start date
  return { startDate, endDate };
};

// Helper function to generate a random number of entries
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Fetch existing employees from the database using queryInterface
    const employees = await queryInterface.sequelize.query(
      'SELECT * FROM Employees',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!employees.length) {
      console.log('No employees found in the database.');
      return;
    }

    // Step 2: Prepare schedule entries for these employees
    let schedules = [];
    let applications = [];

    employees.forEach(employee => {
      // Step 3: Create a random number of schedule entries for each employee
      const scheduleCount = getRandomInt(1, 5); // Generate between 1 and 5 schedules per employee
      for (let i = 0; i < scheduleCount; i++) {
        const { startDate, endDate } = generateRandomDates(); // Generate random start and end dates for schedule
        schedules.push({
          start_date: startDate,
          end_date: endDate,
          schedule_type: 'Regular', // You can change this or make it dynamic
          created_by: employee.id,
          last_update_by: employee.id,
          verify_by: employee.reporting_manager,
          verify_timestamp: new Date(),
          created_timestamp: new Date(),
          last_update_timestamp: new Date(),
        });
      }

      // Step 4: Create a random number of application entries for each employee
      const applicationCount = getRandomInt(1, 5); // Generate between 1 and 5 applications per employee
      for (let i = 0; i < applicationCount; i++) {
        const { startDate, endDate } = generateRandomDates(); // Generate random start and end dates for application
        applications.push({
          start_date: startDate,
          end_date: endDate,
          application_type: 'Regular', // You can change this or make it dynamic
          status: 'Pending',
          created_by: employee.id,
          last_update_by: employee.id,
          verify_by: null,
          verify_timestamp: null,
          created_timestamp: new Date(),
          last_update_timestamp: new Date(),
        });
      }
    });

    // Insert all schedules at once using queryInterface.bulkInsert
    await queryInterface.bulkInsert('Schedules', schedules);

    // Insert all applications at once using queryInterface.bulkInsert
    await queryInterface.bulkInsert('Applications', applications);
  },

  down: async (queryInterface, Sequelize) => {
    // Optional: Delete the inserted schedule and application entries if needed
    await queryInterface.bulkDelete('Schedules', null, {});
    await queryInterface.bulkDelete('Applications', null, {});
  }
};
