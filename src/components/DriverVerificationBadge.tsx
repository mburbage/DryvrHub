import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {DriverProfile} from '../models';

/**
 * DRIVER VERIFICATION BADGE COMPONENT
 * 
 * PURPOSE: Display neutral verification status to riders
 * 
 * RULES:
 * - Shows ONLY: "Identity verified", "Background check completed", "Vehicle verified"
 * - NO comparative language (safer, trusted, recommended)
 * - NO dates compared between drivers
 * - NO badges or colors implying rank or quality
 * - Display is informational only
 * - Does NOT affect pricing, bidding, or visibility
 */

interface Props {
  driverProfile: DriverProfile;
  compact?: boolean; // If true, show inline badges only
}

const DriverVerificationBadge: React.FC<Props> = ({driverProfile, compact = false}) => {
  const {identityVerified, backgroundCheckStatus, vehicleVerified} = driverProfile;

  const backgroundCheckCompleted = backgroundCheckStatus === 'passed';

  // Don't show anything if no verifications are complete
  if (!identityVerified && !backgroundCheckCompleted && !vehicleVerified) {
    return null;
  }

  if (compact) {
    // Compact mode: show small inline badges
    return (
      <View style={styles.compactContainer}>
        {identityVerified && (
          <View style={styles.compactBadge}>
            <Text style={styles.compactBadgeText}>✓ ID</Text>
          </View>
        )}
        {backgroundCheckCompleted && (
          <View style={styles.compactBadge}>
            <Text style={styles.compactBadgeText}>✓ Background</Text>
          </View>
        )}
        {vehicleVerified && (
          <View style={styles.compactBadge}>
            <Text style={styles.compactBadgeText}>✓ Vehicle</Text>
          </View>
        )}
      </View>
    );
  }

  // Full mode: show detailed list
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Status</Text>
      <View style={styles.list}>
        <View style={styles.item}>
          <Text style={styles.itemText}>
            {identityVerified ? '✓' : '○'} Identity verified
          </Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemText}>
            {backgroundCheckCompleted ? '✓' : '○'} Criminal background check completed
          </Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemText}>
            {vehicleVerified ? '✓' : '○'} Vehicle verified
          </Text>
        </View>
      </View>
      <Text style={styles.disclaimer}>
        Verification confirms submitted documents only. It does not guarantee safety or
        driving quality.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  list: {
    marginBottom: 12,
  },
  item: {
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compactBadge: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  compactBadgeText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '500',
  },
});

export default DriverVerificationBadge;
