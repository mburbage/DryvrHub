import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useData} from '../../contexts/DataContext';

/**
 * VEHICLE DOCUMENT UPLOAD SCREEN
 * 
 * PURPOSE: Upload NC DMV registration, insurance proof, and vehicle photos
 * 
 * RULES:
 * - Documents uploaded for manual review
 * - Driver pays any DMV fees directly
 * - Platform does NOT process payment
 * - VIN not stored beyond review window
 * - Link to NC DMV website for obtaining documents
 * 
 * REQUIRED DOCUMENTS:
 * 1. NC DMV vehicle registration (PDF/image)
 * 2. Proof of insurance (PDF/image)
 * 3. Vehicle photos (front + side)
 */

const VehicleDocumentUploadScreen = ({navigation}: any) => {
  const {getCurrentUser} = useData();
  const currentUser = getCurrentUser();

  const [registrationDoc, setRegistrationDoc] = useState<string | null>(null);
  const [insuranceDoc, setInsuranceDoc] = useState<string | null>(null);
  const [insuranceExpirationDate, setInsuranceExpirationDate] = useState('');
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);

  const handleSelectDocument = (docType: 'registration' | 'insurance') => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to select document');
          return;
        }
        if (response.assets && response.assets[0]?.uri) {
          if (docType === 'registration') {
            setRegistrationDoc(response.assets[0].uri);
          } else {
            setInsuranceDoc(response.assets[0].uri);
          }
        }
      }
    );
  };

  const handleAddVehiclePhoto = () => {
    if (vehiclePhotos.length >= 2) {
      Alert.alert('Maximum Photos', 'You can upload up to 2 vehicle photos (front + side).');
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to select photo');
          return;
        }
        if (response.assets && response.assets[0]?.uri) {
          setVehiclePhotos([...vehiclePhotos, response.assets[0].uri]);
        }
      }
    );
  };

  const handleRemovePhoto = (index: number) => {
    setVehiclePhotos(vehiclePhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (!registrationDoc) {
      Alert.alert('Missing Document', 'Please upload your NC DMV registration.');
      return;
    }
    if (!insuranceDoc) {
      Alert.alert('Missing Document', 'Please upload your proof of insurance.');
      return;
    }
    if (!insuranceExpirationDate) {
      Alert.alert('Missing Information', 'Please enter your insurance expiration date.');
      return;
    }
    if (vehiclePhotos.length < 2) {
      Alert.alert('Missing Photos', 'Please upload 2 vehicle photos (front and side).');
      return;
    }

    // TODO: Upload documents to backend for manual review
    Alert.alert(
      'Documents Submitted',
      'Your vehicle documents have been submitted for review. ' +
        'You will be notified when verification is complete.\n\n' +
        'Review typically takes 1-3 business days.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vehicle Document Upload</Text>
        <Text style={styles.headerDescription}>
          Upload your NC DMV registration, insurance proof, and vehicle photos for manual
          review.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. NC DMV Registration</Text>
        <Text style={styles.helpText}>
          Don't have your registration? Visit{' '}
          <Text style={styles.link}>ncdot.gov/dmv</Text> to obtain it.
        </Text>
        {registrationDoc ? (
          <View style={styles.documentPreview}>
            <Image source={{uri: registrationDoc}} style={styles.documentImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setRegistrationDoc(null)}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleSelectDocument('registration')}>
            <Text style={styles.uploadButtonText}>Upload Registration</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Proof of Insurance</Text>
        <Text style={styles.helpText}>Upload your current insurance card or policy.</Text>
        {insuranceDoc ? (
          <View style={styles.documentPreview}>
            <Image source={{uri: insuranceDoc}} style={styles.documentImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setInsuranceDoc(null)}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleSelectDocument('insurance')}>
            <Text style={styles.uploadButtonText}>Upload Insurance</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.inputLabel}>Insurance Expiration Date</Text>
        <TextInput
          style={styles.textInput}
          value={insuranceExpirationDate}
          onChangeText={setInsuranceExpirationDate}
          placeholder="MM/DD/YYYY"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Vehicle Photos</Text>
        <Text style={styles.helpText}>
          Upload 2 photos: one from the front and one from the side.
        </Text>

        <View style={styles.photoGrid}>
          {vehiclePhotos.map((photoUri, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{uri: photoUri}} style={styles.vehiclePhoto} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => handleRemovePhoto(index)}>
                <Text style={styles.removePhotoText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {vehiclePhotos.length < 2 && (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleAddVehiclePhoto}>
              <Text style={styles.addPhotoText}>+</Text>
              <Text style={styles.addPhotoLabel}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Important</Text>
        <Text style={styles.disclaimerText}>
          • All documents will be manually reviewed by our team{'\n'}
          • Review typically takes 1-3 business days{'\n'}
          • You are responsible for any DMV-related fees{'\n'}
          • VIN information will not be stored after verification
        </Text>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit for Review</Text>
      </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  documentPreview: {
    marginBottom: 12,
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: 150,
    height: 150,
  },
  vehiclePhoto: {
    width: 150,
    height: 150,
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
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 150,
    height: 150,
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
  disclaimer: {
    backgroundColor: '#fff9e6',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#34C759',
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default VehicleDocumentUploadScreen;
