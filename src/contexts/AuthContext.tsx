import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Authentication Context
 * 
 * RULES ENFORCED:
 * - Authentication is identity, NOT trust
 * - Role is explicit ('rider' or 'driver')
 * - Email verification status is tracked but doesn't block login
 * - JWT token stored securely in AsyncStorage
 * - Logout clears all auth state
 * - No behavioral tracking or scoring
 */

export interface AuthUser {
  id: string;
  email: string;
  role: 'rider' | 'driver';
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: 'rider' | 'driver') => Promise<void>;
  signup: (email: string, password: string, role: 'rider' | 'driver') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = '@dryvrhub:auth_token';
const AUTH_USER_KEY = '@dryvrhub:auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from storage on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const [storedToken, storedUserJson] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (storedToken && storedUserJson) {
        setToken(storedToken);
        setUser(JSON.parse(storedUserJson));
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthState = async (newToken: string, newUser: AuthUser) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser)),
      ]);
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('Failed to save auth state:', error);
      throw new Error('Failed to save authentication');
    }
  };

  const clearAuthState = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to clear auth state:', error);
    }
  };

  /**
   * Login
   * RULE: Do NOT block login for incomplete verification
   */
  const login = async (email: string, password: string, role: 'rider' | 'driver') => {
    try {
      const API_BASE_URL = Platform.OS === 'android' 
        ? 'http://10.0.2.2:3000' 
        : 'http://localhost:3000';

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      await saveAuthState(data.token, data.user);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Sign up
   * RULE: Role is chosen at signup
   * RULE: Email verification is sent but not required for login
   */
  const signup = async (email: string, password: string, role: 'rider' | 'driver') => {
    try {
      const API_BASE_URL = Platform.OS === 'android' 
        ? 'http://10.0.2.2:3000' 
        : 'http://localhost:3000';

      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      await saveAuthState(data.token, data.user);

      // TODO: Show message about verification email sent
      // In MVP, we return verification token in response for testing
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  /**
   * Logout
   * RULE: No warnings, no retention nudges, no exit friction
   */
  const logout = async () => {
    try {
      if (token) {
        const API_BASE_URL = Platform.OS === 'android' 
          ? 'http://10.0.2.2:3000' 
          : 'http://localhost:3000';

        // Call logout endpoint (though JWT logout is client-side)
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with client-side logout even if API call fails
    } finally {
      await clearAuthState();
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    if (!token) return;

    try {
      const API_BASE_URL = Platform.OS === 'android' 
        ? 'http://10.0.2.2:3000' 
        : 'http://localhost:3000';

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      } else {
        // Token expired or invalid
        await clearAuthState();
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Need Platform import
import { Platform } from 'react-native';
