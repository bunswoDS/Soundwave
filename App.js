import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Audio } from 'expo-av';
import { soundData, getSoundFilePath } from './soundData';
import audioCache from './src/AudioCache';
import networkManager, { useNetworkStatus } from './src/NetworkManager';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [buttonStates, setButtonStates] = useState({});
  const [currentSounds, setCurrentSounds] = useState({});
  const [sound, setSound] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Ready to play sounds...');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Get network status using our custom hook
  const networkStatus = useNetworkStatus();

  // Categories and their colors
  const categories = [
    { name: 'Sports', color: '#E53935' },  // Red
    { name: 'Science & Technology', color: '#1E88E5' },  // Blue
    { name: 'Nature', color: '#43A047' },  // Green
    { name: 'Home', color: '#8E24AA' },  // Purple
    { name: 'Music', color: '#FB8C00' },  // Orange
    { name: 'Animals', color: '#00ACC1' }  // Teal
  ];

  // Effect to handle network status changes
  useEffect(() => {
    if (!networkStatus.isConnected && !loading) {
      setStatusMessage('No network connection. Some features may be limited.');
    } else if (networkStatus.isConnected && networkStatus.connectionQuality === 'poor') {
      setStatusMessage('Poor network connection. Performance may be affected.');
    }
  }, [networkStatus, loading]);

  // Function to initialize random sounds for each category
  const initializeRandomSounds = () => {
    console.log('Initializing random sounds for each category...');
    const newSounds = {};
    
    // For each category, select a random sound
    categories.forEach(category => {
      const categoryName = category.name;
      const categoryData = soundData[categoryName];
      
      if (categoryData && categoryData.length > 0) {
        // Select a random sound from this category
        const randomIndex = Math.floor(Math.random() * categoryData.length);
        const selectedSound = categoryData[randomIndex];
        
        newSounds[categoryName] = {
          id: selectedSound.id,
          name: selectedSound.name,
          clickCount: 0
        };
        
        console.log(`Selected ${selectedSound.name} for ${categoryName}`);
      } else {
        console.warn(`No sounds available for category: ${categoryName}`);
      }
    });
    
    // Update the state with the new sounds
    setCurrentSounds(newSounds);
  };

  // Initialize audio with network awareness
  useEffect(() => {
    let isMounted = true;
    let setupTimeout;
    
    async function setupAudio() {
      try {
        console.log('Setting up audio...');
        setStatusMessage('Setting up audio...');
        
        // Configure audio settings with timeout handling
        const setupPromise = Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        
        // Set a timeout for the audio setup
        const timeoutPromise = new Promise((_, reject) => {
          setupTimeout = setTimeout(() => {
            reject(new Error('Audio setup timed out. Please try again.'));
          }, 10000); // 10 second timeout
        });
        
        // Race the setup against the timeout
        await Promise.race([setupPromise, timeoutPromise]);
        
        // Clear the timeout since setup completed
        clearTimeout(setupTimeout);
        
        // Only proceed if component is still mounted
        if (isMounted) {
          // Initialize random sounds for each category
          // This doesn't load the actual audio files, just selects which ones will be used
          initializeRandomSounds();
          
          console.log('Audio setup complete');
          setStatusMessage('Ready to play sounds...');
          setLoading(false);
          setRetryCount(0);
          setIsRetrying(false);
        }
      } catch (error) {
        console.error('Error setting up audio:', error);
        
        // Clear the timeout if it was a different error
        clearTimeout(setupTimeout);
        
        // Only update state if component is still mounted
        if (isMounted) {
          const isTimeout = error.message.includes('timed out');
          const isNetworkError = !networkStatus.isConnected || 
                                error.message.includes('network') || 
                                error.message.includes('connection');
          
          if ((isTimeout || isNetworkError) && retryCount < 3) {
            // Retry setup with exponential backoff
            setStatusMessage(`Connection issue. Retrying... (${retryCount + 1}/3)`);
            setIsRetrying(true);
            
            // Exponential backoff delay
            const delay = 1000 * Math.pow(2, retryCount);
            setTimeout(() => {
              if (isMounted) {
                setRetryCount(prev => prev + 1);
                setupAudio();
              }
            }, delay);
          } else {
            // Max retries reached or different error
            setStatusMessage('Error setting up audio: ' + error.message);
            setLoading(false);
            setIsRetrying(false);
            
            // Show an alert with retry option
            if (Platform.OS !== 'web') {
              Alert.alert(
                'Connection Error',
                'Failed to initialize the app. Please check your connection and try again.',
                [
                  {
                    text: 'Retry',
                    onPress: () => {
                      setLoading(true);
                      setRetryCount(0);
                      setupAudio();
                    }
                  }
                ]
              );
            }
          }
        }
      }
    }

    setupAudio();

    // Cleanup function
    return () => {
      // Clear the audio cache when component unmounts
      audioCache.clearCache().catch(err => 
        console.warn('Error clearing audio cache:', err)
      );
    };
  }, []);

  // Function to play a sound using the audio cache with network resilience
  async function playSound(category, revealName = false) {
    try {
      console.log(`Attempting to play ${category} sound`);
      setStatusMessage(`Loading ${category} sound...`);
      
      // Check network status before attempting to play
      if (!networkStatus.isConnected) {
        setStatusMessage('No network connection. Cannot load new sounds.');
        return;
      }
      
      // Get the sound object for this category
      const soundObj = currentSounds[category];
      
      if (soundObj) {
        console.log(`Playing sound: ${soundObj.name}`);
        
        // Find the sound item in the soundData
        const categoryData = soundData[category];
        const soundItem = categoryData.find(item => item.name === soundObj.name);
        
        if (!soundItem) {
          console.error(`Sound item not found for ${soundObj.name}`);
          setStatusMessage(`Error: Sound not found`);
          return;
        }
        
        // Set a timeout for loading the sound
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Sound loading timed out'));
          }, 10000); // 10 second timeout
        });
        
        // Play the sound using the audio cache with timeout handling
        const soundPromise = audioCache.playSound(category, soundItem);
        const newSound = await Promise.race([soundPromise, timeoutPromise]);
        
        // Clear the timeout since loading completed
        clearTimeout(timeoutId);
        
        // Store the current sound reference
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
          
          {/* Network status indicator */}
          <View style={styles.networkStatusContainer}>
            <View style={[
              styles.networkStatusIndicator, 
              { backgroundColor: networkStatus.isConnected 
                ? (networkStatus.connectionQuality === 'good' ? '#4CAF50' : '#FFC107') 
                : '#F44336' 
              }
            ]} />
            <Text style={styles.networkStatusText}>
              {networkStatus.isConnected 
                ? `Connected (${networkStatus.connectionType})` 
                : 'Offline'
              }
            </Text>
          </View>
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
  networkWarning: {
    marginTop: 10,
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    padding: 10,
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
  networkStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  networkStatusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  networkStatusText: {
    fontSize: 12,
    color: '#666',
  },
});
