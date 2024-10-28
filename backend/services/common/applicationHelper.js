const moment = require('moment'); // Ensure moment.js is installed
const { splitScheduleByDate } = require('./scheduleHelper');
const { uploadFile } = require('../uploads/s3');
const { Application } = require('../../models');

const checkforOverlap = async (newStartDate, newEndDate, dataArray, applicationType) => {
    try {
        let formattedNewDate = await splitScheduleByDate(newStartDate, newEndDate);
        for (const newDate of formattedNewDate) {
            // dataArray can be both existingPending OR approvedApplication
            for (const data of dataArray) {
                // Split the existing date range into blocks by day
                const dateBlocks = await splitScheduleByDate(data.start_date, data.end_date);

                for (const block of dateBlocks) {
                    // Ensure comparison happens only on the same date
                    if (block.date === newDate.date) {

                        // Convert newDate to full date-time for proper range comparison
                        let newStartDate = moment(`${newDate.date} ${newDate.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                        let newEndDate = moment(`${newDate.date} ${newDate.end_time}`, 'YYYY-MM-DD HH:mm:ss');

                        let existingStartDate = moment(`${block.date} ${block.start_time}`, 'YYYY-MM-DD HH:mm:ss')
                        let existingEndDate = moment(`${block.date} ${block.end_time}`, 'YYYY-MM-DD HH:mm:ss')

                        // Overlap condition: check if the new date period overlaps with the existing/approved date period
                        // (1) condition is to check if the new start_date is before existing/approved end_date && new end_date is after existing/approved start_date (full or partial overlap)
                        // (2) condition is to check if the new start_date is before existing/approved start_date && new end_date is after existing/approved start_date (1-day edge case)
                        if ((newStartDate.isBefore(existingEndDate) && newEndDate.isAfter(existingStartDate))
                            || newStartDate.isBefore(existingStartDate) && newEndDate.isAfter(existingStartDate)) {
                            return true
                        }
                    }
                }
            }
        }
        return false;
    } catch (error) {
        console.error(`Error fetching ${applicationType} application:`, error);
        throw new Error(`Error fetching ${applicationType} application.`);
    }
}

const checkWhetherSameDate = (date1, date2) => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() && // Months are 0-indexed in JavaScript
        date1.getDate() === date2.getDate()
    );
}

const splitDatesByDay = (startDate, endDate) => {
    const results = [];
    let currentDate = new Date(startDate);
    // Set time on end date to be the same time as startDate for consistent pairs
    const endDateTime = new Date(endDate);
    endDateTime.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
    while (currentDate <= endDate) {
        // Clone currentDate for start and end times for the current day
        const startOfDay = new Date(currentDate);
        const endOfDay = new Date(currentDate);
        // Set the time of the start and end date for the current day
        startOfDay.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
        endOfDay.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds(), endDate.getMilliseconds());
        // Add the pair to the result array
        results.push([startOfDay, endOfDay]);
        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return results;
}

const splitConsecutivePeriodByDay = (startDate, endDate) => {
    const results = [];
    // Validate dates
    if (isNaN(new Date(startDate)) || isNaN(new Date(endDate))) {
      console.error("Invalid dates provided:", startDate, endDate);
      return [];
    } else {
      console.log("Valid dates provided:", startDate, endDate);
    }

    let currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);
    if (currentDate > endDateTime) {
      console.error("startDate is after endDate:", startDate, endDate);
      return [];
    } else {
      console.log("startDate is before or equal to endDate:", startDate, endDate);
    }

    while (currentDate <= endDateTime) {
      // Clone currentDate for start and end times for the current day
      const newDay = new Date(currentDate);
      results.push(newDay);
  
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return results;
  };

// Helper Function to upload files to S3
const uploadFilesToS3 = async (files, applicationId, userId) => {
    if (!files || files.length === 0) return;

    const uploadPromises = files.map(file => uploadFile(file, 'application', applicationId, false, { id: userId }));
    await Promise.all(uploadPromises);
};

module.exports = {
    checkforOverlap,
    checkWhetherSameDate,
    splitDatesByDay,
    splitConsecutivePeriodByDay,
    uploadFilesToS3,
};