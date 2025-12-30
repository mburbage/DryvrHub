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
import {RoleProvider, useRole} from './src/contexts/RoleContext';
import {DataProvider} from './src/contexts/DataContext';
import {SettingsProvider} from './src/contexts/SettingsContext';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import RiderNavigator from './src/navigation/RiderNavigator';
import DriverNavigator from './src/navigation/DriverNavigator';

function AppContent() {
  const {role, isLoading} = useRole();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!role) {
    return <RoleSelectionScreen />;
  }

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
      <RoleProvider>
        <SettingsProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </SettingsProvider>
      </RoleProvider>
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
