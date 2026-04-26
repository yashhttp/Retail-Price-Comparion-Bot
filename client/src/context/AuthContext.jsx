import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("rpcb_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    authApi
      .me()
      .then((response) => {
        setUser(response.data.user);
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem("rpcb_token");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      return null;
    }

    const response = await authApi.me();
    setUser(response.data.user);
    return response.data.user;
  };

  const login = (nextToken, nextUser) => {
    localStorage.setItem("rpcb_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("rpcb_token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  const value = useMemo(
    () => ({ token, user, loading, login, logout, refreshUser, updateUser }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
