const express = require("express");
const router = express.Router();
const multer = require('multer');
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove, ensureManager } = require("../middlewares/authMiddleware");
const applicationController = require("../controllers/applicationController");
const upload = multer({ storage: multer.memoryStorage() });


// Create New Application Validation Rules
const createNewApplicationValidationRules = () => {
    return [
        check("application_type").isString().isIn(['Regular', 'Ad Hoc']).withMessage("Invalid Application Type"),
        check("startDate").isISO8601().toDate().withMessage("Invalid Start Date For Application"),
        check("endDate").isISO8601().toDate().withMessage("Invalid End Date for Application"),
        check("requestor_remarks").optional().isString().isLength({ max: 255 }).withMessage("Requestor Remarks Is Too Long For Application"),
        check("recurrence_rule").optional().isString().withMessage("Invalid Recurrence Rule For Application"),
        check("recurrence_end_date").optional().isISO8601().toDate().withMessage("Invalid Recurrence End Date For Application"),
    ];
};

// Approve Pending Application Validation Rules
const approvePendingApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid Application ID"),
        check("approverRemarks").isString().isLength({ max: 255 }).withMessage("Approver Remarks Is Too Long"),
    ];
};

// Reject Pending Application Validation Rules
const rejectPendingApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid Application ID"),
        check("approverRemarks").isString().isLength({ max: 255 }).withMessage("Approver Remarks Is Too Long"),
    ];
};

// Withdraw Pending Application Validation Rules
const withdrawPendingApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid Application ID"),
    ];
};

// Withdraw Approved Application Validation Rules
const withdrawApprovedApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid Application ID"),
        // check("rejectedDates").optional().isArray().withMessage("Rejected Dates Must Be An Array of Dates"),
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

router.get("/retrieveApplications", ensureLoggedIn, (req, res) => applicationController.retrieveApplications(req, res));
router.get("/retrievePendingApplications", ensureManagerAndAbove, (req, res) => applicationController.retrievePendingApplications(req, res));
router.get("/retrieveApprovedApplication", ensureManagerAndAbove, (req, res) => applicationController.retrieveApprovedApplications(req, res));
router.post("/createNewApplication", createNewApplicationValidationRules(), ensureLoggedIn, upload.array('files'), (req, res) => applicationController.createNewApplication(req, res))
router.put("/approveApplication", approvePendingApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.approvePendingApplication(req, res));
router.put("/rejectApplication", rejectPendingApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.rejectPendingApplication(req, res));
router.put("/withdrawPending", withdrawPendingApplicationValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => applicationController.withdrawPendingApplication(req, res));
router.patch("/withdrawApproved", withdrawApprovedApplicationValidationRules(), vaildateParameters, ensureManager, (req, res) => applicationController.withdrawApprovedApplication(req, res));
router.patch("/updatePendingApplication", ensureLoggedIn, upload.array('files'), (req, res) => applicationController.updatePendingApplication(req, res));
router.delete("/withdrawApprovedApplicationByEmployee", ensureLoggedIn, (req, res) => applicationController.withdrawApprovedApplicationByEmployee(req, res));
router.patch("/updateApprovedApplication", ensureLoggedIn, upload.array('files'), (req, res) => applicationController.updateApprovedApplication(req, res));


module.exports = router;