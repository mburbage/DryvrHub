import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

interface Bid {
  id: string;
  trip_id: string;
  driver_id: string;
  bid_amount: string;
  message: string | null;
  status: 'submitted' | 'accepted' | 'withdrawn' | 'rejected';
  created_at: string;
}

interface Trip {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_distance_miles: number | null;
  scheduled_pickup_time: string;
  status: string;
  notes: string | null;
}

interface AcceptedTrip {
  bid: Bid;
  trip: Trip;
}

const DriverTripsScreen = ({navigation}: any) => {
  const {token, user} = useAuth();
  const [trips, setTrips] = useState<AcceptedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTrips();
  }, []);

  const fetchMyTrips = async () => {
    try {
      setLoading(true);
      
      // Fetch all driver's bids
      const bidsResponse = await fetch(`${API_URL}/api/bids?driver_id=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!bidsResponse.ok) {
        throw new Error('Failed to fetch bids');
      }

      const bidsData: Bid[] = await bidsResponse.json();
      
      // Filter for accepted bids
      const acceptedBids = bidsData.filter(bid => bid.status === 'accepted');

      // Fetch trip details for each accepted bid
      const tripsPromises = acceptedBids.map(async (bid) => {
        const tripResponse = await fetch(`${API_URL}/api/trips/${bid.trip_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (tripResponse.ok) {
          const tripData = await tripResponse.json();
          return { bid, trip: tripData };
        }
        return null;
      });

      const results = await Promise.all(tripsPromises);
      const validTrips = results
        .filter((t): t is AcceptedTrip => t !== null)
        .filter(t => t.trip.status !== 'rider_confirmed'); // Hide completed trips
      
      setTrips(validTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTripPress = (acceptedTrip: AcceptedTrip) => {
    navigation.navigate('TripExecution', {
      tripId: acceptedTrip.trip.id,
      bidAmount: acceptedTrip.bid.bid_amount,
    });
  };

  const renderTripItem = ({item}: {item: AcceptedTrip}) => {
    const {trip, bid} = item;
    const distanceMiles = trip.estimated_distance_miles 
      ? parseFloat(trip.estimated_distance_miles as any).toFixed(1)
      : 'N/A';

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => handleTripPress(item)}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{trip.status.toUpperCase()}</Text>
        </View>
        
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Your Fare:</Text>
          <Text style={styles.fareAmount}>${parseFloat(bid.bid_amount).toFixed(2)}</Text>
        </View>

        {trip.estimated_distance_miles && (
          <Text style={styles.distance}>{distanceMiles} miles</Text>
        )}

        <Text style={styles.location}>From: {trip.pickup_address}</Text>
        <Text style={styles.location}>To: {trip.dropoff_address}</Text>

        {trip.notes && (
          <Text style={styles.notes}>Note: {trip.notes}</Text>
        )}

        <Text style={styles.pickup}>
          Pickup: {new Date(trip.scheduled_pickup_time).toLocaleString()}
        </Text>

        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => handleTripPress(item)}>
          <Text style={styles.startButtonText}>View Trip →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (trips.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active trips</Text>
        <Text style={styles.emptySubtext}>
          Place bids on the Ride Board to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={(item) => item.bid.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 16,
    color: '#666',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notes: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 8,
  },
  pickup: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverTripsScreen;
