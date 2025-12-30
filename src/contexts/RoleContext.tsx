import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'RIDER' | 'DRIVER' | null;

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => Promise<void>;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = '@dryverhub_user_role';

export const RoleProvider = ({children}: {children: ReactNode}) => {
  const [role, setRoleState] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRole();
  }, []);

  const loadRole = async () => {
    try {
      const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      if (savedRole === 'RIDER' || savedRole === 'DRIVER') {
        setRoleState(savedRole);
      }
    } catch (error) {
      console.error('Failed to load role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setRole = async (newRole: UserRole) => {
    try {
      if (newRole) {
        await AsyncStorage.setItem(ROLE_STORAGE_KEY, newRole);
      } else {
        await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
      }
      setRoleState(newRole);
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  return (
    <RoleContext.Provider value={{role, setRole, isLoading}}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
