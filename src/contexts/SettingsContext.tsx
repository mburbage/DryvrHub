import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  UserSettings,
  DEFAULT_APP_SETTINGS,
  DEFAULT_USER_SETTINGS,
  DarkMode,
  Language,
} from '../shared/settingsTypes';

const APP_SETTINGS_KEY = '@app_settings';
const USER_SETTINGS_KEY = '@user_settings';

interface SettingsContextType {
  // App Settings (global)
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // User Settings (role-aware)
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({children}: {children: ReactNode}) => {
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [appData, userData] = await Promise.all([
        AsyncStorage.getItem(APP_SETTINGS_KEY),
        AsyncStorage.getItem(USER_SETTINGS_KEY),
      ]);

      if (appData) {
        setAppSettings(JSON.parse(appData));
      }
      if (userData) {
        const parsed = JSON.parse(userData);
        // Migrate old data: ensure acceptedPaymentTypes exists
        const migratedSettings = {
          ...parsed,
          driver: {
            ...DEFAULT_USER_SETTINGS.driver,
            ...parsed.driver,
            acceptedPaymentTypes: parsed.driver?.acceptedPaymentTypes || DEFAULT_USER_SETTINGS.driver.acceptedPaymentTypes,
          },
        };
        setUserSettings(migratedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateAppSettings = async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = {...appSettings, ...updates};
      setAppSettings(newSettings);
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save app settings:', error);
    }
  };

  const updateUserSettings = async (updates: Partial<UserSettings>) => {
    try {
      const newSettings = {
        ...userSettings,
        ...updates,
        rider: {...userSettings.rider, ...updates.rider},
        driver: {...userSettings.driver, ...updates.driver},
      };
      setUserSettings(newSettings);
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        appSettings,
        updateAppSettings,
        userSettings,
        updateUserSettings,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
