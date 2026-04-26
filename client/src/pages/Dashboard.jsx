import { useEffect, useState } from "react";
import { priceApi, productApi, shopApi, subscriptionApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import SubscriptionModal from "../components/SubscriptionModal.jsx";

const loadRazorpayScript = async () => {
  if (window.Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const formatPlanLimit = (value, label) => {
  if (value === null || value === undefined) {
    return `Unlimited ${label}`;
  }

  return `${value} ${label}`;
};

const Dashboard = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [shopForm, setShopForm] = useState({ name: "", address: "", phone: "" });
  const [priceForm, setPriceForm] = useState({
    productId: "",
    shopId: "",
    price: "",
    currency: "INR",
    inStock: true
  });
  const [productForm, setProductForm] = useState({ name: "", brand: "", category: "" });
  const [message, setMessage] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [modalState, setModalState] = useState({
    open: false,
    resource: "",
    currentPlan: "free",
    availablePlans: []
  });

  const loadDashboardData = async () => {
    const [shopResponse, productResponse] = await Promise.all([
      shopApi.myShops(),
      productApi.myProducts()
    ]);
    setShops(shopResponse.data.shops || []);
    setProducts(productResponse.data.products || []);
  };

  const loadSubscription = async () => {
    if (user?.role !== "shopkeeper") {
      return;
    }

    const response = await subscriptionApi.me();
    setSubscription(response.data.subscription || null);
    setPlans(response.data.plans || []);
  };

  const maybeOpenSubscriptionModal = (errorData) => {
    if (user?.role !== "shopkeeper" || errorData?.code !== "SUBSCRIPTION_REQUIRED") {
      return false;
    }

    setModalState({
      open: true,
      resource: errorData.resource,
      currentPlan: errorData.currentPlan || "free",
      availablePlans: errorData.availablePlans || plans
    });
    return true;
  };

  useEffect(() => {
    const load = async () => {
      await loadDashboardData();
      await loadSubscription();
    };

    load().catch(() => {
      setMessage("Failed to load dashboard data.");
    });
  }, [user?.role]);

  const handleCreateShop = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const response = await shopApi.create(shopForm);
      setShops((prev) => [...prev, response.data.shop]);
      setShopForm({ name: "", address: "", phone: "" });
      setMessage("Shop created successfully. Location will be auto-detected from address.");
    } catch (error) {
      const errorData = error.response?.data;
      if (!maybeOpenSubscriptionModal(errorData)) {
        setMessage(errorData?.message || "Failed to create shop.");
      }
    }
  };

  const handleDeleteShop = async (shopId) => {
    if (!confirm("Are you sure you want to delete this shop?")) return;
    try {
      setMessage("");
      await shopApi.delete(shopId);
      setShops((prev) => prev.filter((shop) => shop._id !== shopId));
      setMessage("Shop deleted successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete shop.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      setMessage("");
      await productApi.delete(productId);
      setProducts((prev) => prev.filter((product) => product._id !== productId));
      setMessage("Product deleted successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete product.");
    }
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const response = await productApi.create(productForm);
      setProducts((prev) => [...prev, response.data.product]);
      setProductForm({ name: "", brand: "", category: "" });
      setMessage("Product added.");
    } catch (error) {
      const errorData = error.response?.data;
      if (!maybeOpenSubscriptionModal(errorData)) {
        setMessage(errorData?.message || "Failed to add product.");
      }
    }
  };

  const handleUpgradePlan = async (planCode) => {
    try {
      setUpgradeLoading(true);
      const [scriptLoaded, orderResponse] = await Promise.all([
        loadRazorpayScript(),
        subscriptionApi.createOrder({ planCode })
      ]);

      if (!scriptLoaded || !window.Razorpay) {
        setMessage("Razorpay checkout failed to load. Please try again.");
        setUpgradeLoading(false);
        return;
      }

      const { keyId, order, plan } = orderResponse.data;
      const razorpay = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Retail Price Bot",
        description: `${plan.name} plan upgrade`,
        order_id: order.id,
        prefill: {
          name: user?.name,
          email: user?.email
        },
        notes: {
          planCode: plan.code
        },
        theme: {
          color: "#0b7285"
        },
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await subscriptionApi.verify({
              planCode,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            setSubscription(verifyResponse.data.subscription);
            updateUser(verifyResponse.data.user);
            await refreshUser();
            await loadSubscription();
            setModalState((prev) => ({ ...prev, open: false }));
            setMessage(verifyResponse.data.message || "Subscription upgraded successfully.");
          } catch (error) {
            setMessage(error.response?.data?.message || "Payment verification failed.");
          } finally {
            setUpgradeLoading(false);
          }
        }
      });

      razorpay.on("payment.failed", (event) => {
        const reason = event?.error?.description || "Payment failed. Please try again.";
        setMessage(reason);
        setUpgradeLoading(false);
      });

      setUpgradeLoading(false);
      razorpay.open();
    } catch (error) {
      setUpgradeLoading(false);
      setMessage(error.response?.data?.message || "Could not start payment flow.");
    }
  };

  const handleUpdatePrice = async (event) => {
    event.preventDefault();
    setMessage("");
    await priceApi.upsert({
      ...priceForm,
      price: Number(priceForm.price)
    });
    setMessage("Price updated.");
  };

  const handleFixShopLocation = async (shopId, shopName) => {
    try {
      setMessage("");
      const response = await shopApi.updateLocation(shopId);
      setShops((prev) =>
        prev.map((shop) =>
          shop._id === shopId ? response.data.shop : shop
        )
      );
      setMessage(`Location updated for ${shopName} ✓`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update location. Ensure Google Maps API is configured.");
    }
  };

  const planName = (subscription?.plan || "free").replace(/^\w/, (c) => c.toUpperCase());
  const shopLimit = subscription?.limits?.shops ?? "∞";
  const productLimit = subscription?.limits?.products ?? "∞";

  return (
    <section className="page">
      <div className="sk-dashboard-header">
        <div className="sk-dashboard-title-row">
          <div className="sk-dashboard-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1"/>
              <rect width="7" height="7" x="14" y="3" rx="1"/>
              <rect width="7" height="7" x="14" y="14" rx="1"/>
              <rect width="7" height="7" x="3" y="14" rx="1"/>
            </svg>
          </div>
          <div>
            <h1 className="sk-dashboard-title">Shopkeeper Dashboard</h1>
            <p className="sk-dashboard-subtitle">Manage shops, products, and price listings in one place.</p>
          </div>
        </div>

        <div className="sk-stats-grid">
          <div className="sk-stat-card">
            <div>
              <div className="sk-stat-label">SHOPS</div>
              <div className="sk-stat-value">{shops.length}</div>
              <div className="sk-stat-sub">of {shopLimit}</div>
            </div>
            <div className="sk-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <path d="M15 22v-4a3 3 0 0 0-6 0v4"/>
                <path d="M2 7h20"/>
              </svg>
            </div>
          </div>

          <div className="sk-stat-card">
            <div>
              <div className="sk-stat-label">PRODUCTS</div>
              <div className="sk-stat-value">{products.length}</div>
              <div className="sk-stat-sub">of {productLimit}</div>
            </div>
            <div className="sk-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.29 7 12 12 20.71 7"/>
                <line x1="12" x2="12" y1="22" y2="12"/>
              </svg>
            </div>
          </div>

          <div className="sk-stat-card">
            <div>
              <div className="sk-stat-label">PLAN</div>
              <div className="sk-stat-value">{planName}</div>
            </div>
            <div className="sk-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
              </svg>
            </div>
          </div>

          <div className="sk-stat-card">
            <div>
              <div className="sk-stat-label">PRICES LISTED</div>
              <div className="sk-stat-value">—</div>
              <div className="sk-stat-sub">Update below</div>
            </div>
            <div className="sk-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
            </div>
          </div>
        </div>

        {user?.role === "shopkeeper" && (
          <div className="sk-plan-banner">
            <div className="sk-plan-banner-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
              </svg>
              <div>
                <div className="sk-plan-banner-name">{planName} Plan</div>
                <div className="sk-plan-banner-sub">{shops.length} shops · {products.length} products</div>
              </div>
            </div>
            <button
              className="sk-upgrade-btn"
              type="button"
              onClick={() =>
                setModalState({
                  open: true,
                  resource: "shops/products",
                  currentPlan: subscription?.plan || "free",
                  availablePlans: plans
                })
              }
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Upgrade Plan
            </button>
          </div>
        )}
      </div>

      {message ? <p className="notice">{message}</p> : null}
      <div className="grid">
        <div className="card">
          <div className="card-title">Create Shop</div>
          <form className="form" onSubmit={handleCreateShop}>
            <label>
              Shop name
              <input
                type="text"
                value={shopForm.name}
                onChange={(event) => setShopForm({ ...shopForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              Address
              <input
                type="text"
                value={shopForm.address}
                onChange={(event) => setShopForm({ ...shopForm, address: event.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                type="text"
                value={shopForm.phone}
                onChange={(event) => setShopForm({ ...shopForm, phone: event.target.value })}
              />
            </label>
            <button className="primary-btn" type="submit">
              Save shop
            </button>
          </form>
        </div>
        <div className="card">
          <div className="card-title">Add Product</div>
          <form className="form" onSubmit={handleCreateProduct}>
            <label>
              Name
              <input
                type="text"
                value={productForm.name}
                onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              Brand
              <input
                type="text"
                value={productForm.brand}
                onChange={(event) => setProductForm({ ...productForm, brand: event.target.value })}
              />
            </label>
            <label>
              Category
              <input
                type="text"
                value={productForm.category}
                onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}
              />
            </label>
            <button className="primary-btn" type="submit">
              Add product
            </button>
          </form>
        </div>
      </div>
      <div className="grid">
        <div className="card">
          <div className="card-title">Update Price</div>
          <form className="form" onSubmit={handleUpdatePrice}>
            <label>
              Shop
              <select
                value={priceForm.shopId}
                onChange={(event) => setPriceForm({ ...priceForm, shopId: event.target.value })}
                required
              >
                <option value="">Select shop</option>
                {shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Product
              <select
                value={priceForm.productId}
                onChange={(event) => setPriceForm({ ...priceForm, productId: event.target.value })}
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceForm.price}
                onChange={(event) => setPriceForm({ ...priceForm, price: event.target.value })}
                required
              />
            </label>
            <label>
              Currency
              <input
                type="text"
                value={priceForm.currency}
                onChange={(event) => setPriceForm({ ...priceForm, currency: event.target.value })}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={priceForm.inStock}
                onChange={(event) => setPriceForm({ ...priceForm, inStock: event.target.checked })}
              />
              In stock
            </label>
            <button className="primary-btn" type="submit">
              Update price
            </button>
          </form>
        </div>
      </div>
      <div className="card">
        <div className="card-title">My Shops</div>
        {shops.length === 0 ? (
          <p>No shops yet. Create your first shop above.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => {
                  const hasValidCoords = shop.location?.coordinates && 
                    (shop.location.coordinates[0] !== 0 || shop.location.coordinates[1] !== 0);
                  return (
                    <tr key={shop._id}>
                      <td>{shop.name}</td>
                      <td>{shop.address || "—"}</td>
                      <td>{shop.phone || "—"}</td>
                      <td>
                        {hasValidCoords ? (
                          <span style={{ color: "var(--teal)", fontWeight: "500" }}>✓ Set</span>
                        ) : (
                          <button
                            className="ghost-btn"
                            style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                            onClick={() => handleFixShopLocation(shop._id, shop.name)}
                          >
                            📍 Fix
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          className="danger-btn"
                          onClick={() => handleDeleteShop(shop._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-title">My Products</div>
        {products.length === 0 ? (
          <p>No products yet. Add your first product above.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>{product.brand || "—"}</td>
                    <td>{product.category || "—"}</td>
                    <td>
                      <button
                        className="danger-btn"
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <SubscriptionModal
        open={modalState.open && user?.role === "shopkeeper"}
        resource={modalState.resource}
        currentPlan={modalState.currentPlan}
        plans={modalState.availablePlans.length ? modalState.availablePlans : plans}
        loading={upgradeLoading}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
        onUpgrade={handleUpgradePlan}
      />
    </section>
  );
};

export default Dashboard;
