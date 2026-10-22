
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }

    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (path, body) => {
    const data = await api(path, { method: 'POST', body });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const login = (email, password) => authenticate('/auth/login', { email, password });
  const register = (form) => authenticate('/auth/register', form);

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const canAccessAdmin = isAdmin || isStaff; 

  const value = { user, loading, login, register, logout, isAdmin, isStaff, canAccessAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
