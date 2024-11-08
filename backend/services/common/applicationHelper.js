const moment = require('moment'); // Ensure moment.js is installed
const { splitScheduleByDate } = require('./scheduleHelper');
const { uploadFile, checkFileExists } = require('../uploads/s3');
const { File } = require('../../models');
const { send_email } = require('../email/emailService');

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

// Helper function to return the remaining dates after removing the withdrawal/rejected dates
const extractRemainingDates = (existingMoments, withdrawMoments) => { // Both are arrays of Moment objects
    let remainingDates = [];
    let currentBlock = [];
    // Loop through and compare the existing dates with the withdrawal dates
    for (const currDate of existingMoments) {
        const currMoment = moment(currDate).format('YYYY-MM-DD'); // Adjust date format for comparison

        if (withdrawMoments.includes(currMoment)) {
            if (currentBlock.length > 0) {      // if current date is in withdraw dates, 
                remainingDates.push(currentBlock);      // end the current block and push to remaining dates
            };
            currentBlock = [];  // Reset and start a new block
            continue;
        }
        currentBlock.push(currDate);  // if current date not in withdraw dates, add to current block
    };
    if (currentBlock.length > 0) {
        remainingDates.push(currentBlock);
    };

    // Returns array of arrays of YYYY-MM-DD dates 
    return remainingDates;  // (all unbroken chains of consecutive dates are in the same array)
};

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
    // Validation of date inputs
    if (isNaN(new Date(startDate)) || isNaN(new Date(endDate))) {
        console.error("Invalid dates provided:", startDate, endDate);
        return [];
    } else {
        console.log("Splitting consecutive period by day:", startDate, endDate);
        console.log("Valid dates provided:", startDate, endDate);
    }

    const results = [];
    let currentDate = moment(startDate);
    const endDateTime = moment(endDate);

    while (currentDate.isSameOrBefore(endDateTime, 'day')) {
        results.push(currentDate.format('YYYY-MM-DD'));  // Push date in 'YYYY-MM-DD' format
        currentDate.add(1, 'day');  // Move to the next day
    }
    return results;
};

// Helper Function to upload files to S3
const uploadFilesToS3 = async (files, applicationId, userId) => {
    if (!files || files.length === 0) return;

    const uploadPromises = files.map(file => uploadFile(file, 'application', applicationId, false, { id: userId }));
    await Promise.all(uploadPromises);
};

const updateFileDetails = async (fileId, newApplicationId, newS3Key, file, isFirstBlock) => {
    try {
        const fileExists = await checkFileExists(newS3Key);
        if (fileExists && !isFirstBlock) {
            // Update the existing file row
            await File.update(
                {
                    related_entity_id: newApplicationId,
                    s3_key: newS3Key,
                },
                {
                    where: { file_id: fileId },
                }
            );
            console.log(`File details updated successfully for file ID ${fileId}`);
        } else {

            // Create a new file row
            await File.create({
                related_entity_id: newApplicationId,
                s3_key: newS3Key,
                file_name: file.file_name,
                file_extension: file.file_extension,
                related_entity: "Application",
                created_by: file.created_by,
                last_update_by: file.created_by,
            });
            console.log(`New file row created successfully for file ID ${fileId}`);
        }
    } catch (error) {
        console.error("Error updating file details:", error);
        throw error;
    }
}

const generateNewFileName = (fileName, userId, newApplicationId, fileExtension) => {
    const currentDateTime = new Date().toISOString().replace(/[:.-]/g, '');
    const prefix = fileName.substring(0, fileName.indexOf('_'));
    return `${prefix}_${userId}_${newApplicationId}_${currentDateTime}.${fileExtension}`;
};

const emailTemplates = {
    "createApplication": {
        subject: "A WFH application is pending your approval",
    },
    "approvedApplication": {
        subject: "Your WFH Application has been approved",
    },
    "rejectedApplication": {
        subject: "Your WFH application has been rejected",
    },
    "updateApplication": {
        subject: "A WFH is pending your reapproval",
    },
    "withdrawnApplication": {
        subject: "A WFH application has been withdrawn",
    },
    "autoRejectedApplication": {
        subject: "Your WFH application has been auto-rejected by the system",
    }
}

