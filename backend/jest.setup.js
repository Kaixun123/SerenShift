const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
});

global.sequelize = sequelize;

beforeAll(async () => {
    await global.sequelize.authenticate();
    await global.sequelize.sync({ force: true });
});

afterEach(async () => {
    await global.sequelize.truncate();
});

afterAll(async () => {
    await global.sequelize.close();
});

jest.mock('./services/database/mysql', () => global.sequelize);

jest.mock('nodemailer', () => {
    const nodemailerMock = {
        createTransport: jest.fn(() => ({
            sendMail: jest.fn().mockResolvedValue(true),
        })),
    };
    return nodemailerMock;
});