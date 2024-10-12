const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove } = require("../middlewares/authMiddleware");
const applicationController = require("../controllers/applicationController");

// Retrieve Application Validation Rules
const retrieveApplicationValidationRules = () => {
    return [
        check("id").isInt({ allow_leading_zeroes: false, gt: 0 }),
        check("status").isString().isIn(['Pending', 'Approved', 'Rejected', 'Withdrawn'])
    ];
};

// Create New Application Validation Rules
const createNewApplicationValidationRules = () => {
    return [
        check("application_type").isString().isIn(['Regular', 'Ad Hoc']),
        check("startDate").isISO8601().toDate(),
        check("endDate").isISO8601().toDate(),
        check("requestor_remarks").isString().isLength({ max: 255 }),
    ];
};

// Approve Pending Application Validation Rules
const approvePendingApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }),
        check("approvedDates").isArray(),
        check("approverRemarks").isString(),
    ];
};

// Reject Pending Application Validation Rules
const rejectPendingApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }),
        check("approverRemarks").isString(),
    ];
};

// Withdraw Pending Application Validation Rules
const withdrawPendingApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }),
    ];
};

// Withdraw Approved Application Validation Rules
const withdrawApprovedApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }),
        check("rejectedDates").isArray(),
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

router.get("/retrieveApplication", retrieveApplicationValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => applicationController.retrieveApplications(req, res));
router.get("/retrievePendingApplication", rejectPendingApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.retrievePendingApplications(req, res));
router.post("/createNewApplication", createNewApplicationValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => applicationController.createNewApplication(req, res))
router.put("/approveApplication", approvePendingApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.approvePendingApplication(req, res));
router.put("/rejectApplication", rejectPendingApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.rejectPendingApplication(req, res));
router.put("/withdrawPending", withdrawPendingApplicationValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => applicationController.withdrawPendingApplication(req, res));
router.put("/withdrawApproved", withdrawApprovedApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.withdrawApprovedApplication(req, res));

module.exports = router;