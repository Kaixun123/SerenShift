const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove } = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         notification_id:
 *           type: integer
 *           description: The notification ID
 *         notification_type:
 *           type: string
 *           description: The type of notification
 *         content:
 *           type: string
 *           description: The content of the notification
 *         read_status:
 *           type: boolean
 *           description: The read status of the notification
 *         sender_id:
 *           type: integer
 *           description: The ID of the sender
 *         recipient_id:
 *           type: integer
 *           description: The ID of the recipient
 *         created_by:
 *           type: integer
 *           description: The ID of the user who created the notification
 *         last_update_by:
 *           type: integer
 *           description: The ID of the user who last updated the notification
 *         created_timestamp:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the notification was created
 *         last_update_timestamp:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the notification was last updated
 *       example:
 *         notification_id: 1
 *         notification_type: "Pending"
 *         content: "Your application has been approved"
 *         read_status: false
 *         sender_id: 2
 *         recipient_id: 1
 *         created_by: 2
 *         last_update_by: 2
 *         created_timestamp: 2023-01-01T00:00:00.000Z
 *         last_update_timestamp: 2023-01-01T00:00:00.000Z
 */

/**
 * @swagger
 * /api/notifications/retrieveNotifications:
 *   get:
 *     summary: Retrieve notifications for the logged-in user
 *     tags: [Notification]
 *     responses:
 *       200:
 *         description: Successfully retrieved notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       404:
 *         description: No notifications found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: You have no notifications.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: An error occurred while fetching notifications.
 */
router.get("/retrieveNotifications", ensureLoggedIn, (req, res) => notificationController.retrieveNotifications(req, res));

/**
 * @swagger
 * /api/notifications/updateNotificationReadStatus:
 *   patch:
 *     summary: Update the read status of a notification
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notification_id:
 *                 type: integer
 *                 description: The ID of the notification
 *             example:
 *               notification_id: 1
 *     responses:
 *       200:
 *         description: Notification read status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 message: Notification read status updated successfully
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Notification not found.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: An error occurred while updating notification read status.
 */
router.patch("/updateNotificationReadStatus", ensureLoggedIn, (req, res) => notificationController.updateNotificationReadStatus(req, res));

/**
 * @swagger
 * /api/notifications/markAllAsRead:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               readAll:
 *                 type: boolean
 *                 description: Flag to mark all notifications as read
 *             example:
 *               readAll: true
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 message: All notifications marked as read successfully
 *       404:
 *         description: No notifications found to clear
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: No notifications found to clear.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: An error occurred while clearing notifications.
 */
router.patch("/markAllAsRead", ensureLoggedIn, (req, res) => notificationController.markAllAsRead(req, res));

/**
 * @swagger
 * /api/notifications/clearNotifications:
 *   delete:
 *     summary: Clear all notifications for the logged-in user
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clearAll:
 *                 type: boolean
 *                 description: Flag to clear all notifications
 *             example:
 *               clearAll: true
 *     responses:
 *       200:
 *         description: All notifications cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 message: All notifications cleared successfully
 *       404:
 *         description: No notifications found to clear
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: No notifications found to clear.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: An error occurred while clearing notifications.
 */
router.delete("/clearNotifications", ensureLoggedIn, (req, res) => notificationController.clearNotifications(req, res));

/**
 * @swagger
 * /api/notifications/sendEmail:
 *   put:
 *     summary: Send an email
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mainRecipient:
 *                 type: string
 *                 description: The main recipient of the email
 *               subject:
 *                 type: string
 *                 description: The subject of the email
 *               message:
 *                 type: string
 *                 description: The message of the email
 *               cc:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: CC recipients of the email
 *               bcc:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: BCC recipients of the email
 *             example:
 *               mainRecipient: "john.doe@allinone.com.sg"
 *               subject: "Notification"
 *               message: "This is a test email."
 *               cc: ["jane.doe@allinone.com.sg"]
 *               bcc: ["manager@allinone.com.sg"]
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 message: Email sent successfully
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: An error occurred while sending email.
 */
router.put("/sendEmail", (req, res) => notificationController.sendEmail(req, res));

module.exports = router;
