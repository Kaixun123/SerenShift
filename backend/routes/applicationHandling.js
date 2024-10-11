const express = require("express");
const router = express.Router();
const multer = require('multer');
const { ensureLoggedIn } = require("../middlewares/authMiddleware");
const applicationController = require("../controllers/applicationController");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/retrieveApplication", ensureLoggedIn, (req, res) => applicationController.retrieveApplication(req, res));
router.post("/createNewApplication", ensureLoggedIn, upload.array('files'), (req, res) => applicationController.createNewApplication(req, res));

module.exports = router;