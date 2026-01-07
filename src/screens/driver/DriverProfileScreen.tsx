import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';

const DriverProfileScreen = () => {
  const {user} = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Driver Profile</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>Driver</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email Verified</Text>
            <Text style={[styles.value, styles.verified]}>
              {user.emailVerified ? '✓ Verified' : 'Not Verified'}
            </Text>
          </View>
        </View>

        <View style={styles.reminderCard}>
          <Text style={styles.reminderTitle}>Remember</Text>
          <Text style={styles.reminderText}>
            • You set your own prices{"\n"}
            • You keep 100% of every fare{"\n"}
            • No ratings or performance tracking{"\n"}
            • You control your schedule
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  verified: {
    color: '#4CAF50',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  reminderCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default DriverProfileScreen;
