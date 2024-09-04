import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function AuthScreen({ navigation, onAuthenticationSuccess }) {
  useEffect(() => {
    handleAuthentication();
  }, []);

  const handleAuthentication = async () => {
    try {
      const { success, error } = await LocalAuthentication.authenticateAsync();
      if (success) {
        onAuthenticationSuccess();
        navigation.replace('Home'); // Navigate to Home screen on successful authentication
      } else {
        Alert.alert('Authentication Failed', error, [
          { text: 'Retry', onPress: () => handleAuthentication() },
        ]);
      }
    } catch (error) {
      Alert.alert('Authentication Error', error.message, [
        { text: 'Retry', onPress: () => handleAuthentication() },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Please authenticate using fingerprint</Text>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
});
