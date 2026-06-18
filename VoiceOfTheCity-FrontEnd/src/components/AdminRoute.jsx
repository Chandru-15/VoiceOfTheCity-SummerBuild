import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Layout from './Layout.jsx';
import AdminDashboard from '../Pages/3-AdminDashboard/AdminDashboard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute() {
  const { user, loading, isAdmin, openAdminLogin, closeAdminLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      openAdminLogin({ navigateOnSuccess: true });
    }
  }, [loading, user, isAdmin, openAdminLogin]);

  useEffect(() => {
    return () => closeAdminLogin();
  }, [closeAdminLogin]);

  if (loading) {
    return (
      <Layout>
        <p className="report-status-text report-status-text--loading" style={{ padding: 40, textAlign: 'center' }}>
          Checking access…
        </p>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="admin-access-denied">
          <h1 className="report-heading">Admin access required</h1>
          <p className="home-lead">Sign in with an admin account to continue.</p>
          <button type="button" className="report-btn report-btn--ghost" onClick={() => navigate('/')}>
            Back to home
          </button>
        </div>
      </Layout>
    );
  }

  return <AdminDashboard />;
}
