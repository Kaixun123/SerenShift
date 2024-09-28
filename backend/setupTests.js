// Jest setup file to configure or mock libraries globally

jest.mock('nodemailer', () => {
    const nodemailerMock = {
        createTransport: jest.fn(() => ({
            sendMail: jest.fn().mockResolvedValue(true),
        })),
    };
    return nodemailerMock;
});

afterEach(async () => {
    jest.clearAllMocks();
});
