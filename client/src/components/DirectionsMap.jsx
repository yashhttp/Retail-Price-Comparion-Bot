import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import geolocationService from "../services/geolocation.js";

const DirectionsMap = ({ userLocation, shopLocation, shopName, shopAddress, onClose }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [distance, setDistance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mapContainer.current || !userLocation || !shopLocation) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const coords = shopLocation?.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) {
      setError("Shop location is not available.");
      setIsLoading(false);
      return;
    }

    const [shopLng, shopLat] = coords;
    if (!Number.isFinite(shopLng) || !Number.isFinite(shopLat) || (shopLng === 0 && shopLat === 0)) {
      setError("Shop has invalid coordinates. Open Google Maps using address.");
      setIsLoading(false);
      return;
    }

    try {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapContainer.current, {
        preferCanvas: true
      }).setView([userLocation.lat, userLocation.lng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
      }).addTo(map);

      const shopCoords = {
        lat: shopLat,
        lng: shopLng
      };

      const dist = geolocationService.calculateDistance(userLocation, shopCoords);
      setDistance(dist);

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        title: "Your Location"
      }).addTo(map);
      userMarker.bindPopup("<b>Your Location</b>");

      const shopMarker = L.marker([shopCoords.lat, shopCoords.lng], {
        title: shopName
      }).addTo(map);
      shopMarker.bindPopup(`<b>${shopName}</b>`);

      L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [shopCoords.lat, shopCoords.lng]
        ],
        {
          color: "#4CAF50",
          weight: 3,
          opacity: 0.7,
          dashArray: "5, 5"
        }
      ).addTo(map);

      const group = L.featureGroup([userMarker, shopMarker]);
      map.fitBounds(group.getBounds().pad(0.1));

      mapInstance.current = map;
      setIsLoading(false);
    } catch (err) {
      console.error("Map initialization error:", err);
      setError(err.message || "Failed to load map. Please try again.");
      setIsLoading(false);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [userLocation, shopLocation, shopName]);

  const origin = `${userLocation?.lat},${userLocation?.lng}`;
  const destination =
    Array.isArray(shopLocation?.coordinates) &&
    shopLocation.coordinates.length === 2 &&
    Number.isFinite(shopLocation.coordinates[0]) &&
    Number.isFinite(shopLocation.coordinates[1]) &&
    !(shopLocation.coordinates[0] === 0 && shopLocation.coordinates[1] === 0)
      ? `${shopLocation.coordinates[1]},${shopLocation.coordinates[0]}`
      : encodeURIComponent(shopAddress || shopName || "");

  return (
    <div className="directions-modal-overlay" onClick={onClose}>
      <div className="directions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="directions-header">
          <h2>Directions to {shopName}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="directions-info">
          {distance && (
            <div className="distance-badge">
              <span className="distance-icon">📍</span>
              <span className="distance-text"><strong>{distance} km</strong> away</span>
            </div>
          )}
        </div>

        <div ref={mapContainer} className="directions-map-container"></div>

        {isLoading ? (
          <div className="map-loading">Loading map...</div>
        ) : error ? (
          <div className="map-error">
            <p>⚠️ {error}</p>
            <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Try refreshing and enabling location again.</p>
          </div>
        ) : null}

        <div className="directions-footer">
          <p className="directions-hint">
            🚶 Blue marker = Your Location | 🏪 Red marker = Shop Location
          </p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-btn"
          >
            📲 Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};

export default DirectionsMap;
