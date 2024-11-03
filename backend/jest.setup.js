jest.mock('nodemailer', () => {
    const nodemailerMock = {
        createTransport: jest.fn(() => ({
            sendMail: jest.fn().mockResolvedValue(true),
        })),
    };
    return nodemailerMock;
});

jest.mock('@aws-sdk/client-s3', () => {
    return {
        S3: jest.fn(() => ({
            getObject: jest.fn().mockResolvedValue({ Body: 'mocked body' }),
            putObject: jest.fn().mockResolvedValue({}),
            deleteObject: jest.fn().mockResolvedValue({}),
        })),
    };
});

jest.mock('@aws-sdk/s3-request-presigner', () => {
    return {
        getSignedUrl: jest.fn().mockResolvedValue('https://mocked-url.com'),
    };
});