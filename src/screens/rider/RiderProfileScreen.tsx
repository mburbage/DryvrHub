import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useData} from '../../contexts/DataContext';

const RiderProfileScreen = () => {
  const {getCurrentUser, getRiderProfile} = useData();
  const user = getCurrentUser();
  const profile = getRiderProfile(user.id);

  const getAccountAge = () => {
    const daysSince = Math.floor(
      (new Date().getTime() - new Date(user.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysSince < 30) return `${daysSince} days`;
    if (daysSince < 365) return `${Math.floor(daysSince / 30)} months`;
    return `${Math.floor(daysSince / 365)} years`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Rider Profile</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{user.phoneNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Account Age</Text>
            <Text style={styles.value}>{getAccountAge()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Verified</Text>
            <Text style={[styles.value, styles.verified]}>
              {user.isVerified ? '✓ Verified' : 'Not Verified'}
            </Text>
          </View>
        </View>

        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ride History</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Completed Rides</Text>
              <Text style={styles.value}>{profile.completedRidesCount}</Text>
            </View>
            <Text style={styles.hint}>
              This count is private and only visible to you.
            </Text>
          </View>
        )}
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
});

export default RiderProfileScreen;
