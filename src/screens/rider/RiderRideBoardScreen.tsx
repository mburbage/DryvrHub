import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import {useData} from '../../contexts/DataContext';
import {Ride} from '../../models';

const RiderRideBoardScreen = ({navigation}: any) => {
  const {rides, getBidsByRide} = useData();

  // Mock rider ID - will come from auth later
  const riderId = 'rider_001';
  const myRides = rides.filter(ride => ride.riderId === riderId);

  const handlePostRide = () => {
    navigation.navigate('PostRide');
  };

  const handleViewBids = (rideId: string) => {
    navigation.navigate('ViewBids', {rideId});
  };

  const handleViewAcceptedRide = (rideId: string) => {
    navigation.navigate('AcceptedRide', {rideId});
  };

  const renderRideItem = ({item}: {item: Ride}) => {
    const bidsCount = getBidsByRide(item.id).length;
    const isAcceptedOrCompleted = item.status === 'ACCEPTED' || item.status === 'COMPLETED';

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
            item.status === 'COMPLETED' && styles.completedStatus,
            item.status === 'ACCEPTED' && styles.acceptedStatus,
          ]}>
            {item.status}
          </Text>
          <Text style={styles.rideDistance}>{item.distanceKm} km</Text>
        </View>
        <Text style={styles.rideLocation}>From: {item.pickupAddress}</Text>
        <Text style={styles.rideLocation}>To: {item.dropoffAddress}</Text>
        {item.notes && <Text style={styles.rideNotes}>{item.notes}</Text>}
        <View style={styles.rideFooter}>
          <Text style={styles.rideTime}>
            Posted: {new Date(item.createdAt).toLocaleString()}
          </Text>
          {item.status === 'OPEN' && (
            <Text style={styles.bidCount}>
              {bidsCount} {bidsCount === 1 ? 'bid' : 'bids'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
        <TouchableOpacity style={styles.postButton} onPress={handlePostRide}>
          <Text style={styles.postButtonText}>+ Post Ride</Text>
        </TouchableOpacity>
      </View>

      {myRides.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No rides posted yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "Post Ride" to request a ride
          </Text>
        </View>
      ) : (
        <FlatList
          data={myRides}
          renderItem={renderRideItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
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
  completedStatus: {
    color: '#666',
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
});

export default RiderRideBoardScreen;
