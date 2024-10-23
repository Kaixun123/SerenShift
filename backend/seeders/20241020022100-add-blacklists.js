'use strict';

const { Op } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all employees with the role of either "Manager" or "HR"
    const employees = await queryInterface.sequelize.query(
      'SELECT id FROM Employees WHERE role IN (:roles)',
      {
        replacements: { roles: ['Manager', 'HR'] },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    // Helper function to generate a random time slot within the day
    const getRandomTimeSlot = () => {
      const timeSlots = [
        { start: '09:00:00', end: '13:00:00' }, // Morning
        { start: '14:00:00', end: '18:00:00' }, // Afternoon
        { start: '09:00:00', end: '18:00:00' }  // Whole day
      ];
      return timeSlots[Math.floor(Math.random() * timeSlots.length)];
    };

    // Helper function to get random weekday within the next 30 days
    const getRandomWeekday = () => {
      const today = new Date();
      const weekdays = [];

      // Iterate over the next 30 days to find weekdays
      for (let i = 1; i <= 30; i++) {
        const day = new Date();
        day.setDate(today.getDate() + i);
        const dayOfWeek = day.getDay();
        if (dayOfWeek > 0 && dayOfWeek < 6) { // Monday to Friday
          weekdays.push(day);
        }
      }

      // Return a random weekday
      return weekdays[Math.floor(Math.random() * weekdays.length)];
    };

    // Array to hold blacklist entries
    const blacklists = [];

    // Generate 10 blacklists per eligible employee
    employees.forEach(employee => {
      for (let i = 0; i < 10; i++) {
        const randomDate = getRandomWeekday();
        const { start, end } = getRandomTimeSlot();

        const startDate = new Date(randomDate);
        const endDate = new Date(randomDate);

        // Set the time for both start and end dates
        const [startHour, startMinute, startSecond] = start.split(':');
        startDate.setHours(startHour, startMinute, startSecond);

        const [endHour, endMinute, endSecond] = end.split(':');
        endDate.setHours(endHour, endMinute, endSecond);

        blacklists.push({
          start_date: startDate,
          end_date: endDate,
          created_by: employee.id,
          last_update_by: employee.id,
          created_timestamp: new Date(),
          last_update_timestamp: new Date()
        });
      }
    });

    // Insert the blacklists into the database
    await queryInterface.bulkInsert('Blacklist', blacklists, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Optionally add the logic to revert the seeder if necessary
    await queryInterface.bulkDelete('Blacklist', null, {});
  }
};
