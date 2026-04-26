import { useState } from "react";
import mapLogo from "../../images/map.png";

const SearchBar = ({ onSearch, onUseLocation, locationStatus }) => {
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch({ query, address });
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-row">
        <input
          type="text"
          placeholder="Search products or brands"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          required
        />
        <button className="primary-btn" type="submit">
          Compare
        </button>
      </div>
      <div className="search-row secondary">
        <input
          type="text"
          placeholder="Enter a neighborhood or address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <button className="ghost-btn location-btn" type="button" onClick={onUseLocation}>
          <img className="location-logo" src={mapLogo} alt="Location" />
          Use my location
        </button>
      </div>
      {locationStatus && (
        <div className="location-status">
          {locationStatus.includes("acquired") ? "✅" : locationStatus.includes("Getting") ? "🔄" : "⚠️"} {locationStatus}
        </div>
      )}
    </form>
  );
};

export default SearchBar;
