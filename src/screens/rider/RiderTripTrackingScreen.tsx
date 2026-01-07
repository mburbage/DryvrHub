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
  TextInput,
} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import io, {Socket} from 'socket.io-client';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

interface Trip {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_distance_miles: number | null;
  status: string;
  final_amount: string | null;
  pickup_code_hash: string | null;
}

const RiderTripTrackingScreen = ({route, navigation}: any) => {
  const {tripId, pickupCode: initialPickupCode} = route.params;
  const {token} = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickupCode, setPickupCode] = useState(initialPickupCode || '');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetchTripDetails();

    // Initialize WebSocket connection
    const socketInstance = io(API_URL, {
      auth: {
        token: token,
      },
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      socketInstance.emit('join-trip', tripId);
    });

    socketInstance.on('trip-updated', (updatedTrip: Trip) => {
      console.log('Received trip update:', updatedTrip);
      setTrip(updatedTrip);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.emit('leave-trip', tripId);
        socketInstance.disconnect();
      }
    };
  }, [tripId, token]);

  const fetchTripDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/trips/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrip(data);
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    Alert.alert(
      'Confirm Payment',
      `Confirm you are paying $${trip?.final_amount ? parseFloat(trip.final_amount).toFixed(2) : '0.00'} to the driver?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm Payment',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/trips/${tripId}/confirm-payment`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Payment confirmed! Trip has started.');
                fetchTripDetails();
              } else {
                const error = await response.json();
                Alert.alert('Error', error.error || 'Failed to confirm payment');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to confirm payment');
            }
          },
        },
      ],
    );
  };

  const handleConfirmCompletion = async () => {
    Alert.alert(
      'Confirm Trip Completion',
      'Confirm that your trip was completed successfully?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/trips/${tripId}/confirm-completion`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Trip completed successfully! Thank you for riding.');
                fetchTripDetails();
              } else {
                const error = await response.json();
                Alert.alert('Error', error.error || 'Failed to confirm completion');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to confirm completion');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  const getStatusMessage = () => {
    switch (trip.status) {
      case 'accepted':
        return 'Driver has accepted your ride';
      case 'en_route':
        return 'Driver is on the way to pick you up';
      case 'arrived':
        return 'Driver has arrived at pickup location';
      case 'code_verified':
        return 'Driver verified - ready to start trip';
      case 'in_progress':
        return 'Trip in progress';
      case 'completed':
        return 'Driver has completed the trip';
      case 'rider_confirmed':
        return 'Trip completed successfully';
      default:
        return trip.status;
    }
  };

  const getStatusColor = () => {
    switch (trip.status) {
      case 'accepted':
      case 'en_route':
        return '#FF9800';
      case 'arrived':
      case 'code_verified':
        return '#2196F3';
      case 'in_progress':
        return '#9C27B0';
      case 'completed':
      case 'rider_confirmed':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const distanceMiles = trip.estimated_distance_miles
    ? parseFloat(trip.estimated_distance_miles.toString()).toFixed(1)
    : 'N/A';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.statusCard, {backgroundColor: getStatusColor()}]}>
          <Text style={styles.statusText}>{getStatusMessage()}</Text>
        </View>

        {trip.final_amount && (
          <View style={styles.fareCard}>
            <Text style={styles.fareLabel}>Trip Fare</Text>
            <Text style={styles.fareAmount}>${parseFloat(trip.final_amount).toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <Text style={styles.detail}>Distance: {distanceMiles} miles</Text>
          <Text style={styles.detail}>From: {trip.pickup_address}</Text>
          <Text style={styles.detail}>To: {trip.dropoff_address}</Text>
        </View>

        {/* Show pickup code when driver arrives */}
        {(trip.status === 'arrived' || trip.status === 'code_verified') && pickupCode && (
          <View style={styles.pickupCodeSection}>
            <Text style={styles.sectionTitle}>Pickup Verification Code</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{pickupCode}</Text>
            </View>
            <Text style={styles.codeInstruction}>
              Share this code with your driver when they arrive
            </Text>
          </View>
        )}

        {/* Actions based on trip status */}
        <View style={styles.actionsSection}>
          {trip.status === 'accepted' && (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingText}>Waiting for driver to start en route...</Text>
            </View>
          )}

          {trip.status === 'en_route' && (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingText}>Driver is on the way to pick you up...</Text>
            </View>
          )}

          {trip.status === 'arrived' && (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingText}>
                Driver has arrived! Share your pickup code to verify.
              </Text>
            </View>
          )}

          {trip.status === 'code_verified' && (
            <View>
              <Text style={styles.instructionText}>
                Driver has verified the pickup code. Please confirm payment to start the trip.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleConfirmPayment}>
                <Text style={styles.actionButtonText}>
                  Confirm Payment (${trip.final_amount ? parseFloat(trip.final_amount).toFixed(2) : '0.00'})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {trip.status === 'in_progress' && (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingText}>Trip in progress. Enjoy your ride!</Text>
            </View>
          )}

          {trip.status === 'completed' && (
            <View>
              <Text style={styles.instructionText}>
                Driver has completed the trip. Please confirm completion if everything was satisfactory.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleConfirmCompletion}>
                <Text style={styles.actionButtonText}>Confirm Trip Completion</Text>
              </TouchableOpacity>
            </View>
          )}

          {trip.status === 'rider_confirmed' && (
            <View style={styles.completedCard}>
              <Text style={styles.completedText}>✓ Trip Completed!</Text>
              <Text style={styles.completedSubtext}>Thank you for riding with us</Text>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#999',
  },
  content: {
    padding: 16,
  },
  statusCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  fareCard: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pickupCodeSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  codeDisplay: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1976D2',
    letterSpacing: 8,
  },
  codeInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  actionsSection: {
    marginTop: 8,
  },
  waitingCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedCard: {
    backgroundColor: '#4CAF50',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  completedSubtext: {
    fontSize: 14,
    color: '#fff',
  },
});

export default RiderTripTrackingScreen;
