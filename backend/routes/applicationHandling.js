const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManager, ensureManagerAndAbove, ensureHR } = require("../middlewares/authMiddleware");
const applicationController = require("../controllers/applicationController");

// Retrieve Applications Validation Rules
const applicationStatusValidationRules = () => {
    return [
        check("status").isString().isIn(['Pending', 'Approved', 'Rejected', 'Withdrawn'])
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

router.get("/retrieveApplication", applicationStatusValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => applicationController.retrieveApplication(req, res));
router.post("/createNewApplication", ensureLoggedIn, (req, res) => applicationController.createNewApplication(req, res))

module.exports = router;