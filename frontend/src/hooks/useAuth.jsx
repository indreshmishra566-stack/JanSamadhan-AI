import { createContext, useContext, useState, useEffect } from "react";
import { authApi, clearStoredTokens, getStoredAccessToken, setStoredTokens } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const me = await authApi.me();
    setUser(me.data);
    return me.data;
  };

  useEffect(() => {
    const token = getStoredAccessToken();
    if (token) {
      refreshUser()
        .catch(() => { clearStoredTokens(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    setStoredTokens(data);
    return refreshUser();
  };

  const logout = () => {
    clearStoredTokens();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
