import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useData} from '../../contexts/DataContext';
import {Bid} from '../../models';

const ViewBidsScreen = ({route, navigation}: any) => {
  const {rideId} = route.params;
  const {getRideById, getBidsByRide, updateRideStatus, blockUser, reportUser, isUserBlocked} = useData();
  const ride = getRideById(rideId);
  const bids = getBidsByRide(rideId);

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  const handleAcceptBid = (bid: Bid) => {
    Alert.alert(
      'Accept Bid',
      `Accept this bid for $${bid.priceAmount.toFixed(2)}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Accept',
          onPress: () => {
            try {
              updateRideStatus(ride.id, 'ACCEPTED', bid.id);
              Alert.alert('Success', 'Bid accepted! The driver has been notified.', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to accept bid. Please try again.');
              console.error('Failed to accept bid:', error);
            }
          },
        },
      ],
    );
  };

  const handleBlockDriver = (driverId: string) => {
    Alert.alert(
      'Block Driver',
      'You will no longer see bids from this driver. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUser(driverId);
            Alert.alert('Blocked', 'You will no longer see bids from this driver.');
          },
        },
      ],
    );
  };

  const handleReportDriver = (driverId: string) => {
    Alert.prompt(
      'Report Driver',
      'Please provide a reason for this report:',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Report',
          onPress: (reason?: string) => {
            if (reason && reason.trim()) {
              reportUser(driverId, reason.trim());
              Alert.alert('Reported', 'Thank you for your report. We will review it.');
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const renderBidItem = ({item}: {item: Bid}) => {
    const isBlocked = isUserBlocked(item.driverId);
    
    return (
      <View style={styles.bidCard}>
        <View style={styles.bidHeader}>
          <Text style={styles.bidPrice}>${item.priceAmount.toFixed(2)}</Text>
          <Text style={styles.bidTime}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>

        {item.message && (
          <Text style={styles.bidMessage}>{item.message}</Text>
        )}

        {ride.status === 'OPEN' && !isBlocked && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptBid(item)}>
            <Text style={styles.acceptButtonText}>Accept This Bid</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bidActions}>
          <TouchableOpacity
            style={[styles.bidActionButton, styles.reportButton]}
            onPress={() => handleReportDriver(item.driverId)}>
            <Text style={styles.bidActionText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bidActionButton, styles.blockButton]}
            onPress={() => handleBlockDriver(item.driverId)}>
            <Text style={styles.bidActionText}>
              {isBlocked ? 'Blocked' : 'Block'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bids Received</Text>
        <Text style={styles.subtitle}>
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
        </Text>
      </View>

      <View style={styles.rideInfoCard}>
        <Text style={styles.rideInfoText}>From: {ride.pickupAddress}</Text>
        <Text style={styles.rideInfoText}>To: {ride.dropoffAddress}</Text>
        <Text style={styles.rideInfoText}>Distance: {ride.distanceKm} km</Text>
      </View>

      {bids.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No bids yet</Text>
          <Text style={styles.emptySubtext}>
            Drivers will submit bids with their prices
          </Text>
        </View>
      ) : (
        <>
          {ride.status === 'ACCEPTED' && (
            <View style={styles.acceptedBanner}>
              <Text style={styles.acceptedText}>
                ✓ Bid Accepted - Ride is confirmed
              </Text>
            </View>
          )}
          <FlatList
            data={bids}
            renderItem={renderBidItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        </>
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
    padding: 16,
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
  rideInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rideInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  acceptedBanner: {
    backgroundColor: '#4CAF50',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  acceptedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  bidCard: {
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
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bidPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  bidTime: {
    fontSize: 12,
    color: '#999',
  },
  bidMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bidActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bidActionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
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
  bidActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ViewBidsScreen;
