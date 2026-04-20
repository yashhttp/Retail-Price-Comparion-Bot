const crypto = require("crypto");
const Razorpay = require("razorpay");
const User = require("../models/User");
const {
  getAvailablePaidPlans,
  getEffectiveSubscription,
  getPlanConfig
} = require("../utils/subscription");

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  subscription: getEffectiveSubscription(user)
});

const getRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "";

  const missingEnv = [];
  if (!keyId) {
    missingEnv.push("RAZORPAY_KEY_ID (or RAZORPAY_KEY)");
  }
  if (!keySecret) {
    missingEnv.push("RAZORPAY_KEY_SECRET (or RAZORPAY_SECRET)");
  }

  return {
    keyId,
    keySecret,
    isConfigured: missingEnv.length === 0,
    missingEnv
  };
};

const getRazorpayClient = () => {
  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();

  if (!isConfigured) {
    return null;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getMySubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("name email role subscription");

    if (!user || user.role !== "shopkeeper") {
      return res.status(403).json({ message: "Subscription is available only for shopkeepers" });
    }

    return res.json({
      subscription: getEffectiveSubscription(user),
      plans: getAvailablePaidPlans()
    });
  } catch (error) {
    return next(error);
  }
};



module.exports = {
  getMySubscription,
 
};