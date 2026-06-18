import { NavLink, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import "./Layout.css";

export default function Layout({ children }) {
  const { requestAdminAccess, isAdmin } = useAuth();
  const location = useLocation();
  const adminActive = location.pathname === "/admin" && isAdmin;

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="app-brand">
          <span className="app-brand-mark" aria-hidden="true">
            V
          </span>
          <span className="app-brand-text">Voice of the City</span>
        </NavLink>

        <nav className="app-nav" aria-label="Main">
          <NavLink
            to="/viewreports"
            className={({ isActive }) => `app-nav-link${isActive ? " app-nav-link--active" : ""}`}
          >
            Community Reports
          </NavLink>
          <button
            type="button"
            className={`app-nav-link app-nav-link--admin${adminActive ? " app-nav-link--active" : ""}`}
            onClick={requestAdminAccess}
          >
            Admin
          </button>
        </nav>

        <div className="app-header-actions">
          <NavLink to="/submit" className="app-nav-cta">
            Report an issue
          </NavLink>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
