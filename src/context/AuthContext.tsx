import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { loginApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rent_app_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const login = async (username: string, pass: string) => {
    const data = await loginApi(username, pass);
    setUser(data.user);
    localStorage.setItem('rent_app_user', JSON.stringify(data.user));
    localStorage.setItem('rent_app_token', data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rent_app_user');
    localStorage.removeItem('rent_app_token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
