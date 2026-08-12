import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('trueman_token');
    if (!token) return setLoading(false);
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('trueman_token'))
      .finally(() => setLoading(false));
  }, []);

  const persist = ({ token, user }) => {
    localStorage.setItem('trueman_token', token);
    setUser(user);
    return user;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return persist(res.data);
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    return persist(res.data);
  };

  const logout = () => {
    localStorage.removeItem('trueman_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
