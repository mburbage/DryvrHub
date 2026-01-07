import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Platform, Alert} from 'react-native';
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
  status: 'open' | 'accepted' | 'cancelled' | 'expired';
  created_at: string;
  bid_count?: number;
}

const RiderRideBoardScreen = ({navigation}: any) => {
  const {token, user} = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTrips();
  }, []);

  const fetchMyTrips = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/trips?rider_id=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }

      const data = await response.json();
      // Convert string decimal fields to numbers
      const processedTrips = data.map((trip: any) => ({
        ...trip,
        estimated_distance_miles: trip.estimated_distance_miles 
          ? parseFloat(trip.estimated_distance_miles) 
          : null,
      }));
      setTrips(processedTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostRide = () => {
    navigation.navigate('PostRide');
  };

  const handleViewBids = (rideId: string) => {
    navigation.navigate('ViewBids', {rideId});
  };

  const handleViewAcceptedRide = (tripId: string) => {
    navigation.navigate('AcceptedRide', {tripId});
  };

  const handleCancelTrip = (trip: Trip) => {
    Alert.alert(
      'Cancel Trip',
      `Are you sure you want to cancel this trip?\n\nFrom: ${trip.pickup_address}\nTo: ${trip.dropoff_address}`,
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/trips/${trip.id}/cancel`, {
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

              Alert.alert('Success', 'Trip cancelled successfully');
              fetchMyTrips(); // Refresh the list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel trip');
            }
          },
        },
      ],
    );
  };

  const renderRideItem = ({item}: {item: Trip}) => {
    const isAcceptedOrCompleted = item.status === 'accepted';

    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => 
          isAcceptedOrCompleted 
            ? handleViewAcceptedRide(item.id)
            : handleViewBids(item.id)
        }>
        <View style={styles.rideHeader}>
          <Text style={[
            styles.rideStatus,
            item.status === 'accepted' && styles.acceptedStatus,
            item.status === 'cancelled' && styles.cancelledStatus,
            item.status === 'expired' && styles.expiredStatus,
          ]}>
            {item.status.toUpperCase()}
          </Text>
          {item.estimated_distance_miles && (
            <Text style={styles.rideDistance}>
              {item.estimated_distance_miles.toFixed(1)} mi
            </Text>
          )}
        </View>
        <Text style={styles.rideLocation}>From: {item.pickup_address}</Text>
        <Text style={styles.rideLocation}>To: {item.dropoff_address}</Text>
        {item.notes && <Text style={styles.rideNotes}>{item.notes}</Text>}
        <View style={styles.rideFooter}>
          <Text style={styles.rideTime}>
            Posted: {new Date(item.created_at).toLocaleString()}
          </Text>
          {item.status === 'open' && item.bid_count !== undefined && (
            <Text style={styles.bidCount}>
              {item.bid_count} {item.bid_count === 1 ? 'bid' : 'bids'}
            </Text>
          )}
        </View>
        
        {/* Cancel button for open or accepted trips */}
        {(item.status === 'open' || item.status === 'accepted') && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={(e) => {
              e.stopPropagation();
              handleCancelTrip(item);
            }}>
            <Text style={styles.cancelButtonText}>Cancel Trip</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
        <TouchableOpacity style={styles.postButton} onPress={handlePostRide}>
          <Text style={styles.postButtonText}>+ Post Ride</Text>
        </TouchableOpacity>
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No rides posted yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "Post Ride" to request a ride
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderRideItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchMyTrips}
        />
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  listContent: {
    padding: 16,
  },
  rideCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rideStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  acceptedStatus: {
    color: '#4CAF50',
  },
  cancelledStatus: {
    color: '#FF9800',
  },
  expiredStatus: {
    color: '#999',
  },
  rideDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  rideLocation: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  rideNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rideTime: {
    fontSize: 12,
    color: '#999',
  },
  bidCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF3B30',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

export default RiderRideBoardScreen;
