const express = require("express");
const { authenticate } = require("../middleware/auth");
const { listNotifications } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authenticate, listNotifications);


module.exports = router;
