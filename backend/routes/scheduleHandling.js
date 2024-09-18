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
    const extractedErrors = [];
    errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
    return res.status(422).json({
        errors: extractedErrors,
    });
};

router.get("/ownSchedule", ensureLoggedIn, (req, res) => scheduleController.retrieveOwnSchedule(req, res));
router.get("/useColleagueIds", ensureLoggedIn, (req, res) => scheduleController.retrieveColleagueIds(req, res));
// router.get("/manager", ensureManager, (req, res) => employeeController.manager(req, res));
// router.get("/hr", ensureHR, (req, res) => employeeController.hr(req, res));
// router.get("/colleagues", ensureLoggedIn, (req, res) => employeeController.retrieveColleagues(req, res));
// router.get("/employee", employeeIdValidationRule(), vaildateParameters, (req, res) => employeeController.getEmployee(req, res));

module.exports = router;