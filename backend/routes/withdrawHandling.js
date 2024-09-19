const express = require("express");
const router = express.Router();
const { ensureLoggedIn} = require("../middlewares/authMiddleware");
const withdrawController = require("../controllers/withdrawController");


router.get("/withdraw", ensureLoggedIn, (req, res) => withdrawController.withdrawPendingApplications(req, res));


module.exports = router;