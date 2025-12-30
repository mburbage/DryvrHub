import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useData} from '../../contexts/DataContext';

const AcceptedRideScreen = ({route, navigation}: any) => {
  const {rideId} = route.params;
  const {getRideById, getBidsByRide, updateRideStatus} = useData();
  const ride = getRideById(rideId);
  const bids = getBidsByRide(rideId);
  const acceptedBid = bids.find(bid => bid.id === ride?.acceptedBidId);

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  const handleMarkComplete = () => {
    Alert.alert(
      'Complete Ride',
      'Mark this ride as completed?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Complete',
          onPress: () => {
            try {
              updateRideStatus(ride.id, 'COMPLETED');
              Alert.alert('Success', 'Ride marked as completed!', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to complete ride. Please try again.');
              console.error('Failed to complete ride:', error);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {ride.status === 'ACCEPTED' && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>✓ Ride Confirmed</Text>
          </View>
        )}

        {ride.status === 'COMPLETED' && (
          <View style={[styles.statusBanner, styles.completedBanner]}>
            <Text style={styles.statusText}>✓ Ride Completed</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>{ride.pickupAddress}</Text>
          </View>
          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationText}>{ride.dropoffAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{ride.distanceKm} km</Text>
          </View>
        </View>

        {acceptedBid && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accepted Price</Text>
            <Text style={styles.priceText}>
              ${acceptedBid.priceAmount.toFixed(2)}
            </Text>
            {acceptedBid.message && (
              <View style={styles.messageBlock}>
                <Text style={styles.messageLabel}>Driver's Message</Text>
                <Text style={styles.messageText}>{acceptedBid.message}</Text>
              </View>
            )}
          </View>
        )}

        {ride.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Notes</Text>
            <Text style={styles.notesText}>{ride.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Posted</Text>
            <Text style={styles.value}>
              {new Date(ride.createdAt).toLocaleString()}
            </Text>
          </View>
          {ride.acceptedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Accepted</Text>
              <Text style={styles.value}>
                {new Date(ride.acceptedAt).toLocaleString()}
              </Text>
            </View>
          )}
          {ride.completedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Completed</Text>
              <Text style={styles.value}>
                {new Date(ride.completedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {ride.status === 'ACCEPTED' && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleMarkComplete}>
            <Text style={styles.completeButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            This view is for your reference only. No tracking or navigation is
            provided. Coordinate with your driver directly.
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
    padding: 16,
  },
  statusBanner: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  completedBanner: {
    backgroundColor: '#666',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
  locationBlock: {
    marginBottom: 12,
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
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  messageBlock: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default AcceptedRideScreen;
