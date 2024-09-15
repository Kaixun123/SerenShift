const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn } = require("../middlewares/authMiddleware");
const authController = require('../controllers/authController')
// Validation Rules
const loginFormValidationRules = () => {
    return [
        check("emailAddress").isEmail().notEmpty().trim(),
        check("password").notEmpty().trim(),
    ];
}
// Validation Middleware
const vaildateParameters = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
    return res.status(422).json({
        errors: extractedErrors,
    });
};

router.post('/login', loginFormValidationRules(), vaildateParameters, (req, res) => authController.login(req, res))
router.get('/logout', ensureLoggedIn, (req, res) => authController.logout(req, res))
router.get('/me', ensureLoggedIn, (req, res) => authController.me(req, res))

module.exports = router;