const { Application, Employee, Notification } = require('../models');
const { sequelize } = require('../services/database/mysql');
const { send_email } = require('../services/email/emailService');

const retrieveNotifications = async (req, res) => {
    try {
        const recipient = await Employee.findByPk(req.user.id);
        if (!recipient) {
            return res.status(404).json({ message: "Employee Not Found" });
        }

        let notificationInfo = await Notification.findAll({
            where: {
                recipient_id: recipient.id
            }
        })

        if (!notificationInfo || notificationInfo.length === 0) {
            return res.status(404).json({ message: `You have no notifications.` });
        };

        let response = [];
        notificationInfo.forEach(notification => {
            response.push({
                notification_id: notification.notification_id,
                notification_type: notification.notification_type,
                content: notification.content,
                read_status: notification.read_status,
                sender_id: notification.sender_id,
                recipient_id: notification.recipient_id,
                created_by: notification.created_by,
                last_update_by: notification.last_update_by,
                created_timestamp: notification.created_timestamp,
                last_update_timestamp: notification.last_update_timestamp
            })
        })

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ error: "An error occurred while fetching notifications." });
    }
}

const updateNotificationReadStatus = async (req, res) => {
    try {
        const { notification_id } = req.body;
        const transaction = await sequelize.transaction();

        let notificationInfo = await Notification.findByPk(notification_id);

        if (!notificationInfo) {
            await transaction.rollback();
            return res.status(404).json({ message: "Notification not found." });
        } else if (notificationInfo.recipient_id != req.user.id) {
            await transaction.rollback();
            return res.status(404).json({ message: "Notification does not belong to the recipient." });
        }

        notificationInfo.read_status = true;
        notificationInfo.last_update_by = req.user.id;
        await notificationInfo.save({ transaction });
        await transaction.commit();
        return res.status(200).json({ message: "Notification read status updated successfully" });
    } catch (error) {
        console.error("Error updating notification read status:", error);
        return res.status(500).json({ error: "An error occurred while updating notification read status." });
    }
}

const clearNotifications = async (req, res) => {
    try {
        const { notification_id, clearAll } = req.body;
        const transaction = await sequelize.transaction();

        if (clearAll) {
            let notificationInfo = await Notification.findAll({
                where: { recipient_id: req.user.id }
            });

            if (!notificationInfo || notificationInfo.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ message: "No notifications found to clear." });
            }

            for (let notification of notificationInfo) {
                notification.last_update_by = req.user.id;
                notification.read_status = true; 
                await notification.save({ transaction });
            }

            await transaction.commit();
            return res.status(200).json({ message: "All notifications marked as cleared successfully" });
        }

        // For individual notification marking as cleared
        let notificationInfo = await Notification.findByPk(notification_id);

        if (!notificationInfo) {
            await transaction.rollback();
            return res.status(404).json({ message: "No notification found to clear." });
        } else if (notificationInfo.recipient_id !== req.user.id) {
            await transaction.rollback();
            return res.status(403).json({ message: "Notification does not belong to the recipient." });
        }

        notificationInfo.last_update_by = req.user.id;
        notificationInfo.read_status = true; // Mark the individual notification as cleared/read
        await notificationInfo.save({ transaction });

        await transaction.commit();
        return res.status(200).json({ message: "Notification marked as cleared successfully" });

    } catch (error) {
        console.error("Error clearing notification:", error);
        return res.status(500).json({ error: "An error occurred while clearing notification." });
    }
};

const sendEmail = async (req, res) => {
    try {
        await send_email(req.body.mainRecipient, req.body.subject, req.body.message, req.body.cc, req.body.bcc);
        return res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "An error occurred while sending email." });
    }
}

module.exports = {
    retrieveNotifications,
    updateNotificationReadStatus,
    clearNotifications,
    sendEmail
}