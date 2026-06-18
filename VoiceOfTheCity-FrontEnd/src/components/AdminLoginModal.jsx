import { useState } from "react";
import "../Pages/2-SubmitReportPage/SubmitReportPage.css";
import "./AdminLoginModal.css";

function friendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return "Could not sign in. Please try again.";
  }
}

export default function AdminLoginModal({ open, onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onLogin(email, password);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || friendlyAuthError(err.code));
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="admin-login-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="admin-login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
      >
        <button type="button" className="admin-login-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="report-eyebrow">City staff</p>
        <h2 id="admin-login-title" className="admin-login-title">
          Admin sign in
        </h2>
        <p className="admin-login-lead">Sign in with your admin account to access the dashboard.</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="admin-login-field">
            Email
            <input
              type="email"
              className="report-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={submitting}
              required
            />
          </label>
          <label className="admin-login-field">
            Password
            <input
              type="password"
              className="report-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
              required
            />
          </label>

          {error && <p className="report-status-text report-status-text--error">{error}</p>}

          <div className="report-btn-row">
            <button type="submit" className="report-btn report-btn--primary" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            <button
              type="button"
              className="report-btn report-btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
