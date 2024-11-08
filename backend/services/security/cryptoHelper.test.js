const cryptoHelper = require('./cryptoHelper');

describe('cryptoHelper', () => {
    test('generateSalt should return a 32 character hex string', () => {
        const salt = cryptoHelper.generateSalt();
        expect(salt).toHaveLength(32);
        expect(salt).toMatch(/^[a-f0-9]{32}$/);
    });

    test('hashPassword should return a 128 character hex string', async () => {
        const password = 'password123';
        const salt = cryptoHelper.generateSalt();
        const hashedPassword = await cryptoHelper.hashPassword(password, salt);
        expect(hashedPassword).toHaveLength(128);
        expect(hashedPassword).toMatch(/^[a-f0-9]{128}$/);
    });

    test('verifyPassword should return true for correct password', async () => {
        const password = 'password123';
        const salt = cryptoHelper.generateSalt();
        const hashedPassword = await cryptoHelper.hashPassword(password, salt);
        const isVerified = await cryptoHelper.verifyPassword(hashedPassword, salt, password);
        expect(isVerified).toBe(true);
    });

    test('verifyPassword should return false for incorrect password', async () => {
        const password = 'password123';
        const wrongPassword = 'wrongpassword';
        const salt = cryptoHelper.generateSalt();
        const hashedPassword = await cryptoHelper.hashPassword(password, salt);
        const isVerified = await cryptoHelper.verifyPassword(hashedPassword, salt, wrongPassword);
        expect(isVerified).toBe(false);
    });

    test('verifyPassword should return false for incorrect salt', async () => {
        const password = 'password123';
        const salt = cryptoHelper.generateSalt();
        const wrongSalt = cryptoHelper.generateSalt();
        const hashedPassword = await cryptoHelper.hashPassword(password, salt);
        const isVerified = await cryptoHelper.verifyPassword(hashedPassword, wrongSalt, password);
        expect(isVerified).toBe(false);
    });

});