import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationPanel from "./NotificationPanel.jsx";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <Link className="brand" to="/">
        Retail Price Bot
      </Link>
      <nav className="nav-links">
        <NavLink to="/">Search</NavLink>
        <NavLink to="/shop-search">Shop Search</NavLink>
        {user && <NavLink to="/profile">Profile</NavLink>}
        {user?.role === "shopkeeper" || user?.role === "admin" ? (
          <NavLink to="/dashboard">Dashboard</NavLink>
        ) : null}
      </nav>
      <div className="auth-actions">
        {user && <NotificationPanel />}
        {user ? (
          <>
            <span className="role-chip">{user.role}</span>
            <button className="ghost-btn" type="button" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register" className="primary-link">
              Register
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
