const express = require("express");
const { authenticate } = require("../middleware/auth");
const { listNotifications, markRead } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authenticate, listNotifications);
router.patch("/:id/read", authenticate, markRead);

module.exports = router;
