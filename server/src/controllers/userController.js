const User = require("../models/User.js");
const Product = require("../models/Product");
const Shop = require("../models/Shop.js");
const { getEffectiveSubscription } = require("../utils/subscription");

const LIVE_USERS_WINDOW_MS = 5 * 60 * 1000;

const getMe = async (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : req.user;
  user.subscription = getEffectiveSubscription(req.user);
  res.json({ user });
};

const getWatchlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("watchlist");
    return res.json({ watchlist: user.watchlist || [] });
  } catch (error) {
    return next(error);
  }
};

const addToWatchlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    console.log(`[Watchlist] User ${req.user._id} adding product ${productId}`);
    
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { watchlist: productId }
    });

    console.log(`[Watchlist] Product ${productId} added successfully`);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const removeFromWatchlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { watchlist: productId }
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const getProfileInsights = async (req, res, next) => {
  try {
    const [freshUser, totalUsers, totalProducts, totalShops, liveUsers] = await Promise.all([
      User.findById(req.user._id).select("watchlist recentSearches totalSearches createdAt"),
      User.countDocuments(),
      Product.countDocuments(),
      Shop.countDocuments(),
      User.countDocuments({
        lastSeenAt: { $gte: new Date(Date.now() - LIVE_USERS_WINDOW_MS) }
      })
    ]);

    const recentActivity = (freshUser?.recentSearches || [])
      .sort((a, b) => new Date(b.searchedAt) - new Date(a.searchedAt))
      .slice(0, 10);

    return res.json({
      recentActivity,
      stats: {
        totalSearches: freshUser?.totalSearches || 0,
        watchlistCount: freshUser?.watchlist?.length || 0,
        memberSince: freshUser?.createdAt,
        liveUsers,
        totalUsers,
        totalProducts,
        totalShops
      }
    });
  } catch (error) {
    return next(error);
  }
};

const deleteRecentActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    if (!activityId) {
      return res.status(400).json({ message: "activityId is required" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { recentSearches: { _id: activityId } }
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMe,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getProfileInsights,
  deleteRecentActivity
};
