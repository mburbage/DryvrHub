import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {useData} from '../../contexts/DataContext';

/**
 * DRIVER VERIFICATION SCREEN
 * 
 * PURPOSE: Allow drivers to complete three types of verification:
 * 1. Identity (Persona API - automated)
 * 2. Background check (Checkr API - automated, driver-paid)
 * 3. Vehicle (NC DMV documents - manual review)
 * 
 * RULES:
 * - Binary status only: passed / not completed
 * - NO scores, rankings, or tiers
 * - Does NOT affect bid order, visibility, or pricing
 * - Platform does NOT pay for verification
 * - Driver pays all costs directly
 */

const DriverVerificationScreen = ({navigation}: any) => {
  const {getCurrentUser, getDriverProfile} = useData();
  const currentUser = getCurrentUser();
  const driverProfile = getDriverProfile(currentUser.id);

  const [isProcessing, setIsProcessing] = useState(false);

  // Check if driver is fully verified
  const isFullyVerified =
    driverProfile?.identityVerified &&
    driverProfile?.backgroundCheckStatus === 'passed' &&
    driverProfile?.vehicleVerified;

  const handleStartIdentityVerification = () => {
    Alert.alert(
      'Identity Verification',
      'You will be directed to verify your identity using a government-issued ID and selfie. This process is secure and managed by Persona.\n\nYou must be 18 or older to drive on DryverHub.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Continue',
          onPress: () => {
            setIsProcessing(true);
            // TODO: Call backend to create Persona inquiry session
            // TODO: Launch Persona SDK with session token
            // For now, show placeholder
            setTimeout(() => {
              setIsProcessing(false);
              Alert.alert(
                'Coming Soon',
                'Identity verification will be integrated with Persona API in production.'
              );
            }, 500);
          },
        },
      ]
    );
  };

  const handleStartBackgroundCheck = () => {
    Alert.alert(
      'Background Check',
      'You will complete a criminal background check through Checkr.\n\n' +
        'IMPORTANT:\n' +
        '• Any applicable fee is paid by you directly\n' +
        '• The platform does not process payment\n' +
        '• Results are pass/fail only\n\n' +
        'Background checks confirm criminal history only. ' +
        'Verification does not guarantee safety or driving quality.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Continue',
          onPress: () => {
            setIsProcessing(true);
            // TODO: Call backend to create Checkr candidate
            // TODO: Open Checkr consent/disclosure flow
            // For now, show placeholder
            setTimeout(() => {
              setIsProcessing(false);
              Alert.alert(
                'Coming Soon',
                'Background check will be integrated with Checkr API in production.'
              );
            }, 500);
          },
        },
      ]
    );
  };

  const handleStartVehicleVerification = () => {
    Alert.alert(
      'Vehicle Verification',
      'To verify your vehicle, you will need:\n\n' +
        '1. NC DMV vehicle registration\n' +
        '2. Proof of current insurance\n' +
        '3. Vehicle photos (front + side)\n\n' +
        'Documents will be manually reviewed by our team. ' +
        'You are responsible for any DMV fees.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Get NC DMV Documents',
          onPress: () => {
            Linking.openURL('https://www.ncdot.gov/dmv/');
          },
        },
        {
          text: 'Upload Documents',
          onPress: () => {
            navigation.navigate('VehicleDocumentUpload');
          },
        },
      ]
    );
  };

  const renderVerificationItem = (
    title: string,
    description: string,
    status: 'passed' | 'not_completed' | 'rejected',
    onPress: () => void
  ) => {
    const statusText =
      status === 'passed'
        ? 'Verified'
        : status === 'rejected'
        ? 'Not Completed'
        : 'Not Completed';
    const statusColor =
      status === 'passed' ? '#34C759' : status === 'rejected' ? '#FF3B30' : '#999';
    const buttonText = status === 'passed' ? 'Completed' : 'Start Verification';
    const buttonDisabled = status === 'passed';

    return (
      <View style={styles.verificationCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>{description}</Text>
        <TouchableOpacity
          style={[styles.actionButton, buttonDisabled && styles.actionButtonDisabled]}
          onPress={onPress}
          disabled={buttonDisabled || isProcessing}>
          <Text
            style={[
              styles.actionButtonText,
              buttonDisabled && styles.actionButtonTextDisabled,
            ]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Verification</Text>
        <Text style={styles.headerDescription}>
          Complete all three verifications to display verification status to riders.
        </Text>
        {isFullyVerified && (
          <View style={styles.fullyVerifiedBanner}>
            <Text style={styles.fullyVerifiedText}>✓ All Verifications Complete</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        {renderVerificationItem(
          'Identity Verification',
          'Confirm you are 18+ with a government-issued ID and selfie. Automated via Persona.',
          driverProfile?.identityVerified ? 'passed' : 'not_completed',
          handleStartIdentityVerification
        )}

        {renderVerificationItem(
          'Criminal Background Check',
          'Complete a criminal background check through Checkr. You pay any applicable fees directly.',
          driverProfile?.backgroundCheckStatus || 'not_completed',
          handleStartBackgroundCheck
        )}

        {renderVerificationItem(
          'Vehicle Verification',
          'Upload NC DMV registration, insurance proof, and vehicle photos for manual review.',
          driverProfile?.vehicleVerified ? 'passed' : 'not_completed',
          handleStartVehicleVerification
        )}
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Important Information</Text>
        <Text style={styles.disclaimerText}>
          • Verification confirms submitted documents only{'\n'}
          • Does not guarantee safety or driving quality{'\n'}
          • Drivers are independent operators{'\n'}
          • The platform does not conduct or pay for background checks or vehicle
          record requests{'\n'}
          • Verification does not affect bid order, visibility, or pricing
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  fullyVerifiedBanner: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  fullyVerifiedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  verificationCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextDisabled: {
    color: '#999',
  },
  disclaimer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});

export default DriverVerificationScreen;
