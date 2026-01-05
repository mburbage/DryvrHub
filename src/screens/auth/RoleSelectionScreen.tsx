import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

/**
 * Role Selection Screen
 * 
 * RULES:
 * - Two explicit roles: rider or driver
 * - Role is chosen at signup
 * - No automatic role detection
 * - No role switching (separate accounts in MVP)
 */

interface Props {
  onSelectRole: (role: 'rider' | 'driver') => void;
}

export const RoleSelectionScreen: React.FC<Props> = ({ onSelectRole }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to DryverHub</Text>
        <Text style={styles.subtitle}>Are you a rider or a driver?</Text>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => onSelectRole('rider')}
          activeOpacity={0.8}
        >
          <Text style={styles.roleButtonTitle}>🚗 I'm a Rider</Text>
          <Text style={styles.roleButtonDescription}>
            I need a ride
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => onSelectRole('driver')}
          activeOpacity={0.8}
        >
          <Text style={styles.roleButtonTitle}>👤 I'm a Driver</Text>
          <Text style={styles.roleButtonDescription}>
            I want to provide rides
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
  },
  roleButton: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleButtonTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  roleButtonDescription: {
    fontSize: 16,
    color: '#666',
  },
});
