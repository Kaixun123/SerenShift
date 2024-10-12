'use strict';

// Helper function to generate random dates within a specific range (e.g., within the next 30 days)
const generateRandomDate = (daysRange = 30) => {
  let randomDate;
  do {
    const today = new Date();
    const randomDays = Math.floor(Math.random() * daysRange);
    randomDate = new Date(today);
    randomDate.setDate(today.getDate() + randomDays);
  } while (randomDate.getDay() === 0 || randomDate.getDay() === 6); // 0 = Sunday, 6 = Saturday
  return randomDate;
};

// Helper function to generate start and end times for morning, afternoon, or whole day
const generateFixedTimes = () => {
  const MORNING_START = new Date().setHours(9, 0, 0, 0);  // 9:00 am
  const MORNING_END = new Date().setHours(13, 0, 0, 0);    // 1:00 pm
  const AFTERNOON_START = new Date().setHours(14, 0, 0, 0); // 2:00 pm
  const AFTERNOON_END = new Date().setHours(18, 0, 0, 0);  // 6:00 pm
  const WHOLE_DAY_START = new Date().setHours(9, 0, 0, 0);  // 9:00 am
  const WHOLE_DAY_END = new Date().setHours(18, 0, 0, 0);   // 6:00 pm

  // Randomly choose between morning, afternoon, or whole day
  const randomChoice = Math.random();
  let startTime, endTime;

  if (randomChoice < 0.33) {
    startTime = new Date(MORNING_START);
    endTime = new Date(MORNING_END);
  } else if (randomChoice < 0.66) {
    startTime = new Date(AFTERNOON_START);
    endTime = new Date(AFTERNOON_END);
  } else {
    startTime = new Date(WHOLE_DAY_START);
    endTime = new Date(WHOLE_DAY_END);
  }

  // Add randomness to the start date
  const randomDate = generateRandomDate(30); // Generate random date within the next 30 days
  startTime.setFullYear(randomDate.getFullYear(), randomDate.getMonth(), randomDate.getDate());
  endTime.setFullYear(randomDate.getFullYear(), randomDate.getMonth(), randomDate.getDate());

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

    let schedules = [];
    let applications = [];

    employees.forEach(employee => {
      // Step 3: Create schedules for each employee
      const scheduleCount = getRandomInt(1, 5); // Generate between 1 and 5 schedules per employee
      for (let i = 0; i < scheduleCount; i++) {
        const { startDate, endDate } = generateFixedTimes(); // Generate fixed start and end times with random dates
        const isRegularSchedule = Math.random() < 0.2;  // 20% chance of generating a Regular schedule

        const scheduleEntry = {
          start_date: startDate,
          end_date: endDate,
          schedule_type: isRegularSchedule ? 'Regular' : 'Ad Hoc',
          created_by: employee.id,
          last_update_by: employee.id,
          verify_by: employee.reporting_manager,
          verify_timestamp: new Date(),
          created_timestamp: new Date(),
          last_update_timestamp: new Date(),
        };

        // Push to the schedules array
        schedules.push(scheduleEntry);
      }

      // Step 4: Create applications for each employee
      const applicationCount = getRandomInt(1, 5); // Generate between 1 and 5 applications per employee
      for (let i = 0; i < applicationCount; i++) {
        const { startDate, endDate } = generateFixedTimes(); // Generate fixed start and end times with random dates
        const isRegularApplication = Math.random() < 0.2;  // 20% chance of generating a Regular application

        if (isRegularApplication) {
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

    // Step 5: Insert all schedules and applications
    await queryInterface.bulkInsert('Schedules', schedules);
    await queryInterface.bulkInsert('Applications', applications);

    // Step 6: Retrieve inserted regular schedules and applications with their IDs for each employee
    const insertedSchedules = await queryInterface.sequelize.query(
      `SELECT schedule_id, created_by 
       FROM Schedules 
       WHERE schedule_type = "Regular" 
       ORDER BY created_by, created_timestamp`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const insertedApplications = await queryInterface.sequelize.query(
      `SELECT application_id, created_by 
       FROM Applications 
       WHERE application_type = "Regular" 
       ORDER BY created_by, created_timestamp`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Step 7: Update linked_application and linked_schedule fields
    let lastApplicationForEmployee = {};
    let lastScheduleForEmployee = {};

    // Iterate through the regular applications
    for (let i = 0; i < insertedApplications.length - 1; i++) {
      const currentApplication = insertedApplications[i];
      const nextApplication = insertedApplications[i + 1];

      // If the next application belongs to the same employee, link them
      if (currentApplication.created_by === nextApplication.created_by) {
        await queryInterface.bulkUpdate('Applications',
          { linked_application: nextApplication.application_id },
          { application_id: currentApplication.application_id }
        );
      }
    }

    // Iterate through the regular schedules
    for (let i = 0; i < insertedSchedules.length - 1; i++) {
      const currentSchedule = insertedSchedules[i];
      const nextSchedule = insertedSchedules[i + 1];

      // If the next schedule belongs to the same employee, link them
      if (currentSchedule.created_by === nextSchedule.created_by) {
        await queryInterface.bulkUpdate('Schedules',
          { linked_schedule: nextSchedule.schedule_id },
          { schedule_id: currentSchedule.schedule_id }
        );
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Step 8: Delete the inserted schedule and application entries
    await queryInterface.bulkDelete('Schedules', null, {});
    await queryInterface.bulkDelete('Applications', null, {});
  }
};
