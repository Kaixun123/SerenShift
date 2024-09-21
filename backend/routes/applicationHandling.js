const express = require("express");
const router = express.Router();
const { ensureLoggedIn } = require("../middlewares/authMiddleware");
const applicationController = require("../controllers/applicationController");

router.get("/retrieveApplication", ensureLoggedIn, (req, res) => applicationController.retrieveApplication(req, res));
router.post("/createNewApplication", ensureLoggedIn, (req, res) => applicationController.createNewApplication(req, res))

module.exports = router;