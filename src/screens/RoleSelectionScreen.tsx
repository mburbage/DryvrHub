import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useRole} from '../contexts/RoleContext';

const RoleSelectionScreen = () => {
  const {setRole} = useRole();

  const handleSelectRole = async (role: 'RIDER' | 'DRIVER') => {
    await setRole(role);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to DryverHub</Text>
      <Text style={styles.subtitle}>Choose your role to continue</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelectRole('RIDER')}>
        <Text style={styles.buttonText}>I'm a Rider</Text>
        <Text style={styles.buttonSubtext}>I need a ride</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelectRole('DRIVER')}>
        <Text style={styles.buttonText}>I'm a Driver</Text>
        <Text style={styles.buttonSubtext}>I provide rides</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonSubtext: {
    color: '#fff',
    fontSize: 14,
  },
});

export default RoleSelectionScreen;
