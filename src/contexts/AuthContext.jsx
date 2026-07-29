import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('turnotopia_token');
    const savedUser = localStorage.getItem('turnotopia_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authService.login({ email, password });
    if (data.success) {
      localStorage.setItem('turnotopia_token', data.data.token);
      localStorage.setItem('turnotopia_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
    }
    return data;
  };

  const patientLogin = async (dni, email) => {
    const { data } = await authService.patientLogin({ dni, email });
    if (data.success) {
      localStorage.setItem('turnotopia_token', data.data.token);
      localStorage.setItem('turnotopia_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
    }
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await authService.publicRegister({ name, email, password });
    if (data.success) {
      localStorage.setItem('turnotopia_token', data.data.token);
      localStorage.setItem('turnotopia_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('turnotopia_token');
    localStorage.removeItem('turnotopia_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, patientLogin, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
