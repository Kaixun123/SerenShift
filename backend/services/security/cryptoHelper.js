const crypto = require('crypto');

function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString('hex'));
        });
    });
}

async function verifyPassword(storedPassword, storedSalt, providedPassword) {
    let hashedPassword = await hashPassword(providedPassword, storedSalt);
    return storedPassword === hashedPassword;
}

module.exports = {
    generateSalt,
    hashPassword,
    verifyPassword
};