import React, {useState, useEffect} from 'react';
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
import {useSettings} from '../../contexts/SettingsContext';
import {calculateDistance, Coordinates} from '../../utils/distance';

const BidFormScreen = ({route, navigation}: any) => {
  const {rideId} = route.params;
  const {getRideById, createBid, getBidsByRide, getCurrentUser} = useData();
  const {userSettings} = useSettings();
  const ride = getRideById(rideId);
  const currentUser = getCurrentUser();
  
  // Check if driver has already bid
  const existingBids = getBidsByRide(rideId);
  const driverBid = existingBids.find(bid => bid.driverId === currentUser.id);

  const [priceAmount, setPriceAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deadheadDistance, setDeadheadDistance] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Request location permission and calculate deadhead distance
  const calculateDeadheadDistance = async () => {
    if (!ride?.pickupCoordinates) {
      return;
    }

    const pickupCoords = ride.pickupCoordinates;
    setIsLoadingLocation(true);

    try {
      // Request permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'DryverHub needs access to your location to calculate distance to pickup.',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required to calculate deadhead distance.');
          setIsLoadingLocation(false);
          return;
        }
      }

      // Get current location (one-time, no tracking)
      Geolocation.getCurrentPosition(
        position => {
          const driverLocation: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const distance = calculateDistance(driverLocation, pickupCoords);
          setDeadheadDistance(distance);
          setIsLoadingLocation(false);

          // Recalculate price with deadhead
          if (userSettings.driver.deadheadMileRate > 0 && userSettings.driver.tripMileRate > 0) {
            const deadheadCost = distance * userSettings.driver.deadheadMileRate;
            const tripCost = ride.distanceKm * userSettings.driver.tripMileRate;
            const totalPrice = (deadheadCost + tripCost).toFixed(2);
            setPriceAmount(totalPrice);
          }
        },
        error => {
          console.error('Location error:', error);
          Alert.alert('Location Error', 'Unable to get your location. You can still submit a bid manually.');
          setIsLoadingLocation(false);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 0}
      );
    } catch (error) {
      console.error('Permission error:', error);
      setIsLoadingLocation(false);
    }
  };

  // Auto-calculate suggested price based on saved rates
  useEffect(() => {
    if (ride) {
      const {tripMileRate, defaultBidNote} = userSettings.driver;
      
      // Only auto-calculate if rates are set (not 0)
      if (tripMileRate > 0) {
        // Initial calculation without deadhead
        const tripCost = ride.distanceKm * tripMileRate;
        const suggestedPrice = tripCost.toFixed(2);
        setPriceAmount(suggestedPrice);

        // Request location to calculate deadhead (if deadhead rate is set)
        if (userSettings.driver.deadheadMileRate > 0) {
          calculateDeadheadDistance();
        }
      }

      // Pre-fill default bid note if set
      if (defaultBidNote) {
        setMessage(defaultBidNote);
      }
    }
  }, [ride, userSettings.driver]);

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    // Validation
    const price = parseFloat(priceAmount);
    if (!priceAmount.trim() || isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price amount.');
      return;
    }

    setIsSubmitting(true);

    try {
      createBid({
        rideId: ride.id,
        driverId: currentUser.id,
        priceAmount: price,
        message: message.trim() || undefined,
      });

      Alert.alert('Success', 'Your bid has been submitted!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('RideBoardList');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit bid. Please try again.');
      console.error('Failed to create bid:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {driverBid && (
          <View style={styles.existingBidBanner}>
            <Text style={styles.existingBidTitle}>✓ You've Already Bid</Text>
            <Text style={styles.existingBidText}>
              Your bid: ${driverBid.priceAmount.toFixed(2)}
            </Text>
            {driverBid.message && (
              <Text style={styles.existingBidText}>
                Message: {driverBid.message}
              </Text>
            )}
            <Text style={styles.existingBidNote}>
              Submitting again will replace your previous bid
            </Text>
          </View>
        )}
        
        <View style={styles.rideInfoCard}>
          <Text style={styles.rideInfoTitle}>Ride Details</Text>
          <Text style={styles.rideInfoText}>
            From: {ride.pickupAddress}
          </Text>
          <Text style={styles.rideInfoText}>To: {ride.dropoffAddress}</Text>
          <Text style={styles.rideInfoText}>
            Trip Distance: {ride.distanceKm} km
          </Text>
          {isLoadingLocation && (
            <Text style={styles.loadingText}>📍 Getting your location...</Text>
          )}
          {deadheadDistance !== null && (
            <Text style={styles.rideInfoText}>
              Deadhead Distance: {deadheadDistance} km
            </Text>
          )}
          {userSettings.driver.tripMileRate > 0 && (
            <Text style={styles.calculationText}>
              {deadheadDistance !== null && userSettings.driver.deadheadMileRate > 0 ? (
                <>
                  Deadhead: {deadheadDistance} km × ${userSettings.driver.deadheadMileRate.toFixed(2)}/km = ${(deadheadDistance * userSettings.driver.deadheadMileRate).toFixed(2)}{'\n'}
                  Trip: {ride.distanceKm} km × ${userSettings.driver.tripMileRate.toFixed(2)}/km = ${(ride.distanceKm * userSettings.driver.tripMileRate).toFixed(2)}{'\n'}
                  Total: ${((deadheadDistance * userSettings.driver.deadheadMileRate) + (ride.distanceKm * userSettings.driver.tripMileRate)).toFixed(2)}
                </>
              ) : (
                `Trip: ${ride.distanceKm} km × $${userSettings.driver.tripMileRate.toFixed(2)}/km = $${(ride.distanceKm * userSettings.driver.tripMileRate).toFixed(2)}`
              )}
            </Text>
          )}
        </View>

        <Text style={styles.title}>Submit Your Bid</Text>
        <Text style={styles.subtitle}>
          {userSettings.driver.tripMileRate > 0 
            ? 'Price auto-calculated from your saved rates - edit as needed'
            : 'Set your price - no restrictions or suggestions'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Price ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your price"
            value={priceAmount}
            onChangeText={setPriceAmount}
            keyboardType="decimal-pad"
            editable={!isSubmitting}
          />
          <Text style={styles.hint}>
            You keep 100% of this amount. Set any price you want.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add a message for the rider..."
            value={message}
            onChangeText={setMessage}
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
            <Text style={styles.buttonText}>
              Submit Bid{priceAmount && !isNaN(parseFloat(priceAmount)) ? ` - $${parseFloat(priceAmount).toFixed(2)}` : ''}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          The rider will see your bid along with all other bids. They choose
          which bid to accept - no algorithms, no rankings.
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
  rideInfoCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  rideInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  rideInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
    fontStyle: 'italic',
  },
  calculationText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
    lineHeight: 18,
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
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
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
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  existingBidBanner: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  existingBidTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  existingBidText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  existingBidNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default BidFormScreen;
