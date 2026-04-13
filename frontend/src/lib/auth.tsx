import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from './api';

interface AuthUser {
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('versatile_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.me()
        .then((data) => setUser({ username: data.username }))
        .catch(() => {
          localStorage.removeItem('versatile_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const result = await api.login(username, password);
    localStorage.setItem('versatile_token', result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const register = async (username: string, password: string) => {
    const result = await api.register(username, password);
    localStorage.setItem('versatile_token', result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem('versatile_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
