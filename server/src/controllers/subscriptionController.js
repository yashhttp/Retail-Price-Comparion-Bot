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

const createSubscriptionOrder = async (req, res, next) => {
  try {
    const { planCode } = req.body;
    const plan = getPlanConfig(planCode);

    if (!plan || plan.amountPaise <= 0 || !["basic", "premium"].includes(plan.code)) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      const { missingEnv } = getRazorpayCredentials();
      return res.status(500).json({
        message: "Razorpay is not configured on the server",
        missingEnv
      });
    }

    const receipt = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const order = await razorpay.orders.create({
      amount: plan.amountPaise,
      currency: plan.currency,
      receipt: receipt.slice(0, 40),
      notes: {
        userId: req.user._id.toString(),
        planCode: plan.code
      }
    });

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        "subscription.lastOrderId": order.id
      }
    });

    const { keyId } = getRazorpayCredentials();

    return res.json({
      keyId,
      order,
      plan: {
        code: plan.code,
        name: plan.name,
        amountPaise: plan.amountPaise,
        currency: plan.currency,
        limits: plan.limits
      }
    });
  } catch (error) {
    return next(error);
  }
};

const verifySubscriptionPayment = async (req, res, next) => {
  try {
    const { planCode, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const plan = getPlanConfig(planCode);

    if (!plan || plan.amountPaise <= 0 || !["basic", "premium"].includes(plan.code)) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay payment details" });
    }

    const { keySecret, isConfigured, missingEnv } = getRazorpayCredentials();
    if (!isConfigured) {
      return res.status(500).json({
        message: "Razorpay is not configured on the server",
        missingEnv
      });
    }

    const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(signatureBody)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "subscription.plan": plan.code,
          "subscription.status": "active",
          "subscription.lastOrderId": razorpay_order_id,
          "subscription.lastPaymentId": razorpay_payment_id,
          "subscription.startedAt": new Date(),
          "subscription.expiresAt": null
        }
      },
      { new: true }
    );

    return res.json({
      message: `${plan.name} plan activated successfully`,
      subscription: getEffectiveSubscription(user),
      user: buildUserPayload(user)
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMySubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment
 
};