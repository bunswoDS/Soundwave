import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Audio } from 'expo-av';
import { soundData } from './soundData';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [buttonStates, setButtonStates] = useState({});
  const [currentSounds, setCurrentSounds] = useState({});
  const [sound, setSound] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Ready to play sounds...');

  // Categories and their colors
  const categories = [
    { name: 'Sports', color: '#E53935' },  // Red
    { name: 'Science & Technology', color: '#1E88E5' },  // Blue
    { name: 'Nature', color: '#43A047' },  // Green
    { name: 'Home', color: '#8E24AA' },  // Purple
    { name: 'Music', color: '#FB8C00' },  // Orange
    { name: 'Animals', color: '#00ACC1' }  // Teal
  ];

  // Initialize audio
  useEffect(() => {
    async function setupAudio() {
      try {
        console.log('Setting up audio...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        console.log('Audio setup complete');
        setLoading(false);
      } catch (error) {
        console.error('Error setting up audio:', error);
        setStatusMessage('Error setting up audio: ' + error.message);
        setLoading(false);
      }
    }

    setupAudio();

    // Cleanup function
    return () => {
      if (sound) {
        console.log('Unloading sound on cleanup');
        sound.unloadAsync();
      }
    };
  }, []);

  // Function to play a sound
  async function playSound(category, revealName = false) {
    try {
      console.log(`Attempting to play ${category} sound`);
      
      // Unload previous sound if it exists
      if (sound) {
        await sound.unloadAsync();
      }

      const soundObj = currentSounds[category];
      
      if (soundObj) {
        console.log(`Loading sound: ${soundObj.name}`);
        
        // Create a new sound object
        const { sound: newSound } = await Audio.Sound.createAsync(
          soundObj.file,
          { shouldPlay: true }
        );
        
        setSound(newSound);
        
        // Update status message
        if (revealName) {
          setStatusMessage(`Sound revealed: ${soundObj.name}`);
        } else {
          setStatusMessage(`Playing a ${category} sound...`);
        }
        
        // Set up playback status update handler
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            console.log(`Finished playing ${category} sound`);
          }
        });
      } else {
        setStatusMessage(`No sound selected for ${category}`);
      }
    } catch (error) {
      console.error(`Error playing ${category} sound:`, error);
      setStatusMessage(`Error playing sound: ${error.message}`);
    }
  }

  // Function to handle button click
  function handleButtonClick(category) {
    // Get current state for this category
    const currentState = buttonStates[category] || 0;
    const nextState = (currentState + 1) % 4; // Cycle through 0, 1, 2, 3
    
    // Update button state
    setButtonStates({
      ...buttonStates,
      [category]: nextState
    });
    
    // First click: Play a random sound from the category
    if (currentState === 0) {
      const soundArray = soundData[category];
      const soundIndex = Math.floor(Math.random() * soundArray.length);
      const soundObj = soundArray[soundIndex];
      
      setCurrentSounds({
        ...currentSounds,
        [category]: soundObj
      });
      
      playSound(category, false); // Don't reveal name
    }
    // Second click: Replay the same sound
    else if (currentState === 1) {
      playSound(category, false); // Don't reveal name
    }
    // Third click: Reveal the sound name and play the sound again
    else if (currentState === 2) {
      playSound(category, true); // Reveal name
    }
    // Fourth click: Reset to initial state
    else if (currentState === 3) {
      setStatusMessage('Ready to play sounds...');
    }
  }

  // Render button text based on state
  function getButtonText(category) {
    const state = buttonStates[category] || 0;
    if (state === 3 || state === 0) {
      return category;
    } else if (state === 2) {
      return `${category}:\n${currentSounds[category]?.name || ''}`;
    } else {
      return category;
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading audio resources...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Sound Game</Text>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.buttonContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.soundButton,
                { backgroundColor: category.color },
                buttonStates[category.name] === 2 && styles.expandedButton
              ]}
              onPress={() => handleButtonClick(category.name)}
            >
              <Text style={styles.buttonText}>
                {getButtonText(category.name)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>Click a button to play a sound from that category.</Text>
          <Text style={styles.instructionText}>Click again to replay the sound.</Text>
          <Text style={styles.instructionText}>Click a third time to reveal the sound name.</Text>
          <Text style={styles.instructionText}>Click a fourth time to reset.</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 800,
    gap: 20,
  },
  soundButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  expandedButton: {
    transform: [{ scale: 1.05 }],
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
  },
  instructionsContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  instructionText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    width: '80%',
    alignItems: 'center',
  },
  statusText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
});
