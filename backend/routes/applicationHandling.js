const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManager, ensureHR } = require("../middlewares/authMiddleware");
const applicationController = require("../controllers/applicationController");

router.get("/retrieveApplication", ensureLoggedIn, (req, res) => applicationController.retrieveApplication(req, res));
router.post("/createPendingApplication", ensureLoggedIn, (req, res) => applicationController.createPendingApplication(req, res))

module.exports = router;