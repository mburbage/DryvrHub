import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, TextInput} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import io, {Socket} from 'socket.io-client';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const TripExecutionScreen = ({route, navigation}: any) => {
  const {tripId, bidAmount} = route.params;
  const {token} = useAuth();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pickupCode, setPickupCode] = useState('');

  useEffect(() => {
    fetchTripDetails();

    // Initialize WebSocket connection
    console.log('Initializing WebSocket with token:', token ? 'Token exists' : 'No token');
    const socketInstance = io(API_URL, {
      auth: {
        token: token,
      },
    });

    socketInstance.on('connect', () => {
      console.log('Driver WebSocket connected');
      socketInstance.emit('join-trip', tripId);
    });

    socketInstance.on('trip-updated', (updatedTrip: any) => {
      console.log('Driver received trip update:', updatedTrip);
      setTrip(updatedTrip);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Driver WebSocket connection error:', error);
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

  const handleStatusUpdate = async (endpoint: string, successMessage: string) => {
    try {
      const response = await fetch(`${API_URL}/api/trips/${tripId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Success', successMessage);
        // No need to call fetchTripDetails() - WebSocket will update automatically
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to update trip');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update trip');
    }
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

  const distanceMiles = trip.estimated_distance_miles 
    ? parseFloat(trip.estimated_distance_miles).toFixed(1)
    : 'N/A';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <Text style={styles.statusValue}>{trip.status.toUpperCase()}</Text>
        </View>

        <View style={styles.fareCard}>
          <Text style={styles.fareLabel}>Your Fare</Text>
          <Text style={styles.fareAmount}>${parseFloat(bidAmount).toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <Text style={styles.detail}>Distance: {distanceMiles} miles</Text>
          <Text style={styles.detail}>From: {trip.pickup_address}</Text>
          <Text style={styles.detail}>To: {trip.dropoff_address}</Text>
          {trip.notes && (
            <Text style={styles.notes}>Note: {trip.notes}</Text>
          )}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Trip Actions</Text>
          
          {trip.status === 'accepted' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusUpdate('start-en-route', 'Status updated to En Route')}>
              <Text style={styles.actionButtonText}>I'm En Route</Text>
            </TouchableOpacity>
          )}

          {trip.status === 'en_route' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusUpdate('arrived', 'Status updated to Arrived')}>
              <Text style={styles.actionButtonText}>I've Arrived</Text>
            </TouchableOpacity>
          )}

          {trip.status === 'arrived' && (
            <View>
              <Text style={styles.instructionText}>
                Ask rider for pickup code
              </Text>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter 4-digit code"
                value={pickupCode}
                onChangeText={setPickupCode}
                keyboardType="number-pad"
                maxLength={4}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.actionButton, !pickupCode || pickupCode.length !== 4 ? styles.disabledButton : null]}
                disabled={!pickupCode || pickupCode.length !== 4}
                onPress={async () => {
                  try {
                    const response = await fetch(`${API_URL}/api/trips/${tripId}/start-trip`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ pickup_code: pickupCode }),
                    });

                    if (response.ok) {
                      Alert.alert('Success', 'Pickup verified! Waiting for rider payment confirmation.');
                      setPickupCode('');
                    } else {
                      const error = await response.json();
                      Alert.alert('Error', error.error || 'Invalid pickup code');
                    }
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to verify pickup code');
                  }
                }}>
                <Text style={styles.actionButtonText}>Verify Pickup Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {trip.status === 'code_verified' && (
            <View>
              <Text style={styles.instructionText}>
                Waiting for rider to confirm payment...
              </Text>
            </View>
          )}

          {trip.status === 'in_progress' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusUpdate('complete', 'Trip marked as complete!')}>
              <Text style={styles.actionButtonText}>Complete Trip</Text>
            </TouchableOpacity>
          )}

          {trip.status === 'completed' && (
            <View>
              <Text style={styles.instructionText}>
                Waiting for rider to confirm completion...
              </Text>
            </View>
          )}

          {trip.status === 'rider_confirmed' && (
            <View style={styles.completedCard}>
              <Text style={styles.completedText}>✓ Trip Completed!</Text>
              <Text style={styles.completedSubtext}>
                You earned ${parseFloat(bidAmount).toFixed(2)}
              </Text>
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
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
    marginBottom: 4,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  detail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  notes: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  codeInput: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
  completedCard: {
    backgroundColor: '#E8F5E9',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  completedSubtext: {
    fontSize: 16,
    color: '#666',
  },
});

export default TripExecutionScreen;
