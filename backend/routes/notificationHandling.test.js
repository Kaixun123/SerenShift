const request = require('supertest');
const express = require('express');
const router = require('../routes/notificationHandling');
const notificationController = require('../controllers/notificationController');

// Mock the middleware and controller
jest.mock('../controllers/notificationController', () => ({
    retrieveNotifications: jest.fn(),
    updateNotificationReadStatus: jest.fn(),
    markAllAsRead: jest.fn(),
    clearNotifications: jest.fn(),
    sendEmail: jest.fn(),
}));

jest.mock('../middlewares/authMiddleware', () => ({
    ensureLoggedIn: (req, res, next) => next(),
    ensureManagerAndAbove: (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Notification Handling Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /retrieveNotifications', () => {
        it('should retrieve notifications for the user', async () => {
            notificationController.retrieveNotifications.mockImplementation((req, res) => res.status(200).json([{ message: 'Notification retrieved' }]));

            const response = await request(app)
                .get('/retrieveNotifications');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([{ message: 'Notification retrieved' }]);
            expect(notificationController.retrieveNotifications).toHaveBeenCalled();
        });

        it('should handle cases where no notifications are found', async () => {
            notificationController.retrieveNotifications.mockImplementation((req, res) => res.status(404).json({ message: 'You have no notifications.' }));

            const response = await request(app)
                .get('/retrieveNotifications');

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'You have no notifications.');
            expect(notificationController.retrieveNotifications).toHaveBeenCalled();
        });
    });

    describe('PATCH /updateNotificationReadStatus', () => {
        it('should update the read status of a specific notification', async () => {
            notificationController.updateNotificationReadStatus.mockImplementation((req, res) => res.status(200).json({ message: 'Notification read status updated successfully' }));

            const response = await request(app)
                .patch('/updateNotificationReadStatus')
                .send({ notification_id: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Notification read status updated successfully' });
            expect(notificationController.updateNotificationReadStatus).toHaveBeenCalled();
        });

        it('should handle invalid notification ID', async () => {
            notificationController.updateNotificationReadStatus.mockImplementation((req, res) => res.status(404).json({ message: 'Notification not found.' }));

            const response = await request(app)
                .patch('/updateNotificationReadStatus')
                .send({ notification_id: 'invalid-id' });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Notification not found.');
            expect(notificationController.updateNotificationReadStatus).toHaveBeenCalled();
        });
    });

    describe('PATCH /markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            notificationController.markAllAsRead.mockImplementation((req, res) => res.status(200).json({ message: 'All notifications marked as read successfully' }));

            const response = await request(app)
                .patch('/markAllAsRead')
                .send({ readAll: true });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'All notifications marked as read successfully' });
            expect(notificationController.markAllAsRead).toHaveBeenCalled();
        });

        it('should handle no notifications to mark as read', async () => {
            notificationController.markAllAsRead.mockImplementation((req, res) => res.status(404).json({ message: 'No notifications found to clear.' }));

            const response = await request(app)
                .patch('/markAllAsRead')
                .send({ readAll: true });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'No notifications found to clear.');
            expect(notificationController.markAllAsRead).toHaveBeenCalled();
        });
    });

    describe('DELETE /clearNotifications', () => {
        it('should clear all notifications', async () => {
            notificationController.clearNotifications.mockImplementation((req, res) => res.status(200).json({ message: 'All notifications cleared successfully' }));

            const response = await request(app)
                .delete('/clearNotifications')
                .send({ clearAll: true });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'All notifications cleared successfully' });
            expect(notificationController.clearNotifications).toHaveBeenCalled();
        });

        it('should handle no notifications to clear', async () => {
            notificationController.clearNotifications.mockImplementation((req, res) => res.status(404).json({ message: 'No notifications found to clear.' }));

            const response = await request(app)
                .delete('/clearNotifications')
                .send({ clearAll: true });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'No notifications found to clear.');
            expect(notificationController.clearNotifications).toHaveBeenCalled();
        });
    });

    describe('PUT /sendEmail', () => {
        it('should send an email successfully', async () => {
            notificationController.sendEmail.mockImplementation((req, res) => res.status(200).json({ message: 'Email sent successfully' }));

            const response = await request(app)
                .put('/sendEmail')
                .send({
                    mainRecipient: 'recipient@example.com',
                    subject: 'Test Subject',
                    message: 'Test Message',
                    cc: ['cc@example.com'],
                    bcc: ['bcc@example.com']
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Email sent successfully' });
            expect(notificationController.sendEmail).toHaveBeenCalled();
        });

        it('should handle email sending errors', async () => {
            notificationController.sendEmail.mockImplementation((req, res) => res.status(500).json({ error: 'An error occurred while sending email.' }));

            const response = await request(app)
                .put('/sendEmail')
                .send({
                    mainRecipient: 'invalid-email',
                    subject: 'Test Subject',
                    message: 'Test Message'
                });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error', 'An error occurred while sending email.');
            expect(notificationController.sendEmail).toHaveBeenCalled();
        });
    });
});
