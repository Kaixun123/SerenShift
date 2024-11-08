jest.mock('nodemailer', () => {
    const nodemailerMock = {
        createTransport: jest.fn(() => ({
            sendMail: jest.fn().mockResolvedValue(true),
        })),
    };
    return nodemailerMock;
});

jest.mock('./services/database/mysql', () => ({
    sequelize: {
        transaction: jest.fn(() => ({
            commit: jest.fn(),
            rollback: jest.fn(),
        })),
    },
}));

jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn(),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    HeadObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn(),
}));