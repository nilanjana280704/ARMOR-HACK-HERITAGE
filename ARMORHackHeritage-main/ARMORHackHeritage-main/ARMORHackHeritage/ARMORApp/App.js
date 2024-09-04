import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './HomeScreen';
import WarnScreen from './WarnScreen';
import Footer from './Footer';
import AuthScreen from './AuthScreen';
import LoginScreen from './LoginScreen';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import { View, StyleSheet, ActivityIndicator, Alert, Button, Modal, TextInput, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [navigation, setNavigation] = useState(null);

  useEffect(() => {
    checkStoredCredentials();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const intervalId = setInterval(() => {
        getLocation();
      }, 10000); // 2 minutes in milliseconds

      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);

  const checkStoredCredentials = async () => {
    const storedUserId = await AsyncStorage.getItem('userId');
    const storedPin = await AsyncStorage.getItem('pin');
    console.log(storedUserId);
    console.log(storedPin);
    if (storedUserId && storedPin) {
      setUserId(storedUserId);
      setPin(storedPin);
      authenticate();
    } else {
      setIsAuthenticating(false);
    }
  };

  const authenticate = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert('Error', 'Your device does not support fingerprint authentication');
      return;
    }
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      Alert.alert('Error', 'No fingerprints are enrolled on this device');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync();
    if (result.success) {
      setIsAuthenticated(true);
    } else {
      Alert.alert('Error', 'Authentication failed');
    }
    setIsAuthenticating(false);
  };

  const handleAuthenticationSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    const storedUserId = await AsyncStorage.getItem('userId');
    const storedPin = await AsyncStorage.getItem('pin');
    if (userId === storedUserId && pin === storedPin) {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('pin');
      setIsAuthenticated(false);
      setShowLogoutModal(false);
      navigation.navigate('Login');
    } else {
      Alert.alert('Error', 'Incorrect User ID or PIN');
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your location.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const currentTime = new Date().toISOString();

      //Alert.alert('Current Location', `Latitude: ${latitude}, Longitude: ${longitude}, Time: ${currentTime}`);

      // Send location to the server
      try {
        console.log(userId);
        console.log(latitude);
        console.log(longitude);
        console.log(currentTime);
        console.log(`http://3.27.158.46:5000/update-location/${userId}/${latitude}/${longitude}/${currentTime}`)
        const response = await axios.post(`http://192.168.72.187:5000/update-location/${userId}/${latitude}/${longitude}/${currentTime}`);
        console.log('Server response:', response.data);
        //Alert.alert('Success', 'Location updated successfully');
      } catch (error) {
        console.log(error.message);
        Alert.alert(error.message);
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to get location.');
    }
  };

  if (isAuthenticating) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={isAuthenticated ? 'Home' : 'Login'}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={({ navigation }) => ({
              headerRight: () => (
                <View style={styles.logoutButtonContainer}>
                  <Button
                    onPress={() => {
                      setShowLogoutModal(true);
                      setNavigation(navigation);
                    }}
                    title="Logout"
                  />
                </View>
              ),
            })}
          />
          <Stack.Screen name="Warn" component={WarnScreen} />
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuthenticationSuccess={handleAuthenticationSuccess} />}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLoginSuccess={handleAuthenticationSuccess} />}
          </Stack.Screen>
        </Stack.Navigator>
        <Footer />
      </NavigationContainer>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="User ID"
              value={userId}
              onChangeText={setUserId}
              style={styles.input}
            />
            <TextInput
              placeholder="PIN"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              style={styles.input}
            />
            <Button title="Confirm Logout" onPress={handleLogout} />
            <Text></Text>
            <Button title="Cancel" onPress={() => setShowLogoutModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoutButtonContainer: {
    paddingRight: 10, // Adjust the padding value as needed
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});
