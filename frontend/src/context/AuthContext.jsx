import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token    = localStorage.getItem('accessToken');
    const stored   = localStorage.getItem('user');
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { /* bad JSON */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { user: u, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user',         JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      localStorage.setItem('user', JSON.stringify(data.data));
      setUser(data.data);
    } catch { logout(); }
  }, [logout]);

  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.role);
  }, [user]);

  const hasPermission = useCallback((perm) => {
    if (!user) return false;
    const perms = user.permissions || [];
    return perms.includes('*') || perms.includes(perm);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, logout, refreshUser,
      hasRole, hasPermission,
      isAdmin:   user?.role === 'admin',
      isManager: ['admin', 'manager'].includes(user?.role),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
