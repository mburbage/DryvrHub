import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Platform } from 'react-native';

/**
 * ViewBidsScreen - Rider views all bids for their trip
 * 
 * RULES ENFORCED:
 * - All bids displayed equally (same styling)
 * - No sorting controls or price highlighting
 * - No recommendations or "best" labels
 * - Neutral verification indicators only
 * - Explicit manual selection required
 * - No time pressure or nudging
 */

interface BidData {
  id: string;
  driver_id: string;
  bid_amount: string;
  message: string | null;
  status: string;
  created_at: string;
  driver_context: {
    account_age_days: number;
    completed_trip_count: number;
    identity_verified: boolean;
    background_check_completed: boolean;
    vehicle_verified: boolean;
  };
}

const ViewBidsScreen = ({route, navigation}: any) => {
  const {rideId} = route.params;
  const {token} = useAuth();
  const [bids, setBids] = useState<BidData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  const API_BASE_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000' 
    : 'http://localhost:3000';

  useEffect(() => {
    fetchBids();
  }, [rideId]);

  const fetchBids = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${rideId}/bids`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }

      const data = await response.json();
      setBids(data);
    } catch (error) {
      console.error('Error fetching bids:', error);
      Alert.alert('Error', 'Failed to load bids');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBid = (bid: BidData) => {
    // RULE: Explicit confirmation required, no auto-accept
    Alert.alert(
      'Accept Bid',
      `Accept this bid for $${parseFloat(bid.bid_amount).toFixed(2)}?\n\nThis action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Accept',
          onPress: async () => {
            setIsAccepting(true);
            try {
              const response = await fetch(`${API_BASE_URL}/api/trips/${rideId}/accept-bid`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bid_id: bid.id }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to accept bid');
              }

              Alert.alert('Success', 'Bid accepted successfully!', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept bid');
            } finally {
              setIsAccepting(false);
            }
          },
        },
      ],
    );
  };

  // RULE: Neutral empty state, no pressure
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (bids.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No bids yet</Text>
        <Text style={styles.emptySubtext}>Check back later</Text>
      </View>
    );
  }

  const renderBid = ({item: bid}: {item: BidData}) => {
    const ctx = bid.driver_context;

    return (
      <View style={styles.bidCard}>
        {/* RULE: Price displayed plainly, no highlighting */}
        <View style={styles.bidHeader}>
          <Text style={styles.bidAmount}>${parseFloat(bid.bid_amount).toFixed(2)}</Text>
          <Text style={styles.bidDate}>
            {new Date(bid.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* RULE: Optional driver message */}
        {bid.message && (
          <Text style={styles.bidMessage}>{bid.message}</Text>
        )}

        {/* RULE: Neutral verification indicators only (no scores, no ratings) */}
        <View style={styles.verificationSection}>
          <Text style={styles.verificationTitle}>Driver Information</Text>
          
          <View style={styles.verificationRow}>
            <Text style={styles.verificationLabel}>Account age:</Text>
            <Text style={styles.verificationValue}>{ctx.account_age_days} days</Text>
          </View>

          <View style={styles.verificationRow}>
            <Text style={styles.verificationLabel}>Completed trips:</Text>
            <Text style={styles.verificationValue}>{ctx.completed_trip_count}</Text>
          </View>

          {/* RULE: Boolean verification flags only, no quality judgments */}
          <View style={styles.verificationFlags}>
            {ctx.identity_verified && (
              <View style={styles.verificationBadge}>
                <Text style={styles.badgeText}>✓ Identity Verified</Text>
              </View>
            )}
            {ctx.background_check_completed && (
              <View style={styles.verificationBadge}>
                <Text style={styles.badgeText}>✓ Background Check</Text>
              </View>
            )}
            {ctx.vehicle_verified && (
              <View style={styles.verificationBadge}>
                <Text style={styles.badgeText}>✓ Vehicle Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* RULE: Explicit accept button, same for all bids */}
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptBid(bid)}
          disabled={isAccepting || bid.status !== 'submitted'}
        >
          <Text style={styles.acceptButtonText}>
            {bid.status === 'submitted' ? 'Accept This Bid' : bid.status.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* RULE: No sorting controls, no "best" indicators */}
      <View style={styles.header}>
        <Text style={styles.title}>All Bids</Text>
        <Text style={styles.subtitle}>
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'} received
        </Text>
      </View>

      {/* RULE: All bid cards look the same */}
      <FlatList
        data={bids}
        renderItem={renderBid}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
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
  // RULE: All bid cards are identical - same size, color, layout
  bidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  // RULE: Price displayed plainly, no color emphasis
  bidAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  bidDate: {
    fontSize: 12,
    color: '#999',
  },
  bidMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  verificationSection: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  verificationLabel: {
    fontSize: 13,
    color: '#666',
  },
  verificationValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  verificationFlags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  // RULE: Verification badges are neutral indicators, no quality judgments
  verificationBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  // RULE: Accept button looks the same for all bids
  acceptButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ViewBidsScreen;
