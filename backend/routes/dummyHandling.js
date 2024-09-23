const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManager, ensureManagerAndAbove, ensureHR } = require("../middlewares/authMiddleware");
const dummyController = require("../controllers/dummyController");
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
        message: "Invaild Input Receieved",
        errors: errors.array()
    });
};

router.get("/anybody", (req, res) => dummyController.anybody(req, res));
router.get("/staff", ensureLoggedIn, (req, res) => dummyController.employee(req, res));
router.get("/manager", ensureManager, (req, res) => dummyController.manager(req, res));
router.get("/managerAndAbove", ensureManagerAndAbove, (req, res) => dummyController.managerAndAbove(req, res));
router.get("/hr", ensureHR, (req, res) => dummyController.hr(req, res));
router.get("/colleagues", ensureLoggedIn, (req, res) => dummyController.retrieveColleagues(req, res));
router.get("/employee", employeeIdValidationRule(), vaildateParameters, (req, res) => dummyController.getEmployee(req, res));

module.exports = router;
