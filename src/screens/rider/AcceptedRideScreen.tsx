import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

interface Trip {
  id: string;
  rider_id: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_distance_miles: number | null;
  scheduled_pickup_time: string;
  notes: string | null;
  status: string;
  created_at: string;
}

interface Bid {
  id: string;
  driver_id: string;
  bid_amount: string;
  message: string | null;
  status: string;
  created_at: string;
}

const AcceptedRideScreen = ({route, navigation}: any) => {
  const {tripId} = route.params;
  const {token} = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [acceptedBid, setAcceptedBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch trip details
      const tripResponse = await fetch(`${API_URL}/api/trips/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!tripResponse.ok) {
        throw new Error('Failed to fetch trip');
      }

      const tripData = await tripResponse.json();
      setTrip(tripData);

      // Fetch bids to find the accepted one
      const bidsResponse = await fetch(`${API_URL}/api/trips/${tripId}/bids`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (bidsResponse.ok) {
        const bidsData = await bidsResponse.json();
        const accepted = bidsData.find((bid: Bid) => bid.status === 'accepted');
        setAcceptedBid(accepted || null);
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
      Alert.alert('Error', 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = () => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip? This action cannot be undone.',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/trips/${tripId}/cancel`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: 'Cancelled by rider' }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to cancel trip');
              }

              Alert.alert('Success', 'Trip cancelled successfully', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel trip');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }


  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {trip.status === 'accepted' && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>✓ Ride Confirmed</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>{trip.pickup_address}</Text>
          </View>
          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationText}>{trip.dropoff_address}</Text>
          </View>
          {trip.estimated_distance_miles && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{trip.estimated_distance_miles.toFixed(1)} mi</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Scheduled Pickup</Text>
            <Text style={styles.value}>
              {new Date(trip.scheduled_pickup_time).toLocaleString()}
            </Text>
          </View>
        </View>

        {acceptedBid && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accepted Price</Text>
            <Text style={styles.priceText}>
              ${parseFloat(acceptedBid.bid_amount).toFixed(2)}
            </Text>
            {acceptedBid.message && (
              <View style={styles.messageBlock}>
                <Text style={styles.messageLabel}>Driver's Message</Text>
                <Text style={styles.messageText}>{acceptedBid.message}</Text>
              </View>
            )}
          </View>
        )}

        {trip.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Notes</Text>
            <Text style={styles.notesText}>{trip.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted</Text>
          <Text style={styles.value}>
            {new Date(trip.created_at).toLocaleString()}
          </Text>
        </View>

        {trip.status === 'accepted' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelTrip}>
            <Text style={styles.cancelButtonText}>Cancel Trip</Text>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  cancelButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
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
