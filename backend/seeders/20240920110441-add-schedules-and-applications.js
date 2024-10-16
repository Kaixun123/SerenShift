'use strict';

// Helper function to generate random dates within a specific range (past or future)
const generateRandomDateInRange = (daysRange = 30, past = false) => {
  let randomDate;
  do {
    const today = new Date();
    const randomDays = Math.floor(Math.random() * daysRange);
    randomDate = new Date(today);
    randomDate.setDate(today.getDate() + (past ? -randomDays : randomDays));
  } while (randomDate.getDay() === 0 || randomDate.getDay() === 6); // Avoid weekends
  return randomDate;
};

// Helper function to check for schedule conflicts
const hasConflict = (newStartDate, newEndDate, schedules) => {
  return schedules.some(schedule => {
    return (
      (newStartDate >= schedule.start_date && newStartDate < schedule.end_date) ||
      (newEndDate > schedule.start_date && newEndDate <= schedule.end_date) ||
      (newStartDate <= schedule.start_date && newEndDate >= schedule.end_date)
    );
  });
};

// Modified generateFixedTimes for specific ranges (either past or future)
const generateFixedTimes = (past = false) => {
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

  // Add randomness to the start date (past or future)
  const randomDate = generateRandomDateInRange(30, past);
  startTime.setFullYear(randomDate.getFullYear(), randomDate.getMonth(), randomDate.getDate());
  endTime.setFullYear(randomDate.getFullYear(), randomDate.getMonth(), randomDate.getDate());

  return { startDate: startTime, endDate: endTime };
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fetch existing employees
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

    for (const employee of employees) {
      const existingSchedules = await queryInterface.sequelize.query(
        `SELECT * FROM Schedules WHERE created_by = ?`,
        {
          replacements: [employee.id],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Create approved application and schedule pairs with start and end dates within the last 30 days
      for (let i = 0; i < 2; i++) {  // Let's create two approved past applications per employee
        let { startDate, endDate } = generateFixedTimes(true);  // Generate dates in the past 30 days

        // Ensure no schedule conflicts for approved applications
        while (hasConflict(startDate, endDate, existingSchedules)) {
          ({ startDate, endDate } = generateFixedTimes(true));
        }

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

        applications.push({
          start_date: startDate,
          end_date: endDate,
          application_type: 'Ad Hoc',
          status: 'Approved',
          created_by: employee.id,
          last_update_by: employee.id,
          verify_by: null,
          verify_timestamp: null,
          created_timestamp: new Date(),
          last_update_timestamp: new Date(),
        });
      }

      // Create rejected/withdrawn applications with start and end dates within the last 30 days
      for (let i = 0; i < 2; i++) {  // Let's create two rejected/withdrawn applications per employee
        const { startDate, endDate } = generateFixedTimes(true);  // Generate dates in the past 30 days

        const status = Math.random() < 0.5 ? 'Rejected' : 'Withdrawn';

        applications.push({
          start_date: startDate,
          end_date: endDate,
          application_type: 'Ad Hoc',
          status: status,
          created_by: employee.id,
          last_update_by: employee.id,
          verify_by: null,
          verify_timestamp: null,
          created_timestamp: new Date(),
          last_update_timestamp: new Date(),
        });
      }
    }

    // Insert all schedules and applications
    await queryInterface.bulkInsert('Schedules', schedules);
    await queryInterface.bulkInsert('Applications', applications);
  },

  down: async (queryInterface, Sequelize) => {
    // Delete the inserted schedules and applications
    await queryInterface.bulkDelete('Schedules', null, {});
    await queryInterface.bulkDelete('Applications', null, {});
  }
};
