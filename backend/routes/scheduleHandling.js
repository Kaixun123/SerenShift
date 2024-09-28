const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManager, ensureHR } = require("../middlewares/authMiddleware");
const scheduleController = require("../controllers/scheduleController");
// Validation Rules
const employeeIdValidationRule = () => {
    return [
        check("id").isInt({ allow_leading_zeroes: false, gt: 0 })
    ];
};
// Validation Middleware
const vaildateParameters = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(422).json({
        message: "Invaild Input Received",
        errors: errors.array()
    });
};

router.get("/ownSchedule", ensureLoggedIn, (req, res) => scheduleController.retrieveOwnSchedule(req, res));
router.get("/teamSchedule", ensureLoggedIn, (req, res) => scheduleController.retrieveTeamSchedule(req, res));

module.exports = router;