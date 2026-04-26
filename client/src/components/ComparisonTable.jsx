import { useState } from "react";
import mapLogo from "../../images/map.png";

const hasValidCoordinates = (shop) => {
  const coordinates = shop?.location?.coordinates;
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]) &&
    !(coordinates[0] === 0 && coordinates[1] === 0)
  );
};

const ComparisonTable = ({ results, onAddToWatchlist, watchlistIds = [], onGetDirections, userLocation }) => {
  const [expandedProducts, setExpandedProducts] = useState({});

  const formatPrice = (amount, currency = "INR") => {
    if (typeof amount !== "number") {
      return "-";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalResults = results.reduce((total, item) => {
    if (item.shops?.length) {
      return total + Math.min(item.shops.length, 3);
    }
    return total + 1;
  }, 0);

  const toggleProduct = (productId) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <div className="card comparison-card">
      <div className="comparison-header">
        <div className="comparison-title-wrap">
          <svg className="comparison-title-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" x2="8" y1="19" y2="7" />
            <line x1="12" x2="12" y1="19" y2="4" />
            <line x1="16" x2="16" y1="19" y2="11" />
            <path d="M4 19h16" />
          </svg>
          <div className="card-title">Price Comparison</div>
        </div>
        <span className="comparison-result-pill">{totalResults} results</span>
      </div>
      {results.length === 0 ? (
        <p className="muted">Search for a product to compare nearby prices.</p>
      ) : (
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Shop</th>
                <th>Address</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.flatMap((item) => {
                const productId = item.product._id;
                const isWatched = watchlistIds.includes(productId);
                const shops = item.shops?.length
                  ? item.shops.slice(0, 3)
                  : [{ shop: item.shop, price: item.bestPrice, currency: item.currency, distanceKm: null, inStock: true }];
                const isExpanded = Boolean(expandedProducts[productId]);
                const visibleShops = isExpanded ? shops : shops.slice(0, 1);
                const hasMoreShops = shops.length > 1;
                const lowestPrice = Math.min(...shops.map((entry) => Number(entry.price)));

                const rows = visibleShops.map((entry, index) => {
                  const shop = entry.shop;
                  const canGetDirections = Boolean(userLocation && (hasValidCoordinates(shop) || shop?.address));
                  const rowKey = `${productId}-${shop?._id || index}`;
                  const isBest = Number(entry.price) === lowestPrice;
                  const isInStock = entry.inStock !== false;

                  return (
                    <tr key={rowKey}>
                      <td>
                        <div className="comparison-shop-cell">
                          <span className="comparison-shop-name">{shop?.name || "-"}</span>
                          {isBest ? <span className="comparison-best-badge">Best</span> : null}
                        </div>
                        <div className="comparison-product-name">{item.product.name}</div>
                      </td>
                      <td>{shop?.address || "-"}</td>
                      <td className="comparison-price-cell">{formatPrice(entry.price, entry.currency)}</td>
                      <td>
                        <span className={isInStock ? "stock-pill in" : "stock-pill out"}>
                          {isInStock ? "In Stock" : "Out"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions comparison-actions">
                          {index === 0 && onAddToWatchlist ? (
                            <button
                              className={isWatched ? "icon-btn watched" : "icon-btn"}
                              type="button"
                              onClick={() => onAddToWatchlist(productId)}
                              disabled={isWatched}
                              aria-label={isWatched ? "Already in watchlist" : "Add to watchlist"}
                              title={isWatched ? "Watched" : "Watch"}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          ) : null}

                          {canGetDirections ? (
                            <button
                              className="icon-btn"
                              type="button"
                              onClick={() => onGetDirections && onGetDirections(shop, userLocation)}
                              aria-label="Show route"
                              title="Show Route"
                            >
                              <img className="comparison-route-logo" src={mapLogo} alt="Show route" />
                            </button>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });

                if (hasMoreShops) {
                  rows.splice(
                    1,
                    0,
                    <tr key={`${productId}-toggle`} className="comparison-toggle-row">
                      <td colSpan="5">
                        <button
                          className="comparison-show-more-btn"
                          type="button"
                          onClick={() => toggleProduct(productId)}
                        >
                          {isExpanded ? "Show Less" : "Show More"}
                        </button>
                      </td>
                    </tr>
                  );
                }

                return rows;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComparisonTable;
