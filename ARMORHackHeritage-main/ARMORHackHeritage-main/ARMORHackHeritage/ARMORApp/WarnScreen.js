import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';

const WarnScreen = () => {
  const [inputValue, setInputValue] = useState('');
  const [timer, setTimer] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    let interval = null;

    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (isTimerRunning && timer === 0) {
      clearInterval(interval);
      setIsTimerRunning(false);
      sendPanic();
      Alert.alert("Time's up!", "The timer has ended.");
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const sendPanic = async () => {
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
        console.log(userId);
        console.log(latitude);
        console.log(longitude);
        console.log(currentTime);
        console.log(`http://192.168.163.149:5000/panic/${userId}/${latitude}/${longitude}/${currentTime}`);
        const response = await axios.post(`http://192.168.72.187:5000/panic/${userId}/${latitude}/${longitude}/${currentTime}`);
        console.log('Server response:', response.data);
      } catch (error) {
        console.log(error.message);
        Alert.alert(error.message);
      }

    } catch (error) {
      Alert.alert(error.message);
    }
  }

  const startTimer = () => {
    const duration = parseInt(inputValue, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert("Invalid input", "Please enter a valid number of seconds.");
      return;
    }
    setTimer(duration);
    setIsTimerRunning(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Warn</Text>
      {isTimerRunning ? (
        <Text style={styles.timerText}>{timer}</Text>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter timer duration (seconds)"
            keyboardType="numeric"
            value={inputValue}
            onChangeText={setInputValue}
          />
          <Button title="Start Timer" onPress={startTimer} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'red',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
    textAlign: 'center',
  },
});

export default WarnScreen;
