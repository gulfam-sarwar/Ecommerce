// AuthContext keeps track of "who is logged in" for the whole app.
// Any component can call useAuth() to get the user and the login/logout functions.

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

// A small helper so components can write:  const { user } = useAuth();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = nobody is logged in
  const [loading, setLoading] = useState(true); // true while we check the saved token

  // When the app starts, check if a token is saved in the browser.
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }

    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('token')) // token is old/invalid
      .finally(() => setLoading(false));
  }, []);

  // Shared by login and register: send the data, save the token, save the user.
  const authenticate = async (path, body) => {
    const data = await api(path, { method: 'POST', body });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user; // return the user so the page can decide where to go next
  };

  const login = (email, password) => authenticate('/auth/login', { email, password });
  const register = (form) => authenticate('/auth/register', form);

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // even if the server fails, we still log out in the browser
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  // Handy true/false values based on the user's role
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const canAccessAdmin = isAdmin || isStaff; // can open the admin panel

  const value = { user, loading, login, register, logout, isAdmin, isStaff, canAccessAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
