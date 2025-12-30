import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useData} from '../../contexts/DataContext';

const RideDetailsScreen = ({route, navigation}: any) => {
  const {rideId} = route.params;
  const {getRideById, blockUser, reportUser, isUserBlocked} = useData();
  const ride = getRideById(rideId);

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  const handleBidPress = () => {
    navigation.navigate('BidForm', {rideId: ride.id});
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block Rider',
      'You will no longer see rides from this rider. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUser(ride.riderId);
            Alert.alert('Blocked', 'You will no longer see rides from this rider.');
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleReportUser = () => {
    Alert.prompt(
      'Report Rider',
      'Please provide a reason for this report:',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Report',
          onPress: (reason?: string) => {
            if (reason && reason.trim()) {
              reportUser(ride.riderId, reason.trim());
              Alert.alert('Reported', 'Thank you for your report. We will review it.');
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const isBlocked = isUserBlocked(ride.riderId);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{ride.distanceKm} km</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, styles.status]}>{ride.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>{ride.pickupAddress}</Text>
          </View>
          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationText}>{ride.dropoffAddress}</Text>
          </View>
        </View>

        {ride.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{ride.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted</Text>
          <Text style={styles.value}>
            {new Date(ride.createdAt).toLocaleString()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expires</Text>
          <Text style={styles.value}>
            {new Date(ride.expiresAt).toLocaleString()}
          </Text>
        </View>

        {ride.status === 'OPEN' && !isBlocked && (
          <TouchableOpacity style={styles.bidButton} onPress={handleBidPress}>
            <Text style={styles.bidButtonText}>Submit Bid</Text>
          </TouchableOpacity>
        )}

        <View style={styles.safetyActions}>
          <TouchableOpacity
            style={[styles.safetyButton, styles.reportButton]}
            onPress={handleReportUser}>
            <Text style={styles.safetyButtonText}>Report Rider</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.safetyButton, styles.blockButton]}
            onPress={handleBlockUser}>
            <Text style={styles.safetyButtonText}>
              {isBlocked ? 'Already Blocked' : 'Block Rider'}
            </Text>
          </TouchableOpacity>
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
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
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
    marginBottom: 8,
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
  status: {
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  locationBlock: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: 16,
    color: '#000',
  },
  notesText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  bidButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  safetyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  safetyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  reportButton: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  blockButton: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  safetyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

export default RideDetailsScreen;
