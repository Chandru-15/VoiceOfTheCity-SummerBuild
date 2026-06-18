import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../../helpers/firebase.js';
import * as Config from '../../../Configuration/Configuration.js';
import AdminLoginModal from '../components/AdminLoginModal.jsx';

const ADMIN_EMAILS = Config.ADMIN_EMAILS ?? [];

const AuthContext = createContext(null);

function isAdminUser(user) {
  if (!user?.email) return false;
  if (!ADMIN_EMAILS.length) return true;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(user.email.toLowerCase());
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [navigateToAdminOnLogin, setNavigateToAdminOnLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const openAdminLogin = useCallback((options = {}) => {
    setNavigateToAdminOnLogin(Boolean(options.navigateOnSuccess));
    setLoginOpen(true);
  }, []);

  const closeAdminLogin = useCallback(() => {
    setLoginOpen(false);
    setNavigateToAdminOnLogin(false);
  }, []);

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (!isAdminUser(credential.user)) {
      await firebaseSignOut(auth);
      throw new Error('This account does not have admin access.');
    }
    setLoginOpen(false);
    if (navigateToAdminOnLogin) {
      setNavigateToAdminOnLogin(false);
      navigate('/admin');
    }
  }

  async function logout() {
    await firebaseSignOut(auth);
    navigate('/');
  }

  function requestAdminAccess() {
    if (user && isAdminUser(user)) {
      navigate('/admin');
      return;
    }
    openAdminLogin({ navigateOnSuccess: true });
  }

  const value = {
    user,
    loading,
    isAdmin: Boolean(user && isAdminUser(user)),
    login,
    logout,
    requestAdminAccess,
    openAdminLogin,
    closeAdminLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AdminLoginModal open={loginOpen} onClose={closeAdminLogin} onLogin={login} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { isAdminUser };
