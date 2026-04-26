import { useState } from "react";
import { shopApi } from "../api/client.js";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

const ShopSearch = () => {
  const [shopName, setShopName] = useState("");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = shopName.trim();
    if (!trimmed) {
      setError("Please enter a shop name.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await shopApi.search({ name: trimmed });
      setShops(response.data.shops || []);
    } catch (apiError) {
      setShops([]);
      setError(apiError.response?.data?.message || "Failed to search shops.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <div className="hero compact">
        <div>
          <h1>Shop Product Search</h1>
          <p>Find any shop by name and view all listed products with current prices.</p>
        </div>
      </div>

      <div className="card">
        <form className="search-bar" onSubmit={handleSubmit}>
          <div className="search-row">
            <input
              type="text"
              placeholder="Enter shop name"
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              required
            />
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search Shop"}
            </button>
          </div>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </div>

      {searched && !loading && shops.length === 0 ? (
        <div className="card">
          <p className="muted">No matching shop found.</p>
        </div>
      ) : null}

      {shops.map((shop) => (
        <div key={shop.id} className="card">
          <div className="shop-search-header">
            <div>
              <div className="card-title">{shop.name}</div>
              <p className="muted">{shop.address || "Address not available"}</p>
              <p className="muted">{shop.phone ? `Phone: ${shop.phone}` : "Phone not available"}</p>
            </div>
          </div>

          {shop.products.length === 0 ? (
            <p className="muted">No products listed for this shop yet.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Current Price</th>
                    <th>Stock</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {shop.products.map((item) => (
                    <tr key={item.listingId}>
                      <td>{item.productName}</td>
                      <td>{item.brand || "-"}</td>
                      <td>{item.category || "-"}</td>
                      <td>
                        {item.price} {item.currency}
                      </td>
                      <td>{item.inStock ? "In stock" : "Out of stock"}</td>
                      <td>{formatDateTime(item.lastUpdated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </section>
  );
};

export default ShopSearch;
