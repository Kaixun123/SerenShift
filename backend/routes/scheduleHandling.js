const express = require("express");
const router = express.Router();
const multer = require('multer');
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove } = require("../middlewares/authMiddleware");
const scheduleController = require("../controllers/scheduleController");
const upload = multer({ storage: multer.memoryStorage() });


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
router.get("/subordinateSchedule", ensureManagerAndAbove, (req, res) => scheduleController.retrieveSubordinateSchedule(req, res));
router.patch("/updateSchedule", ensureLoggedIn, upload.array('files'), (req, res) => scheduleController.updateOwnSchedule(req, res));

module.exports = router;