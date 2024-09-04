import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { openCamera } from './VideoRecorder';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';

const Footer = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState('');

  const handlePress = async (button) => {
    if (button === 'Alert') {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to show your location.');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const currentTime = new Date().toISOString();

        try {
          const response = await axios.post(`http://192.168.72.187:5000/alert/${userId}/${latitude}/${longitude}/${currentTime}`);
          console.log('Server response:', response.data);
        } catch (error) {
          console.log(error.message);
          Alert.alert(error.message);
        }
        alert('Alert Button Pressed!');
      } catch (error) {
        Alert.alert(error.message);
      }

    } else if (button === 'Panic') {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to show your location.');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const currentTime = new Date().toISOString();

        try {
          const response = await axios.post(`http://192.168.72.187:5000/panic/${userId}/${latitude}/${longitude}/${currentTime}`);
          console.log('Server response:', response.data);
        } catch (error) {
          console.log(error.message);
          Alert.alert(error.message);
        }
        alert('Panic Button Pressed!');
      } catch (error) {
        Alert.alert(error.message);
      }

    } else if (button === 'Warn') {
      navigation.navigate('Warn');
    } else if (button === 'Record Video') {
      openCamera();
    } else if (button === 'Call') {
      Linking.openURL('tel:112');
    }
  };

  const openURL = (url) => {
    Linking.openURL(url).catch((err) => console.error("Failed to open URL:", err));
  };
  

  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.button} onPress={() => handlePress('Alert')}>
        <Text>Alert</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => handlePress('Panic')}>
        <Text>Panic</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => handlePress('Warn')}>
        <Text>Warn</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => handlePress('Record Video')}>
        <Text>Record Video</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => handlePress('Call')}>
        <Text>Call</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => openURL('https://crimeindexagainstwomenarmor.streamlit.app/')}>
        <Text>
          Index
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
});

export default Footer;
