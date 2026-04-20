const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const {
  getMySubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment

} = require("../controllers/subscriptionController");

const router = express.Router();

router.get("/me", authenticate, requireRole("shopkeeper"), getMySubscription);
router.post("/create-order", authenticate, requireRole("shopkeeper"), createSubscriptionOrder);
router.post("/verify", authenticate, requireRole("shopkeeper"), verifySubscriptionPayment);


module.exports = router;