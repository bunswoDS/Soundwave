import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

export default function AudioTest() {
  const [sound, setSound] = useState(null);
  const [status, setStatus] = useState('Ready to test audio');

  // Cleanup function
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Function to play a test sound
  async function playTestSound() {
    try {
      setStatus('Loading sound...');
      
      // Unload previous sound if it exists
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Load a test sound from assets
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('./assets/sounds/home/doorbell.wav')
      );
      
      setSound(newSound);
      setStatus('Playing sound...');
      
      // Play the sound
      await newSound.playAsync();
      
      // Update status when playback finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setStatus('Sound played successfully!');
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Test</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={playTestSound}
      >
        <Text style={styles.buttonText}>Play Test Sound</Text>
      </TouchableOpacity>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '100%',
    textAlign: 'center',
  },
});
