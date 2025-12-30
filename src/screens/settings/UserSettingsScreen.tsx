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
} from 'react-native';
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
});

export default UserSettingsScreen;
