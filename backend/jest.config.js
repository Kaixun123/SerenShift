module.exports = {
    testEnvironment: 'node',
    moduleFileExtensions: ['js'],
    testMatch: ['**/*.test.js'],
    setupFilesAfterEnv: ['./jest.setup.js'],
    collectCoverage: true,
    coverageDirectory: './coverage',
};
