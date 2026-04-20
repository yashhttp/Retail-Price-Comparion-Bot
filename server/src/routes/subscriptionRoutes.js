const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const {
  getMySubscription,

} = require("../controllers/subscriptionController");

const router = express.Router();

router.get("/me", authenticate, requireRole("shopkeeper"), getMySubscription);


module.exports = router;