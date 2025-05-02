import { useState, useEffect, useCallback } from "react";
import { apiLogin, apiRegister }         from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string|null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // 可选：解析 token，拿到 display_name/email
      setUser("me");
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const { access_token } = await apiLogin(email, password);
      localStorage.setItem("access_token", access_token);
      setUser(email);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const { access_token } = await apiRegister(email, password);
      localStorage.setItem("access_token", access_token);
      setUser(email);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setUser(null);
  }, []);

  return { user, loading, error, login, register, logout };
}
