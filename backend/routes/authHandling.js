const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn } = require("../middlewares/authMiddleware");
const authController = require('../controllers/authController')
// Validation Rules
const loginFormValidationRules = () => {
    return [
        check("emailAddress").isEmail().withMessage("Invalid email address").notEmpty().trim(),
        check("password").notEmpty().withMessage("Password cannot be empty").trim(),
    ];
}
// Validation Middleware
const vaildateParameters = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(422).json({
        message: "Invaild Input Receieved",
        errors: errors.array()
    });
};

router.post('/login', loginFormValidationRules(), vaildateParameters, (req, res) => authController.login(req, res))
router.get('/logout', ensureLoggedIn, (req, res) => authController.logout(req, res))
router.get('/me', ensureLoggedIn, (req, res) => authController.me(req, res))

module.exports = router;