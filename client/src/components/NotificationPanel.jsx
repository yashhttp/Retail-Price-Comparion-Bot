import { useEffect, useState } from "react";
import { notificationApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { createSocketConnection } from "../services/socket.js";

const NotificationPanel = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.list();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 1800000); // Refresh every 30 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = createSocketConnection(token);

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => {
        if (prev.some((item) => item._id === notification._id)) {
          return prev;
        }
        return [notification, ...prev].slice(0, 50);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id ? { ...notif, read: true } : notif))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-container">
      <button
        className="notification-bell"
        onClick={() => setExpanded(!expanded)}
        title={`${unreadCount} new notifications`}
      >
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {expanded && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button className="close-btn" onClick={() => setExpanded(false)}>
              ✕
            </button>
          </div>

          {loading ? (
            <div className="notification-loading">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <p>No notifications yet</p>
              <p className="muted">Price drops on your watchlist will appear here</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${notification.read ? "read" : "unread"}`}
                  onClick={() => !notification.read && handleMarkRead(notification._id)}
                >
                  <div className="notification-content">
                    <div className="notification-title">
                      💰 Price Drop on{" "}
                      <span className="product-name">
                        {notification.product?.name || "Product"}
                      </span>
                    </div>
                    <div className="notification-details">
                      <div className="price-info">
                        <span className="old-price">
                          ₹{notification.previousPrice?.toFixed(2)}
                        </span>
                        <span className="arrow">→</span>
                        <span className="new-price">
                          ₹{notification.newPrice?.toFixed(2)}
                        </span>
                      </div>
                      <div className="shop-info">
                        📍 {notification.shop?.name || "Shop"}
                      </div>
                    </div>
                    <div className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString()}{" "}
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                  {!notification.read && <div className="unread-indicator" />}
                </div>
              ))}
            </div>
          )}

          <div className="notification-footer">
            <button className="refresh-btn" onClick={loadNotifications} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
