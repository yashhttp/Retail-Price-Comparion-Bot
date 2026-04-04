const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getMe,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getProfileInsights,
  deleteRecentActivity
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", authenticate, getMe);
router.get("/profile-insights", authenticate, getProfileInsights);
router.delete("/recent-activity/:activityId", authenticate, deleteRecentActivity);
router.get("/watchlist", authenticate, getWatchlist);
router.post("/watchlist", authenticate, addToWatchlist);
router.delete("/watchlist/:productId", authenticate, removeFromWatchlist);

module.exports = router;
