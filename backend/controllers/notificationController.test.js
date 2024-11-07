const {
    retrieveNotifications,
    updateNotificationReadStatus,
    markAllAsRead,
    clearNotifications,
    sendEmail
} = require('./notificationController');
const { Employee, Notification, Application } = require('../models');
const { send_email } = require('../services/email/emailService');
const { sequelize } = require('../services/database/mysql');

jest.mock('../models', () => ({
    Application: {
        findAll: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
    },
    Employee: {
        findByPk: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn()
    },
    Schedule: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    },
    Blacklist: {
        findAll: jest.fn(),
        create: jest.fn(),
    },
    Notification: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
    },
}));
jest.mock('../services/email/emailService');
jest.mock('../services/database/mysql');

const mockReq = (data) => ({ ...data });
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Notification Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('retrieveNotifications', () => {
        it('should retrieve notifications for a valid employee with notifications', async () => {
            const req = mockReq({ user: { id: 1 } });
            const res = mockRes();
        
            // Mock notification data
            const mockNotifications = [
                {
                    notification_id: 1,
                    notification_type: 'New Application',
                    content: 'You have a new application',
                    read_status: false,
                    sender_id: 2,
                    recipient_id: 1,
                    linked_application_id: 1,
                    created_timestamp: new Date(),
                    last_update_timestamp: new Date(),
                }
            ];
        
            const mockEmployee = { id: 1 };
            const mockSender = {
                first_name: 'John',
                last_name: 'Doe',
                department: 'Engineering',
                position: 'Manager',
                email: 'john.doe@example.com'
            };
            const mockApplication = {
                start_date: '2024-10-01',
                end_date: '2024-10-02',
                application_type: 'Leave',
                requestor_remarks: 'Annual leave',
                approver_remarks: 'Approved',
                withdrawal_remarks: null
            };
        
            // Mock necessary model calls
            Employee.findByPk.mockResolvedValue(mockEmployee);
            Notification.findAll.mockResolvedValue(mockNotifications);
            Employee.findOne.mockResolvedValue(mockSender);
            Application.findOne.mockResolvedValue(mockApplication);
        
            // Expected response structure after mapping notification information
            const expectedResponse = [
                {
                    notification_id: 1,
                    notification_type: 'New Application',
                    content: 'You have a new application',
                    read_status: false,
                    sender_id: 2,
                    senderInfo: {
                        first_name: 'John',
                        last_name: 'Doe',
                        department: 'Engineering',
                        position: 'Manager',
                        email: 'john.doe@example.com'
                    },
                    recipient_id: 1,
                    application_info: {
                        start_date: '2024-10-01',
                        end_date: '2024-10-02',
                        application_type: 'Leave',
                        requestor_remarks: 'Annual leave',
                        approver_remarks: 'Approved',
                        withdrawal_remarks: null
                    },
                    created_timestamp: mockNotifications[0].created_timestamp,
                    last_update_timestamp: mockNotifications[0].last_update_timestamp
                }
            ];
        
            // Execute function
            await retrieveNotifications(req, res);
        
            // Assertions
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should return 404 if the employee is not found', async () => {
            const req = mockReq({ user: { id: 1 } });
            const res = mockRes();
            Employee.findByPk.mockResolvedValue(null);

            await retrieveNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Employee Not Found" });
        });

        it('should return 404 if there are no notifications', async () => {
            const req = mockReq({ user: { id: 1 } });
            const res = mockRes();
            Employee.findByPk.mockResolvedValue({ id: 1 });
            Notification.findAll.mockResolvedValue([]);

            await retrieveNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: `You have no notifications.` });
        });
    });

    describe('updateNotificationReadStatus', () => {
        it('should update the read status of a notification successfully', async () => {
            const req = mockReq({ body: { notification_id: 1 }, user: { id: 1 } });
            const res = mockRes();
            const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
            const mockNotification = { recipient_id: 1, save: jest.fn() };

            sequelize.transaction.mockResolvedValue(mockTransaction);
            Notification.findByPk.mockResolvedValue(mockNotification);

            await updateNotificationReadStatus(req, res);

            expect(mockNotification.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Notification read status updated successfully" });
        });

        it('should return 404 if the notification is not found', async () => {
            const req = mockReq({ body: { notification_id: 1 }, user: { id: 1 } });
            const res = mockRes();
            sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() });
            Notification.findByPk.mockResolvedValue(null);

            await updateNotificationReadStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Notification not found." });
        });

        it('should return 404 if the notification does not belong to the user', async () => {
            const req = mockReq({ body: { notification_id: 1 }, user: { id: 2 } });
            const res = mockRes();
            const mockNotification = { recipient_id: 1 };

            Notification.findByPk.mockResolvedValue(mockNotification);

            await updateNotificationReadStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Notification does not belong to the recipient." });
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read for the user', async () => {
            const req = mockReq({ user: { id: 1 }, body: { readAll: true } });
            const res = mockRes();
            const mockNotifications = [{ save: jest.fn() }];

            Notification.findAll.mockResolvedValue(mockNotifications);
            sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() });

            await markAllAsRead(req, res);

            mockNotifications.forEach(notification => {
                expect(notification.save).toHaveBeenCalled();
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "All notifications marked as read successfully" });
        });

        it('should return 404 if no notifications are found', async () => {
            const req = mockReq({ user: { id: 1 }, body: { readAll: true } });
            const res = mockRes();

            Notification.findAll.mockResolvedValue([]);

            await markAllAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No notifications found to clear." });
        });
    });

    describe('clearNotifications', () => {
        it('should clear all notifications for the user', async () => {
            const req = mockReq({ user: { id: 1 }, body: { clearAll: true } });
            const res = mockRes();
            const mockNotifications = [{ destroy: jest.fn() }];

            Notification.findAll.mockResolvedValue(mockNotifications);
            sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() });

            await clearNotifications(req, res);

            mockNotifications.forEach(notification => {
                expect(notification.destroy).toHaveBeenCalled();
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "All notifications cleared successfully" });
        });

        it('should return 404 if no notifications are found', async () => {
            const req = mockReq({ user: { id: 1 }, body: { clearAll: true } });
            const res = mockRes();

            Notification.findAll.mockResolvedValue([]);

            await clearNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "No notifications found to clear." });
        });
    });

    describe('sendEmail', () => {
        it('should send an email successfully', async () => {
            const req = mockReq({
                body: {
                    mainRecipient: 'test@example.com',
                    subject: 'Test Subject',
                    message: 'Test Message',
                    cc: 'cc@example.com',
                    bcc: 'bcc@example.com'
                }
            });
            const res = mockRes();

            send_email.mockResolvedValue();

            await sendEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Email sent successfully" });
        });

        it('should return 500 if email sending fails', async () => {
            const req = mockReq({
                body: {
                    mainRecipient: 'test@example.com',
                    subject: 'Test Subject',
                    message: 'Test Message'
                }
            });
            const res = mockRes();

            send_email.mockRejectedValue(new Error('Email failed'));

            await sendEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "An error occurred while sending email." });
        });
    });
});
