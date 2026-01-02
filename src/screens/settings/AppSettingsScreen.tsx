import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import {useSettings} from '../../contexts/SettingsContext';
import {useRole} from '../../contexts/RoleContext';
import {useData} from '../../contexts/DataContext';
import {DarkMode} from '../../shared/settingsTypes';

const AppSettingsScreen = () => {
  const {appSettings, updateAppSettings} = useSettings();
  const {setRole} = useRole();
  const {resetAllData} = useData();

  const handleDarkModeChange = (mode: DarkMode) => {
    updateAppSettings({darkMode: mode});
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await setRole(null);
            // User will be redirected to role selection by navigation
          },
        },
      ],
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset App Data',
      'This will clear all rides, bids, and blocked users, and reload fresh demo data. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllData();
              Alert.alert('Success', 'App data has been reset with fresh demo data.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          },
        },
      ],
    );
  };

  const openLink = (url: string, title: string) => {
    // In production, these would be real URLs
    Alert.alert(title, `Would open: ${url}\n\n(Not implemented in demo)`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Push Notifications</Text>
          <Switch
            value={appSettings.pushNotificationsEnabled}
            onValueChange={value =>
              updateAppSettings({pushNotificationsEnabled: value})
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text style={styles.label}>Dark Mode</Text>
        {(['system', 'light', 'dark'] as DarkMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={styles.radioRow}
            onPress={() => handleDarkModeChange(mode)}>
            <View style={styles.radio}>
              {appSettings.darkMode === mode && (
                <View style={styles.radioSelected} />
              )}
            </View>
            <Text style={styles.radioLabel}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLink('https://example.com/terms', 'Terms of Service')}>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLink('https://example.com/privacy', 'Privacy Policy')}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLink('mailto:support@example.com', 'Contact Support')}>
          <Text style={styles.linkText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.label}>App Version</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Development</Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleResetData}>
          <Text style={styles.resetButtonText}>Reset App Data</Text>
        </TouchableOpacity>
        <Text style={styles.resetHint}>
          Clear all data and reload fresh demo rides
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#000',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    fontSize: 16,
    color: '#000',
  },
  linkRow: {
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#FF9500',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resetHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AppSettingsScreen;
