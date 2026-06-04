import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { authService } from '../core/services/authService';
import { getToken, clearToken } from '../core/storage/tokenStorage';
import { Profile } from '../core/types/auth';
import { ApiError } from '../core/types/api';

export type AuthStatus =
  | { state: 'checking' }
  | { state: 'signed_out' }
  | { state: 'signed_in'; profile: Profile };

type AuthContextValue = {
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const isInvalidTokenError = (err: unknown): boolean => {
  // Our api layer rejects with ApiError
  const apiErr = err as ApiError;
  return apiErr?.kind === 'unauthorized' || apiErr?.status === 401;
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>({ state: 'checking' });

  const login = useCallback(async (email: string, password: string) => {
    setStatus({ state: 'checking' });
    try {
      await authService.login(email, password);
      const profile = await authService.getProfile();
      setStatus({ state: 'signed_in', profile });
    } catch (e) {
      const apiErr = e as ApiError;
      setStatus({ state: 'signed_out' });
      Alert.alert('Login failed', apiErr?.message || 'Unable to login');
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      setStatus({ state: 'checking' });
      try {
        await authService.register(email, password, fullName);
        // After register, user still needs to login.
        setStatus({ state: 'signed_out' });
      } catch (e) {
        const apiErr = e as ApiError;
        setStatus({ state: 'signed_out' });
        Alert.alert('Registration failed', apiErr?.message || 'Unable to register');
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setStatus({ state: 'signed_out' });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setStatus({ state: 'signed_in', profile });
    } catch (e) {
      if (isInvalidTokenError(e)) {
        await clearToken();
        setStatus({ state: 'signed_out' });
        return;
      }
      // Keep user signed out if profile refresh fails for other reasons.
      setStatus({ state: 'signed_out' });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await getToken();
      if (!mounted) return;
      if (!token) {
        setStatus({ state: 'signed_out' });
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (!mounted) return;
        setStatus({ state: 'signed_in', profile });
      } catch (e) {
        if (isInvalidTokenError(e)) {
          await clearToken();
        }
        if (!mounted) return;
        setStatus({ state: 'signed_out' });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, login, register, logout, refreshProfile }),
    [status, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

