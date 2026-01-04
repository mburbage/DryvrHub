import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {useSettings} from '../../contexts/SettingsContext';
import {useRole} from '../../contexts/RoleContext';
import {useData} from '../../contexts/DataContext';

const UserSettingsScreen = () => {
  const {userSettings, updateUserSettings} = useSettings();
  const {role} = useRole();
  const {
    getCurrentUser,
    getRiderProfile,
    getDriverProfile,
    getBlockedUsers,
    unblockUser,
    updateDriverProfile,
  } = useData();

  const currentUser = getCurrentUser();
  const riderProfile = getRiderProfile(currentUser.id);
  const driverProfile = getDriverProfile(currentUser.id);
  const blockedUserIds = getBlockedUsers();

  // Local state for rate input fields to allow typing decimal points
  const [deadheadRateText, setDeadheadRateText] = useState(
    userSettings.driver.deadheadMileRate.toString()
  );
  const [tripRateText, setTripRateText] = useState(
    userSettings.driver.tripMileRate.toString()
  );

  const handleUnblockUser = (userId: string) => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Unblock',
          onPress: () => {
            unblockUser(userId);
            Alert.alert('Unblocked', 'User has been unblocked.');
          },
        },
      ],
    );
  };

  const handleAddPhoto = () => {
    const currentPhotos = driverProfile?.vehicle?.photos || [];
    if (currentPhotos.length >= 3) {
      Alert.alert('Maximum Photos', 'You can only upload up to 3 vehicle photos.');
      return;
    }

    Alert.alert(
      'Add Vehicle Photo',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: () => {
            launchCamera(
              {
                mediaType: 'photo',
                maxWidth: 1024,
                maxHeight: 1024,
                quality: 0.8,
              },
              response => {
                if (response.didCancel) {
                  return;
                }
                if (response.errorCode) {
                  Alert.alert('Error', response.errorMessage || 'Failed to open camera');
                  return;
                }
                if (response.assets && response.assets[0]?.uri) {
                  const newPhotos = [...currentPhotos, response.assets[0].uri];
                  updateDriverProfile(currentUser.id, {
                    ...driverProfile?.vehicle,
                    make: driverProfile?.vehicle?.make || '',
                    model: driverProfile?.vehicle?.model || '',
                    year: driverProfile?.vehicle?.year || new Date().getFullYear(),
                    color: driverProfile?.vehicle?.color || '',
                    licensePlate: driverProfile?.vehicle?.licensePlate || '',
                    photos: newPhotos,
                  });
                }
              }
            );
          },
        },
        {
          text: 'Photo Library',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo',
                maxWidth: 1024,
                maxHeight: 1024,
                quality: 0.8,
              },
              response => {
                if (response.didCancel) {
                  return;
                }
                if (response.errorCode) {
                  Alert.alert('Error', response.errorMessage || 'Failed to open library');
                  return;
                }
                if (response.assets && response.assets[0]?.uri) {
                  const newPhotos = [...currentPhotos, response.assets[0].uri];
                  updateDriverProfile(currentUser.id, {
                    ...driverProfile?.vehicle,
                    make: driverProfile?.vehicle?.make || '',
                    model: driverProfile?.vehicle?.model || '',
                    year: driverProfile?.vehicle?.year || new Date().getFullYear(),
                    color: driverProfile?.vehicle?.color || '',
                    licensePlate: driverProfile?.vehicle?.licensePlate || '',
                    photos: newPhotos,
                  });
                }
              }
            );
          },
        },
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const currentPhotos = driverProfile?.vehicle?.photos || [];
            const newPhotos = currentPhotos.filter((_, i) => i !== index);
            updateDriverProfile(currentUser.id, {
              ...driverProfile?.vehicle,
              make: driverProfile?.vehicle?.make || '',
              model: driverProfile?.vehicle?.model || '',
              year: driverProfile?.vehicle?.year || new Date().getFullYear(),
              color: driverProfile?.vehicle?.color || '',
              licensePlate: driverProfile?.vehicle?.licensePlate || '',
              photos: newPhotos,
            });
          },
        },
      ]
    );
  };

  const handleStartIdentityVerification = () => {
    Alert.alert(
      'Identity Verification',
      'You will be directed to verify your identity using a government-issued ID and selfie. This process is secure and managed by Persona.\n\nYou must be 18 or older to drive on DryverHub.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Continue',
          onPress: () => {
            // TODO: Call backend to create Persona inquiry session
            // TODO: Launch Persona SDK with session token
            Alert.alert(
              'Coming Soon',
              'Identity verification will be integrated with Persona API in production.'
            );
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
            // TODO: Call backend to create Checkr candidate
            // TODO: Open Checkr consent/disclosure flow
            Alert.alert(
              'Coming Soon',
              'Background check will be integrated with Checkr API in production.'
            );
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
          text: 'Coming Soon',
          onPress: () => {
            Alert.alert(
              'Coming Soon',
              'Document upload will be available in the next update.'
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Read-Only Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Account Created</Text>
          <Text style={styles.value}>
            {new Date(currentUser.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Account Verified</Text>
          <Text style={styles.value}>
            {currentUser.isVerified ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Completed Rides</Text>
          <Text style={styles.value}>
            {(riderProfile?.completedRidesCount || 0) + (driverProfile?.completedRidesCount || 0)}
          </Text>
        </View>
      </View>

      {/* Rider Settings (visible only when role is RIDER) */}
      {role === 'RIDER' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rider Preferences</Text>
          <Text style={styles.description}>
            Optional defaults for form pre-fill only
          </Text>

          <Text style={styles.inputLabel}>Default Pickup Location</Text>
          <TextInput
            style={styles.textInput}
            value={userSettings.rider.defaultPickupLocation}
            onChangeText={text =>
              updateUserSettings({
                rider: {...userSettings.rider, defaultPickupLocation: text},
              })
            }
            placeholder="e.g., 123 Main St, City"
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Default Ride Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={userSettings.rider.defaultRideNotes}
            onChangeText={text =>
              updateUserSettings({
                rider: {...userSettings.rider, defaultRideNotes: text},
              })
            }
            placeholder="e.g., Please call when you arrive"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      {/* Driver Settings (visible only when role is DRIVER) */}
      {role === 'DRIVER' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Preferences</Text>
          <Text style={styles.description}>
            Manual controls - no automatic tracking
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>Bidding Enabled</Text>
            <Switch
              value={userSettings.driver.biddingEnabled}
              onValueChange={value =>
                updateUserSettings({
                  driver: {...userSettings.driver, biddingEnabled: value},
                })
              }
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Notify on New Rides</Text>
            <Switch
              value={userSettings.driver.notifyOnNewRides}
              onValueChange={value =>
                updateUserSettings({
                  driver: {...userSettings.driver, notifyOnNewRides: value},
                })
              }
            />
          </View>

          <Text style={styles.inputLabel}>Default Bid Note</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={userSettings.driver.defaultBidNote}
            onChangeText={text =>
              updateUserSettings({
                driver: {...userSettings.driver, defaultBidNote: text},
              })
            }
            placeholder="e.g., Clean car, safe driver"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>Deadhead Mile Rate ($)</Text>
          <Text style={styles.helpText}>
            Rate per mile for empty miles (driving to pickup location)
          </Text>
          <TextInput
            style={styles.textInput}
            value={deadheadRateText}
            onChangeText={text => {
              setDeadheadRateText(text);
              const value = parseFloat(text);
              if (!isNaN(value)) {
                updateUserSettings({
                  driver: {...userSettings.driver, deadheadMileRate: value},
                });
              }
            }}
            onBlur={() => {
              // Format on blur if valid number
              const value = parseFloat(deadheadRateText);
              if (!isNaN(value)) {
                setDeadheadRateText(value.toFixed(2));
              } else {
                setDeadheadRateText('0.00');
                updateUserSettings({
                  driver: {...userSettings.driver, deadheadMileRate: 0},
                });
              }
            }}
            placeholder="e.g., 1.50"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />

          <Text style={styles.inputLabel}>Trip Mile Rate ($)</Text>
          <Text style={styles.helpText}>
            Rate per mile for trip miles (with passenger)
          </Text>
          <TextInput
            style={styles.textInput}
            value={tripRateText}
            onChangeText={text => {
              setTripRateText(text);
              const value = parseFloat(text);
              if (!isNaN(value)) {
                updateUserSettings({
                  driver: {...userSettings.driver, tripMileRate: value},
                });
              }
            }}
            onBlur={() => {
              // Format on blur if valid number
              const value = parseFloat(tripRateText);
              if (!isNaN(value)) {
                setTripRateText(value.toFixed(2));
              } else {
                setTripRateText('0.00');
                updateUserSettings({
                  driver: {...userSettings.driver, tripMileRate: 0},
                });
              }
            }}
            placeholder="e.g., 2.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />

          <Text style={styles.inputLabel}>Payment Types Accepted</Text>
          <Text style={styles.helpText}>
            Select all payment methods you accept
          </Text>
          {['Cash', 'Apple Pay', 'Card', 'Venmo'].map(paymentType => {
            const isSelected = userSettings.driver.acceptedPaymentTypes.includes(paymentType);
            return (
              <TouchableOpacity
                key={paymentType}
                style={styles.checkboxRow}
                onPress={() => {
                  const currentTypes = userSettings.driver.acceptedPaymentTypes;
                  const updatedTypes = isSelected
                    ? currentTypes.filter(t => t !== paymentType)
                    : [...currentTypes, paymentType];
                  updateUserSettings({
                    driver: {...userSettings.driver, acceptedPaymentTypes: updatedTypes},
                  });
                }}>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>{paymentType}</Text>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.inputLabel}>Driver Verification</Text>
          <Text style={styles.helpText}>
            Complete verifications to display status to riders. Verification does not affect bid order or pricing.
          </Text>

          {/* Identity Verification */}
          <View style={styles.verificationItem}>
            <View style={styles.verificationHeader}>
              <Text style={styles.verificationTitle}>Identity Verification</Text>
              <View
                style={[
                  styles.verificationBadge,
                  driverProfile?.identityVerified && styles.verificationBadgeVerified,
                ]}>
                <Text
                  style={[
                    styles.verificationBadgeText,
                    driverProfile?.identityVerified && styles.verificationBadgeTextVerified,
                  ]}>
                  {driverProfile?.identityVerified ? '✓ Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
            <Text style={styles.verificationDescription}>
              Confirm you are 18+ with government-issued ID
            </Text>
            {!driverProfile?.identityVerified && (
              <TouchableOpacity
                style={styles.verificationButton}
                onPress={handleStartIdentityVerification}>
                <Text style={styles.verificationButtonText}>Start Verification</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Background Check */}
          <View style={styles.verificationItem}>
            <View style={styles.verificationHeader}>
              <Text style={styles.verificationTitle}>Background Check</Text>
              <View
                style={[
                  styles.verificationBadge,
                  driverProfile?.backgroundCheckStatus === 'passed' &&
                    styles.verificationBadgeVerified,
                ]}>
                <Text
                  style={[
                    styles.verificationBadgeText,
                    driverProfile?.backgroundCheckStatus === 'passed' &&
                      styles.verificationBadgeTextVerified,
                  ]}>
                  {driverProfile?.backgroundCheckStatus === 'passed'
                    ? '✓ Completed'
                    : 'Not Completed'}
                </Text>
              </View>
            </View>
            <Text style={styles.verificationDescription}>
              Criminal background check (you pay fees directly)
            </Text>
            {driverProfile?.backgroundCheckStatus !== 'passed' && (
              <TouchableOpacity
                style={styles.verificationButton}
                onPress={handleStartBackgroundCheck}>
                <Text style={styles.verificationButtonText}>Start Check</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle Verification */}
          <View style={styles.verificationItem}>
            <View style={styles.verificationHeader}>
              <Text style={styles.verificationTitle}>Vehicle Verification</Text>
              <View
                style={[
                  styles.verificationBadge,
                  driverProfile?.vehicleVerified && styles.verificationBadgeVerified,
                ]}>
                <Text
                  style={[
                    styles.verificationBadgeText,
                    driverProfile?.vehicleVerified && styles.verificationBadgeTextVerified,
                  ]}>
                  {driverProfile?.vehicleVerified ? '✓ Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
            <Text style={styles.verificationDescription}>
              Upload NC DMV registration and insurance proof
            </Text>
            {!driverProfile?.vehicleVerified && (
              <TouchableOpacity
                style={styles.verificationButton}
                onPress={handleStartVehicleVerification}>
                <Text style={styles.verificationButtonText}>Upload Documents</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.verificationDisclaimer}>
            Verification confirms documents only. It does not guarantee safety or driving quality.
          </Text>

          <Text style={styles.inputLabel}>Vehicle Information</Text>
          <Text style={styles.helpText}>
            Your vehicle details (optional)
          </Text>
          
          <Text style={styles.subLabel}>Make</Text>
          <TextInput
            style={styles.textInput}
            value={driverProfile?.vehicle?.make || ''}
            onChangeText={text =>
              updateDriverProfile(currentUser.id, {
                ...driverProfile?.vehicle,
                make: text,
                model: driverProfile?.vehicle?.model || '',
                year: driverProfile?.vehicle?.year || new Date().getFullYear(),
                color: driverProfile?.vehicle?.color || '',
                licensePlate: driverProfile?.vehicle?.licensePlate || '',
                photos: driverProfile?.vehicle?.photos || [],
              })
            }
            placeholder="e.g., Toyota"
            placeholderTextColor="#999"
          />

          <Text style={styles.subLabel}>Model</Text>
          <TextInput
            style={styles.textInput}
            value={driverProfile?.vehicle?.model || ''}
            onChangeText={text =>
              updateDriverProfile(currentUser.id, {
                ...driverProfile?.vehicle,
                make: driverProfile?.vehicle?.make || '',
                model: text,
                year: driverProfile?.vehicle?.year || new Date().getFullYear(),
                color: driverProfile?.vehicle?.color || '',
                licensePlate: driverProfile?.vehicle?.licensePlate || '',
                photos: driverProfile?.vehicle?.photos || [],
              })
            }
            placeholder="e.g., Camry"
            placeholderTextColor="#999"
          />

          <Text style={styles.subLabel}>Year</Text>
          <TextInput
            style={styles.textInput}
            value={driverProfile?.vehicle?.year?.toString() || ''}
            onChangeText={text =>
              updateDriverProfile(currentUser.id, {
                ...driverProfile?.vehicle,
                make: driverProfile?.vehicle?.make || '',
                model: driverProfile?.vehicle?.model || '',
                year: parseInt(text) || new Date().getFullYear(),
                color: driverProfile?.vehicle?.color || '',
                licensePlate: driverProfile?.vehicle?.licensePlate || '',
                photos: driverProfile?.vehicle?.photos || [],
              })
            }
            placeholder="e.g., 2020"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />

          <Text style={styles.subLabel}>Color</Text>
          <TextInput
            style={styles.textInput}
            value={driverProfile?.vehicle?.color || ''}
            onChangeText={text =>
              updateDriverProfile(currentUser.id, {
                ...driverProfile?.vehicle,
                make: driverProfile?.vehicle?.make || '',
                model: driverProfile?.vehicle?.model || '',
                year: driverProfile?.vehicle?.year || new Date().getFullYear(),
                color: text,
                licensePlate: driverProfile?.vehicle?.licensePlate || '',
                photos: driverProfile?.vehicle?.photos || [],
              })
            }
            placeholder="e.g., Black"
            placeholderTextColor="#999"
          />

          <Text style={styles.subLabel}>License Plate</Text>
          <TextInput
            style={styles.textInput}
            value={driverProfile?.vehicle?.licensePlate || ''}
            onChangeText={text =>
              updateDriverProfile(currentUser.id, {
                ...driverProfile?.vehicle,
                make: driverProfile?.vehicle?.make || '',
                model: driverProfile?.vehicle?.model || '',
                year: driverProfile?.vehicle?.year || new Date().getFullYear(),
                color: driverProfile?.vehicle?.color || '',
                licensePlate: text,
                photos: driverProfile?.vehicle?.photos || [],
              })
            }
            placeholder="e.g., ABC1234"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />

          <Text style={styles.inputLabel}>Vehicle Photos</Text>
          <Text style={styles.helpText}>
            Upload up to 3 photos of your vehicle (optional)
          </Text>
          
          <View style={styles.photoGrid}>
            {(driverProfile?.vehicle?.photos || []).map((photoUri, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{uri: photoUri}} style={styles.vehiclePhoto} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}>
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {(driverProfile?.vehicle?.photos || []).length < 3 && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}>
                <Text style={styles.addPhotoText}>+</Text>
                <Text style={styles.addPhotoLabel}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Blocked Users */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocked Users</Text>
        {blockedUserIds.length === 0 ? (
          <Text style={styles.emptyText}>No blocked users</Text>
        ) : (
          blockedUserIds.map(userId => (
            <View key={userId} style={styles.blockedUserRow}>
              <Text style={styles.blockedUserId}>User ID: {userId}</Text>
              <TouchableOpacity
                style={styles.unblockButton}
                onPress={() => handleUnblockUser(userId)}>
                <Text style={styles.unblockButtonText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#000',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  blockedUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  blockedUserId: {
    fontSize: 14,
    color: '#000',
  },
  unblockButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  vehiclePhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  addPhotoText: {
    fontSize: 32,
    color: '#007AFF',
    fontWeight: '300',
  },
  addPhotoLabel: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  verificationItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  verificationBadge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  verificationBadgeVerified: {
    backgroundColor: '#e8f5e9',
  },
  verificationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  verificationBadgeTextVerified: {
    color: '#2e7d32',
  },
  verificationDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  verificationButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  verificationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationDisclaimer: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
});

export default UserSettingsScreen;
