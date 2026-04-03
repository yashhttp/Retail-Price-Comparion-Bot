const PLAN_CATALOG = {
  free: {
    code: "free",
    name: "Free",
    amountPaise: 0,
    currency: "INR",
    limits: {
      shops: 1,
      products: 1
    }
  },
  basic: {
    code: "basic",
    name: "Basic",
    amountPaise: 19900,
    currency: "INR",
    limits: {
      shops: 10,
      products: 30
    }
  },
  premium: {
    code: "premium",
    name: "Premium",
    amountPaise: 39900,
    currency: "INR",
    limits: {
      shops: null,
      products: null
    }
  }
};

const DEFAULT_SHOPKEEPER_PLAN = "free";

const getPlanConfig = (planCode) => PLAN_CATALOG[planCode] || PLAN_CATALOG[DEFAULT_SHOPKEEPER_PLAN];

const getEffectiveSubscription = (user) => {
  if (!user || user.role !== "shopkeeper") {
    return null;
  }

  const currentPlan = user.subscription?.plan || DEFAULT_SHOPKEEPER_PLAN;
  const config = getPlanConfig(currentPlan);

  return {
    plan: config.code,
    status: user.subscription?.status || "active",
    razorpayCustomerId: user.subscription?.razorpayCustomerId,
    lastPaymentId: user.subscription?.lastPaymentId,
    startedAt: user.subscription?.startedAt,
    expiresAt: user.subscription?.expiresAt,
    limits: config.limits
  };
};

const getAvailablePaidPlans = () =>
  Object.values(PLAN_CATALOG)
    .filter((plan) => plan.amountPaise > 0)
    .map((plan) => ({
      code: plan.code,
      name: plan.name,
      amountPaise: plan.amountPaise,
      currency: plan.currency,
      limits: plan.limits
    }));

module.exports = {
  PLAN_CATALOG,
  DEFAULT_SHOPKEEPER_PLAN,
  getPlanConfig,
  getEffectiveSubscription,
  getAvailablePaidPlans
};