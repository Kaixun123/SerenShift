'use strict';

// Helper function to generate start and end times for morning, afternoon, or whole day
const generateFixedTimes = () => {
  const MORNING_START = new Date().setHours(8, 30, 0, 0);  // 8:30 am
  const MORNING_END = new Date().setHours(12, 0, 0, 0);    // 12:00 pm
  const AFTERNOON_START = new Date().setHours(13, 0, 0, 0); // 1:00 pm
  const AFTERNOON_END = new Date().setHours(17, 30, 0, 0);  // 5:30 pm
  const WHOLE_DAY_START = new Date().setHours(8, 30, 0, 0);  // 8:30 am
  const WHOLE_DAY_END = new Date().setHours(17, 30, 0, 0);   // 5:30 pm

  // Randomly choose between morning, afternoon, or whole day
  const randomChoice = Math.random();
  let startTime, endTime;

  if (randomChoice < 0.33) {
    // Morning: 8:30 am - 12:00 pm
    startTime = new Date(MORNING_START);
    endTime = new Date(MORNING_END);
  } else if (randomChoice < 0.66) {
    // Afternoon: 1:00 pm - 5:30 pm
    startTime = new Date(AFTERNOON_START);
    endTime = new Date(AFTERNOON_END);
  } else {
    // Whole day: 8:30 am - 5:30 pm
    startTime = new Date(WHOLE_DAY_START);
    endTime = new Date(WHOLE_DAY_END);
  }

  return { startDate: startTime, endDate: endTime };
};

// Helper function to generate a random number of entries
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to generate repeated "Regular" applications for the next few weeks
const generateWeeklyRegularApplications = (startDate, weeks = 4) => {
  let applications = [];
  const { startDate: baseStart, endDate: baseEnd } = generateFixedTimes();

  for (let i = 0; i < weeks; i++) {
    const regularStartDate = new Date(baseStart);
    regularStartDate.setDate(regularStartDate.getDate() + (i * 7));  // Increment by 7 days for each week

    const regularEndDate = new Date(baseEnd);
    regularEndDate.setDate(regularEndDate.getDate() + (i * 7));  // Increment by 7 days for each week

    applications.push({
      start_date: regularStartDate,
      end_date: regularEndDate,
      application_type: 'Regular',
      status: 'Pending',
      created_by: null,
      last_update_by: null,
      verify_by: null,
      verify_timestamp: null,
      created_timestamp: new Date(),
      last_update_timestamp: new Date(),
    });
  }

  return applications;
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
        const { startDate, endDate } = generateFixedTimes(); // Generate fixed start and end times
        schedules.push({
          start_date: startDate,
          end_date: endDate,
          schedule_type: 'Ad Hoc',
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
        const { startDate, endDate } = generateFixedTimes(); // Generate fixed start and end times
        const isRegular = Math.random() < 0.2;  // 20% chance of generating a Regular application
        if (isRegular) {
          const regularApplications = generateWeeklyRegularApplications(startDate, 4); // Repeat for 4 weeks
          regularApplications.forEach(regular => {
            regular.created_by = employee.id;
            regular.last_update_by = employee.id;
            applications.push(regular);
          });
        } else {
          applications.push({
            start_date: startDate,
            end_date: endDate,
            application_type: 'Ad Hoc',
            status: 'Pending',
            created_by: employee.id,
            last_update_by: employee.id,
            verify_by: null,
            verify_timestamp: null,
            created_timestamp: new Date(),
            last_update_timestamp: new Date(),
          });
        }
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
