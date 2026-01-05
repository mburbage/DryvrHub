/**
 * DryverHub - Ride Marketplace App
 * Driver-first, zero-commission model
 *
 * @format
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ActivityIndicator, View, StyleSheet, StatusBar} from 'react-native';
import {AuthProvider, useAuth} from './src/contexts/AuthContext';
import {RoleProvider, useRole} from './src/contexts/RoleContext';
import {DataProvider} from './src/contexts/DataContext';
import {SettingsProvider} from './src/contexts/SettingsContext';
import {AuthNavigator} from './src/navigation/AuthNavigator';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import RiderNavigator from './src/navigation/RiderNavigator';
import DriverNavigator from './src/navigation/DriverNavigator';

function AppContent() {
  const {user, isLoading: authLoading} = useAuth();
  const {role, isLoading: roleLoading} = useRole();

  // Show loading while checking auth state
  if (authLoading || roleLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Not authenticated - show auth flow
  if (!user) {
    return <AuthNavigator />;
  }

  // Authenticated but no role selected (legacy support)
  if (!role) {
    return <RoleSelectionScreen />;
  }

  // Authenticated with role - show main app
  return (
    <NavigationContainer>
      {role === 'RIDER' ? <RiderNavigator /> : <DriverNavigator />}
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <RoleProvider>
          <SettingsProvider>
            <DataProvider>
              <AppContent />
            </DataProvider>
          </SettingsProvider>
        </RoleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default App;
