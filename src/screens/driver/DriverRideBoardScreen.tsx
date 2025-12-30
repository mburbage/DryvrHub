import React, {useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {useData} from '../../contexts/DataContext';
import {useSettings} from '../../contexts/SettingsContext';
import {Ride} from '../../models';

const DriverRideBoardScreen = ({navigation}: any) => {
  const {getOpenRides, expireStaleRides, getBidsByDriver, getCurrentUser} = useData();
  const {userSettings} = useSettings();
  const openRides = getOpenRides();
  const currentUser = getCurrentUser();
  const myBids = getBidsByDriver(currentUser.id);

  // Check for expired rides on mount and periodically
  useEffect(() => {
    expireStaleRides();
    const interval = setInterval(expireStaleRides, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleRidePress = (ride: Ride) => {
    navigation.navigate('RideDetails', {rideId: ride.id});
  };

  const renderRideItem = ({item}: {item: Ride}) => {
    const timeAgo = getTimeAgo(new Date(item.createdAt));
    
    // Calculate estimated price based on user's trip rate
    const estimatedPrice = userSettings.driver.tripMileRate > 0
      ? (item.distanceKm * userSettings.driver.tripMileRate).toFixed(2)
      : null;
    
    // Check if driver has already bid on this ride
    const hasBid = myBids.some(bid => bid.rideId === item.id);

    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => handleRidePress(item)}>
        {hasBid && (
          <View style={styles.bidBadge}>
            <Text style={styles.bidBadgeText}>✓ You've Bid</Text>
          </View>
        )}
        <View style={styles.rideHeader}>
          {estimatedPrice ? (
            <Text style={styles.estimatedPrice}>${estimatedPrice}</Text>
          ) : (
            <Text style={styles.rideDistance}>{item.distanceKm} km</Text>
          )}
          <Text style={styles.rideTime}>{timeAgo}</Text>
        </View>
        <Text style={styles.rideDistance}>{item.distanceKm} km trip</Text>
        <Text style={styles.rideLocation}>From: {item.pickupAddress}</Text>
        <Text style={styles.rideLocation}>To: {item.dropoffAddress}</Text>
        {item.notes && (
          <Text style={styles.rideNotes} numberOfLines={2}>
            Note: {item.notes}
          </Text>
        )}
        <Text style={styles.tapHint}>Tap to view details and bid</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Rides</Text>
        <Text style={styles.subtitle}>
          {openRides.length} {openRides.length === 1 ? 'ride' : 'rides'} available
        </Text>
      </View>

      {openRides.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No rides available</Text>
          <Text style={styles.emptySubtext}>
            Check back soon for new ride requests
          </Text>
        </View>
      ) : (
        <FlatList
          data={openRides}
          renderItem={renderRideItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  rideDistance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  estimatedPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
  },
  rideTime: {
    fontSize: 14,
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
  bidBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  bidBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default DriverRideBoardScreen;
