import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {useData} from '../../contexts/DataContext';
import {calculateDistanceFromAddresses} from '../../utils/distance';
import {Coordinates} from '../../utils/distance';

const PostRideScreen = ({navigation}: any) => {
  const {createRide} = useData();
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [riderLocation, setRiderLocation] = useState<Coordinates | null>(null);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  const verifyRiderLocation = async (): Promise<boolean> => {
    setIsVerifyingLocation(true);

    try {
      // Request permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'DryverHub needs to verify your location to post a ride.',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required to verify your location.');
          setIsVerifyingLocation(false);
          return false;
        }
      }

      // Get current location (one-time verification)
      return new Promise((resolve) => {
        Geolocation.getCurrentPosition(
          position => {
            const location: Coordinates = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setRiderLocation(location);
            setIsVerifyingLocation(false);
            resolve(true);
          },
          error => {
            console.error('Location error:', error);
            Alert.alert(
              'Location Verification Failed',
              'Unable to verify your location. Please ensure location services are enabled.',
              [
                {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
                {text: 'Retry', onPress: async () => {
                  const result = await verifyRiderLocation();
                  resolve(result);
                }},
              ]
            );
            setIsVerifyingLocation(false);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 0}
        );
      });
    } catch (error) {
      console.error('Permission error:', error);
      setIsVerifyingLocation(false);
      return false;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Missing Information', 'Please enter both pickup and dropoff addresses.');
      return;
    }

    if (!pickupTime.trim()) {
      Alert.alert('Missing Information', 'Please enter pickup time (e.g., "2:30 PM" or "14:30").');
      return;
    }

    if (!estimatedDuration.trim() || isNaN(parseFloat(estimatedDuration))) {
      Alert.alert('Invalid Duration', 'Please enter estimated duration in minutes.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify rider location first
      const locationVerified = await verifyRiderLocation();
      if (!locationVerified) {
        setIsSubmitting(false);
        return;
      }

      // Calculate distance from addresses (one-time only)
      const {distanceKm, pickupCoordinates, dropoffCoordinates} =
        await calculateDistanceFromAddresses(
          pickupAddress.trim(),
          dropoffAddress.trim(),
        );

      // Parse pickup time (simple parse - in production would use date picker)
      const pickupDateTime = new Date();
      // Set to today + parsed time (simplified - just add hours for demo)
      const hoursMatch = pickupTime.match(/(\d+)/);
      if (hoursMatch) {
        pickupDateTime.setHours(parseInt(hoursMatch[1], 10));
      }

      // Mock rider ID - will come from auth later
      const riderId = 'rider_001';

      createRide({
        riderId,
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        pickupCoordinates,
        dropoffCoordinates,
        distanceKm,
        pickupTime: pickupDateTime,
        estimatedDuration: parseFloat(estimatedDuration),
        notes: notes.trim() || undefined,
        status: 'OPEN',
      });

      Alert.alert('Success', 'Your ride request has been posted!', [
        {
          text: 'OK',
          onPress: () => {
            // Clear form
            setPickupAddress('');
            setDropoffAddress('');
            setPickupTime('');
            setEstimatedDuration('');
            setNotes('');
            setRiderLocation(null);
            // Navigate back to ride board
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to post ride. Please try again.');
      console.error('Failed to create ride:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={styles.title}>Post a Ride Request</Text>
        <Text style={styles.subtitle}>
          Drivers will submit bids with their prices
        </Text>

        {riderLocation && (
          <View style={styles.locationVerifiedBanner}>
            <Text style={styles.locationVerifiedText}>
              ✓ Location Verified
            </Text>
          </View>
        )}

        {isVerifyingLocation && (
          <View style={styles.locationVerifyingBanner}>
            <ActivityIndicator size="small" color="#FF9800" />
            <Text style={styles.locationVerifyingText}>
              Verifying your location...
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pickup Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter pickup location"
            value={pickupAddress}
            onChangeText={setPickupAddress}
            autoCapitalize="words"
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dropoff Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter destination"
            value={dropoffAddress}
            onChangeText={setDropoffAddress}
            autoCapitalize="words"
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pickup Time</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2:30 PM or 14:30"
            value={pickupTime}
            onChangeText={setPickupTime}
            editable={!isSubmitting}
          />
          <Text style={styles.hint}>
            When you need to be picked up
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estimated Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 45"
            value={estimatedDuration}
            onChangeText={setEstimatedDuration}
            keyboardType="numeric"
            editable={!isSubmitting}
          />
          <Text style={styles.hint}>
            Approximate trip duration
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional details..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Post Ride Request</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Once posted, drivers can submit bids with their prices. You'll be able
          to review all bids and choose the one you prefer.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  locationVerifiedBanner: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  locationVerifiedText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationVerifyingBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  locationVerifyingText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
    lineHeight: 20,
  },
});

export default PostRideScreen;