const sendNotificationEmail = async (application, requestor, recipient, eventType, cc, bcc) => {
    if (!application || !requestor || !recipient || !eventType)
        console.error("One or more of the required parameters are missing");
    else {
        try {
            console.log(application);
            console.log(requestor);
            console.log(recipient);
            const template = emailTemplates[eventType];
            if (!template) {
                console.error(`No email template found for event type: ${eventType}`);
                return;
            }

            const startDate = new Date(application.start_date);
            const endDate = new Date(application.end_date);

            if (isNaN(startDate) || isNaN(endDate)) {
                console.error("Invalid start_date or end_date in application");
                return;
            }

            let message = "";
            const { subject } = template;

            switch (eventType) {
                case "createApplication":
                    if (!cc)
                        cc = recipient.email;
                    message += "Hi " + recipient.first_name + " " + recipient.last_name +
                        ",\n\nYou have a pending Work From Home Request from " + requestor.first_name +
                        " " + requestor.last_name + ". Kindly review and make your decision at your earlier convinence.\n\n" +
                        "Requested WFH Start Period: " + startDate.toLocaleDateString() + "\nRequested WFH End Period: " + endDate.toLocaleDateString() +
                        "\nRemarks: " + application.requestor_remarks + "\n\nThank You,\nSerenShift\n\nThis is an automated email notification, please do not reply to this email"
                    break;
                case "approvedApplication":
                    if (!cc)
                        cc = recipient.email;
                    message += "Hi " + requestor.first_name + " " + requestor.last_name +
                        ",\n\nYour application has been approved by " + recipient.first_name +
                        " " + recipient.last_name + ". Kindly review your application at your earlier convinence.\n\n" +
                        "Requested WFH Start Period: " + startDate.toLocaleDateString() + "\nRequested WFH End Period: " + endDate.toLocaleDateString() +
                        "\nRemarks: " + application.approver_remarks + "\n\nThank You,\nSerenShift\n\nThis is an automated email notification, please do not reply to this email"
                    break;
                case "rejectedApplication":
                    if (!cc)
                        cc = recipient.email;
                    message += "Hi " + requestor.first_name + " " + requestor.last_name +
                        ",\n\nYour application has been rejected by " + recipient.first_name +
                        " " + recipient.last_name + ". Kindly review your application at your earlier convinence.\n\n" +
                        "Requested WFH Start Period: " + startDate.toLocaleDateString() + "\nRequested WFH End Period: " + endDate.toLocaleDateString() +
                        "\nRemarks: " + application.approver_remarks + "\n\nThank You,\nSerenShift\n\nThis is an automated email notification, please do not reply to this email"
                    break;
                case "updateApplication":
                    if (!cc)
                        cc = recipient.email;
                    message += "Hi " + recipient.first_name + " " + recipient.last_name +
                        ",\n\nYour authorized application has been modified by " + requestor.first_name +
                        " " + recipient.last_name + ". Kindly review and make your decision at your earlier convinence.\n\n" +
                        "Requested WFH Start Period: " + startDate.toLocaleDateString() + "\nRequested WFH End Period: " + endDate.toLocaleDateString() +
                        "\nRemarks: " + application.requestor_remarks + "\n\nThank You,\nSerenShift\n\nThis is an automated email notification, please do not reply to this email"
                    break;
                case "withdrawnApplication":
                    if (!cc)
                        cc = recipient.email;
                    message += "Hi " + requestor.first_name + " " + requestor.last_name +
                        ",\n\nYour authorized application has been withdrawn by " + recipient.first_name +
                        " " + recipient.last_name + ". Kindly reach to your team member at your earlier convinence.\n\n" +
                        "Requested WFH Start Period: " + startDate.toLocaleDateString() + "\nRequested WFH End Period: " + endDate.toLocaleDateString() +
                        "\nRemarks: " + application.requestor_remarks + "\n\nThank You,\nSerenShift\n\nThis is an automated email notification, please do not reply to this email"
                    break;
                case "autoRejectedApplication":
                    if (!cc)
                        cc = recipient.email;
                    message += "Hi " + requestor.first_name + " " + requestor.last_name +
                        ",\n\nYour application has been auto-rejected by the system. Kindly review your application and resubmit at your earlier convinence.\n\n" +
                        "Requested WFH Start Period: " + startDate.toLocaleDateString() + "\nRequested WFH End Period: " + endDate.toLocaleDateString() +
                        "\nRemarks: " + application.approver_remarks + "\n\nThank You,\nSerenShift\n\nThis is an automated email notification, please do not reply to this email"
                    break;
                default:
                    break;
            }
            await send_email(recipient.email, subject, message, cc, bcc);

        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = {
    checkforOverlap,
    checkWhetherSameDate,
    extractRemainingDates,
    splitDatesByDay,
    splitConsecutivePeriodByDay,
    uploadFilesToS3,
    updateFileDetails,
    generateNewFileName,
    sendNotificationEmail
};
