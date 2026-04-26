import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { userApi, priceApi } from "../api/client.js";

const Profile = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [priceData, setPriceData] = useState({});
  const [insights, setInsights] = useState({ recentActivity: [], stats: null });
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const response = await userApi.watchlist();
        const products = response.data.watchlist || [];
        setWatchlist(products);

        // Fetch current best price for each product
        const pricePromises = products.map(async (product) => {
          try {
            const priceResponse = await priceApi.list({ productId: product._id });
            const listings = priceResponse.data.listings || [];
            if (listings.length > 0) {
              const sorted = [...listings].sort((a, b) => a.price - b.price);
              return { productId: product._id, bestPrice: sorted[0] };
            }
            return { productId: product._id, bestPrice: null };
          } catch {
            return { productId: product._id, bestPrice: null };
          }
        });

        const priceResults = await Promise.all(pricePromises);
        const priceMap = {};
        priceResults.forEach((result) => {
          priceMap[result.productId] = result.bestPrice;
        });
        setPriceData(priceMap);
      } catch (error) {
        console.error("Failed to load watchlist:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const response = await userApi.profileInsights();
        setInsights({
          recentActivity: response.data.recentActivity || [],
          stats: response.data.stats || null
        });
      } catch (error) {
        console.error("Failed to load profile insights:", error);
      } finally {
        setInsightsLoading(false);
      }
    };

    loadInsights();
  }, []);

  const formatSearchTime = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const formatPrice = (price, currency = "INR") => {
    if (typeof price !== "number") {
      return "-";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const memberSince = insights.stats?.memberSince
    ? new Date(insights.stats.memberSince).toLocaleDateString([], {
      month: "long",
      year: "numeric"
    })
    : "-";

  const statTiles = [
    {
      label: "Total Searches",
      value: insights.stats?.totalSearches ?? 0
    },
    {
      label: "Live Users",
      value: insights.stats?.liveUsers ?? 0
    },
    {
      label: "Platform Users",
      value: insights.stats?.totalUsers ?? 0
    },
    {
      label: "Products Tracked",
      value: insights.stats?.totalProducts ?? 0
    },
    {
      label: "Shops Onboarded",
      value: insights.stats?.totalShops ?? 0
    },
    {
      label: "Watchlist Items",
      value: insights.stats?.watchlistCount ?? watchlist.length
    }
  ];

  const handleRemove = async (productId) => {
    try {
      await userApi.removeWatch(productId);
      setWatchlist((prev) => prev.filter((p) => p._id !== productId));
      setPriceData((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!activityId) {
      return;
    }

    try {
      await userApi.deleteRecentActivity(activityId);
      setInsights((prev) => ({
        ...prev,
        recentActivity: prev.recentActivity.filter((item) => item._id !== activityId)
      }));
    } catch (error) {
      console.error("Failed to delete activity:", error);
    }
  };

  return (
    <section className="page profile-page">
      <div className="profile-hero-card">
        <div className="profile-hero-strip" />
        <div className="profile-hero-content">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-user-meta">
            <h1>{user?.name || "User"}</h1>
            <div className="profile-email-row">
              <span>{user?.email}</span>
              <span className="role-chip">{user?.role || "consumer"}</span>
            </div>
            <p className="muted">Member since {memberSince}</p>
          </div>
        </div>
      </div>

      <div className="profile-stats-strip">
        {statTiles.map((tile) => (
          <div key={tile.label} className="profile-stat-tile">
            <div>
              <div className="profile-stat-label">{tile.label}</div>
              <div className="profile-stat-value">{insightsLoading ? "--" : tile.value}</div>
            </div>
            <div className="profile-stat-icon" aria-hidden="true">
              {tile.label === "Total Searches" ? "⌕" : tile.label === "Live Users" ? "◌" : tile.label === "Platform Users" ? "◉" : tile.label === "Products Tracked" ? "◈" : tile.label === "Shops Onboarded" ? "▣" : "♡"}
            </div>
          </div>
        ))}
      </div>

      <div className="profile-main-grid">
        <div className="card profile-watchlist-card">
          <div className="profile-card-head">
            <h2>Watchlist</h2>
            <span className="profile-count-pill">{watchlist.length}</span>
          </div>

          {loading ? (
            <p className="muted">Loading watchlist...</p>
          ) : watchlist.length === 0 ? (
            <p className="muted">Your watchlist is empty. Add products from home to track prices.</p>
          ) : (
            <div className="watchlist-table-wrap">
              <table className="watchlist-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Best Price</th>
                    <th>Shop</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((product) => {
                    const priceInfo = priceData[product._id];
                    return (
                      <tr key={product._id}>
                        <td>
                          <div className="product-name">{product.name}</div>
                          <div className="product-meta">
                            {product.brand || "-"}
                            {product.category ? ` · ${product.category}` : ""}
                          </div>
                        </td>
                        <td className="watchlist-best-price">
                          {priceInfo ? formatPrice(priceInfo.price, priceInfo.currency) : "-"}
                        </td>
                        <td className="muted">{priceInfo?.shop?.name || "No shop"}</td>
                        <td>
                          <button
                            className="watchlist-trash-btn"
                            type="button"
                            onClick={() => handleRemove(product._id)}
                            aria-label="Remove from watchlist"
                            title="Remove"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
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

        <div className="card profile-activity-card">
          <div className="profile-card-head">
            <h2>Recent Activity</h2>
          </div>

          {insightsLoading ? (
            <p className="muted">Loading recent searches...</p>
          ) : insights.recentActivity.length === 0 ? (
            <p className="muted">No searches yet. Your recent searches will appear here.</p>
          ) : (
            <div className="profile-activity-list">
              {insights.recentActivity.map((item, index) => (
                <div key={item._id || `${item.query}-${item.searchedAt || index}`} className="profile-activity-item">
                  <div className="profile-activity-icon">⌕</div>
                  <div className="activity-main">
                    <div className="activity-query">{item.query}</div>
                    <div className="activity-meta muted">
                      {item.address ? `Near ${item.address} · ` : ""}
                      {formatSearchTime(item.searchedAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="profile-activity-delete-btn"
                    onClick={() => handleDeleteActivity(item._id)}
                    aria-label="Delete activity"
                    title="Delete"
                    disabled={!item._id}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Profile;
