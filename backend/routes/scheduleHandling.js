const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove, ensureHR } = require("../middlewares/authMiddleware");
const scheduleController = require("../controllers/scheduleController");

const retrieveTeamScheduleValidationRules = () => {
    return [
        check("colleague_id").optional().isString().withMessage("Invalid Colleague ID"),
        check("start_date").optional().isISO8601().toDate().withMessage("Invalid Start Date"),
        check("end_date").optional().isISO8601().toDate().withMessage("Invalid End Date"),
    ];
};

const retrieveSubordinateScheduleValidationRules = () => {
    return [
        check("colleague_id").optional().isString().withMessage("Invalid Colleague ID"),
        check("start_date").optional().isISO8601().toDate().withMessage("Invalid Start Date"),
        check("end_date").optional().isISO8601().toDate().withMessage("Invalid End Date"),
    ];
};

const retrieveCompanyScheduleValidationRules = () => {
    return [
        check("date").optional().isISO8601().toDate().withMessage("Invalid Date")
    ];
}

const retrieveDepartmentScheduleValidationRules = () => {
    return [
        check("department").optional().isString().withMessage("Invalid Department Input"),
        check("date").optional().isISO8601().toDate().withMessage("Invalid Date")
    ];
}

// Validation Middleware
const vaildateParameters = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(422).json({
        message: "Invalid Input Received",
        errors: errors.array()
    });
};

router.get("/ownSchedule", ensureLoggedIn, (req, res) => scheduleController.retrieveOwnSchedule(req, res));
router.get("/teamSchedule", retrieveTeamScheduleValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => scheduleController.retrieveTeamSchedule(req, res));
router.get("/subordinateSchedule", retrieveSubordinateScheduleValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => scheduleController.retrieveSubordinateSchedule(req, res));
router.get("/companySchedule", retrieveCompanyScheduleValidationRules(), vaildateParameters, ensureHR, (req, res) => scheduleController.retrieveCompanySchedule(req, res));
router.get("/departmentSchedule", retrieveDepartmentScheduleValidationRules(), vaildateParameters, ensureHR, (req, res) => scheduleController.retrieveDepartmentSchedule(req, res));

module.exports = router;