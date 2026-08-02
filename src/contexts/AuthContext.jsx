/**
 * Contexto de Autenticación de la aplicación.
 * Maneja el estado global del usuario (sesión iniciada, rol, tokens).
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  // Estado para almacenar la información del usuario actual
  const [user, setUser] = useState(null);
  // Estado para saber si se está validando la sesión al cargar
  const [loading, setLoading] = useState(true);

  // Efecto que se ejecuta al montar la app para recuperar la sesión guardada
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

  // Función principal para iniciar sesión de personal médico/admin
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

  // Cierra la sesión y limpia el almacenamiento local
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
