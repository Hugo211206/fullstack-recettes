import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { apiFetch, clearToken, getToken, setToken } from '../api/client';

const USER_KEY = 'user';

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw || !getToken()) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  function saveSession(data) {
    setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(email, password) {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    saveSession(data);
  }

  async function register(email, password, username) {
    const data = await apiFetch('/auth/register', { method: 'POST', body: { email, password, username } });
    saveSession(data);
  }

  function logout() {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  useEffect(() => {
    function handleExpired() {
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
    window.addEventListener('auth:logout', handleExpired);
    return () => window.removeEventListener('auth:logout', handleExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}