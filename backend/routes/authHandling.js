const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn } = require("../middlewares/authMiddleware");
const authController = require('../controllers/authController')
// Validation Rules
const loginFormValidationRules = () => {
    return [
        check("email").isEmail().withMessage("Invalid email address").notEmpty().trim(),
        check("password").notEmpty().withMessage("Password cannot be empty").trim(),
    ];
}
// Validation Middleware
const vaildateParameters = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = errors.array().map((err) => ({
        field: err.param,  // This will give the parameter name (e.g., email, password)
        message: err.msg,  // This will give the actual error message (e.g., Invalid email)
    }));
    
    return res.status(422).json({
        errors: extractedErrors,
    });
};

router.post('/login', loginFormValidationRules(), vaildateParameters, (req, res) => authController.login(req, res))
router.get('/logout', ensureLoggedIn, (req, res) => authController.logout(req, res))
router.get('/me', ensureLoggedIn, (req, res) => authController.me(req, res))

module.exports = router;