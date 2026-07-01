import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthError = () => {
      setToken(null);
      localStorage.removeItem('admin_token');
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const login = async (pin) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { pin });
      if (res.data && res.data.ok && res.data.token) {
        const receivedToken = res.data.token;
        localStorage.setItem('admin_token', receivedToken);
        setToken(receivedToken);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, message: 'Respuesta inválida del servidor.' };
      }
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || 'Error de conexión con el servidor.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
