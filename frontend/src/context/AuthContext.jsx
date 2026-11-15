import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const savedUser = localStorage.getItem('lovely_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const [hasAcceptedPolicies, setHasAcceptedPolicies] = useState(false);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('lovely_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lovely_user');
    setHasAcceptedPolicies(false);
  };

  const acceptPolicies = () => setHasAcceptedPolicies(true);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading, hasAcceptedPolicies, acceptPolicies }}>
      {children}
    </AuthContext.Provider>
  );
};
