import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getToken, setToken, setUnauthorizedHandler } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(getToken);
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(!!getToken());

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setSession(null);
  }, []);

  const login = useCallback(async (candidate) => {
    const info = await api.session(candidate);
    setToken(candidate);
    setTokenState(candidate);
    setSession(info);
    return info;
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // A token from an earlier visit in this tab: check it is still accepted.
  useEffect(() => {
    if (!token || session) return;
    api
      .session(token)
      .then(setSession)
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, [token, session, logout]);

  const value = useMemo(() => ({ token, session, checking, login, logout }), [token, session, checking, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
