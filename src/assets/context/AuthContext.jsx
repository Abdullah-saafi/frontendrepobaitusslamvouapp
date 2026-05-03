import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await api.post(
        "/verify",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUser({
        name: response.data.userName,
        role: response.data.role,
        email: response.data.email,
      });
    } catch (error) {
      console.error("Token verification failed", error);
      sessionStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    sessionStorage.setItem("token", token);
    setUser({
      name: userData.userName,
      role: userData.role,
    });
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
