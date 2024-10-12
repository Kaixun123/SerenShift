const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManager, ensureHR } = require("../middlewares/authMiddleware");
const employeeController = require("../controllers/employeeController");

// Validation Rules
const employeeValidationRules = () => {
    return [
        check("id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid ID"),
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

router.get("/colleagues", ensureLoggedIn, (req, res) => employeeController.retrieveColleagues(req, res));
router.get("/employee", employeeValidationRules(), vaildateParameters, (req, res) => employeeController.getEmployee(req, res));
router.get("/subordinates", ensureManager, (req, res) => employeeController.retrieveSubordinates(req, res));

module.exports = router;
