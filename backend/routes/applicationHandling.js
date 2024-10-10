const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove } = require("../middlewares/authMiddleware");
const applicationController = require("../controllers/applicationController");

// Retrieve Applications Validation Rules
const applicationStatusValidationRules = () => {
    return [
        check("status").isString().isIn(['Pending', 'Approved', 'Rejected', 'Withdrawn'])
    ];
};

// Application ID Validation Rules
const applicationIDValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }),
    ]
};

const approveApplicationsValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }),
        check("approvedDates").isArray().notEmpty(),
        check("approverRemarks").isString(),
    ]
}


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
router.get("/retrievePendingApplication", ensureManagerAndAbove, (req, res) => applicationController.retrievePendingApplication(req, res));
router.post("/createNewApplication", ensureLoggedIn, (req, res) => applicationController.createNewApplication(req, res))
router.put("/approveApplications", approveApplicationsValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.approveApplications(req, res));
router.put("/approveApplication", ensureManagerAndAbove, (req, res) => applicationController.approveApplication(req, res));
router.put("/rejectApplication", ensureManagerAndAbove, (req, res) => applicationController.rejectApplication(req, res));
router.put("/withdrawPending", ensureLoggedIn, (req, res) => applicationController.withdrawPendingApplications(req, res));

module.exports = router;