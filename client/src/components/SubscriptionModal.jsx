const formatPrice = (amountPaise, currency = "INR") => {
  if (!amountPaise) return "\u20b90";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amountPaise / 100);
};

const formatLimit = (value, label) => {
  if (value === null || value === undefined) return `Unlimited ${label}`;
  return `${value} ${label}`;
};

const PLAN_FEATURES = {
  free: ["Basic listings"],
  starter: ["Priority support", "Analytics"],
  professional: ["Unlimited everything", "API access", "White label"]
};

const SubscriptionModal = ({
  open,
  onClose,
  onUpgrade,
  plans = [],
  currentPlan,
  resource,
  loading
}) => {
  if (!open) return null;

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sub-modal-header">
          <div className="sub-modal-title-row">
            <svg className="sub-crown-icon" width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
            </svg>
            <h2 className="sub-modal-title">Upgrade Your Plan</h2>
          </div>
          <button className="sub-close-btn" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Description */}
        <p className="sub-modal-desc">
          You've reached the limit for <strong>{resource || "shops/products"}</strong> on your{" "}
          <span className="sub-plan-chip">{currentPlan || "free"}</span> plan.
          Choose a plan below to unlock more.
        </p>

        {/* Plan list */}
        <div className="sub-plan-list">
          {plans.map((plan) => {
            const isCurrent = plan.code === currentPlan;
            const features = plan.features?.length
              ? plan.features
              : (PLAN_FEATURES[plan.code] || []);
            return (
              <div
                key={plan.code}
                className={`sub-plan-row${isCurrent ? " sub-plan-row--current" : ""}`}
              >
                <div className="sub-plan-info">
                  <div className="sub-plan-name-row">
                    <span className="sub-plan-name">{plan.name}</span>
                    {isCurrent && (
                      <span className="sub-current-badge">Current</span>
                    )}
                  </div>
                  <div className="sub-plan-limits">
                    {formatLimit(plan.limits?.shops, "shops")} · {formatLimit(plan.limits?.products, "products")}
                  </div>
                  {features.length > 0 && (
                    <div className="sub-plan-features">
                      {features.map((feat) => (
                        <span key={feat} className="sub-plan-feat">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="sub-plan-cta">
                  <div className="sub-plan-price">
                    {formatPrice(plan.amountPaise, plan.currency)}
                    <span className="sub-plan-per">/mo</span>
                  </div>
                  {!isCurrent && (
                    <button
                      className="sub-upgrade-btn"
                      type="button"
                      disabled={loading}
                      onClick={() => onUpgrade(plan.code)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                      {loading ? "…" : "Upgrade"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default SubscriptionModal;
