const { Application, Employee, Notification } = require('../models');
const { sequelize } = require('../services/database/mysql');

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

        notificationInfo.read_status = 1;
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
                await notification.destroy({ transaction });
            }

            await transaction.commit();
            return res.status(200).json({ message: "All notifications cleared successfully" });
        }

        // For individual notification deletion
        let notificationInfo = await Notification.findByPk(notification_id);

        if (!notificationInfo || notificationInfo.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: "No notification found to clear." });
        } else if (notificationInfo.recipient_id != req.user.id) {
            await transaction.rollback();
            return res.status(403).json({ message: "Notification does not belong to the recipient." });
        }

        notificationInfo.last_update_by = req.user.id;
        await notificationInfo.destroy({ transaction });
        await transaction.commit();
        return res.status(200).json({ message: "Notification cleared successfully" });

    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({ error: "An error occurred while deleting notification." });
    }
}

module.exports = {
    retrieveNotifications,
    updateNotificationReadStatus,
    clearNotifications
}