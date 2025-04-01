// This file contains information about our sounds
// Using a lazy loading approach to avoid loading all sounds at startup

// Helper function to get the correct file path based on platform
export const getSoundFilePath = (category, filename, format = 'mp3') => {
  // For web platform, we need to use a different path format
  if (Platform.OS === 'web') {
    return `./assets/sounds/${category.toLowerCase()}/mp3/${filename}.${format}`;
  }
  
  // For native platforms (iOS, Android), we use the asset module system
  return {
    uri: `asset:/assets/sounds/${category.toLowerCase()}/mp3/${filename}.${format}`
  };
};

// Import Platform to detect the current platform
import { Platform } from 'react-native';

// Export soundFiles for use in AudioCache
export { soundFiles };

// Define sound categories and their metadata without loading the actual files
export const soundData = {
  Sports: [
    { 
      id: 'sports1', 
      name: 'Female Scream', 
      filename: 'female_scream',
      loaded: false,
      sound: null
    },
    { 
      id: 'sports2', 
      name: 'Person Farting', 
      filename: 'person_farting',
      loaded: false,
      sound: null
    },
    { 
      id: 'sports3', 
      name: 'Sweeping', 
      filename: 'sweeping',
      loaded: false,
      sound: null
    },
  ],
  'Science & Technology': [
    { 
      id: 'science1', 
      name: 'Police Radio', 
      filename: 'police_radio',
      loaded: false,
      sound: null
    },
    { 
      id: 'science2', 
      name: 'Stapling Paper', 
      filename: 'stapling_paper',
      loaded: false,
      sound: null
    },
    { 
      id: 'science3', 
      name: 'Electric Toothbrush', 
      filename: 'electric_toothbrush',
      loaded: false,
      sound: null
    },
  ],
  Nature: [
    { 
      id: 'nature1', 
      name: 'Blowing Balloon', 
      filename: 'blowing_balloon',
      loaded: false,
      sound: null
    },
    { 
      id: 'nature2', 
      name: 'Water Shower', 
      filename: 'water_shower',
      loaded: false,
      sound: null
    },
    { 
      id: 'nature3', 
      name: 'Bubbles Through Straw', 
      filename: 'bubbles_straw',
      loaded: false,
      sound: null
    },
  ],
  Home: [
    { 
      id: 'home1', 
      name: 'Doorbell', 
      filename: 'doorbell',
      loaded: false,
      sound: null
    },
    { 
      id: 'home2', 
      name: 'Coffee Grinder', 
      filename: 'coffee_grinder',
      loaded: false,
      sound: null
    },
    { 
      id: 'home3', 
      name: 'Microwave Popcorn', 
      filename: 'microwave_popcorn',
      loaded: false,
      sound: null
    },
    { 
      id: 'home4', 
      name: 'Flushing Toilet', 
      filename: 'flushing_toilet',
      loaded: false,
      sound: null
    },
    { 
      id: 'home5', 
      name: 'Electric Razor', 
      filename: 'electric_razor',
      loaded: false,
      sound: null
    },
    { 
      id: 'home6', 
      name: 'Brushing Teeth', 
      filename: 'brushing_teeth',
      loaded: false,
      sound: null
    },
  ],
  Music: [
    { 
      id: 'music1', 
      name: 'Popping Cork', 
      filename: 'popping_cork',
      loaded: false,
      sound: null
    },
    { 
      id: 'music2', 
      name: 'Sipping Coffee', 
      filename: 'sipping_coffee',
      loaded: false,
      sound: null
    },
    { 
      id: 'music3', 
      name: 'Straw Sound', 
      filename: 'straw_sound',
      loaded: false,
      sound: null
    },
  ],
  Animals: [
    { 
      id: 'animals1', 
      name: 'Baby Cry', 
      filename: 'baby_cry',
      loaded: false,
      sound: null
    },
    { 
      id: 'animals2', 
      name: 'Squeaky Toy', 
      filename: 'squeaky_toy',
      loaded: false,
      sound: null
    },
    { 
      id: 'animals3', 
      name: 'Man Sneezing', 
      filename: 'man_sneezing',
      loaded: false,
      sound: null
    },
  ],
};

// Import all sound files statically to avoid dynamic requires
// This is necessary for Metro bundler which doesn't support dynamic requires
const soundFiles = {
  Sports: {
    female_scream: require('./assets/sounds/sports/mp3/female_scream.mp3'),
    person_farting: require('./assets/sounds/sports/mp3/person_farting.mp3'),
    sweeping: require('./assets/sounds/sports/mp3/sweeping.mp3')
  },
  'Science & Technology': {
    police_radio: require('./assets/sounds/science/mp3/police_radio.mp3'),
    stapling_paper: require('./assets/sounds/science/mp3/stapling_paper.mp3'),
    electric_toothbrush: require('./assets/sounds/science/mp3/electric_toothbrush.mp3')
  },
  Nature: {
    blowing_balloon: require('./assets/sounds/nature/mp3/blowing_balloon.mp3'),
    water_shower: require('./assets/sounds/nature/mp3/water_shower.mp3'),
    bubbles_straw: require('./assets/sounds/nature/mp3/bubbles_straw.mp3')
  },
  Home: {
    doorbell: require('./assets/sounds/home/mp3/doorbell.mp3'),
    coffee_grinder: require('./assets/sounds/home/mp3/coffee_grinder.mp3'),
    microwave_popcorn: require('./assets/sounds/home/mp3/microwave_popcorn.mp3'),
    flushing_toilet: require('./assets/sounds/home/mp3/flushing_toilet.mp3'),
    electric_razor: require('./assets/sounds/home/mp3/electric_razor.mp3'),
    brushing_teeth: require('./assets/sounds/home/mp3/brushing_teeth.mp3')
  },
  Music: {
    popping_cork: require('./assets/sounds/music/mp3/popping_cork.mp3'),
    sipping_coffee: require('./assets/sounds/music/mp3/sipping_coffee.mp3'),
    straw_sound: require('./assets/sounds/music/mp3/straw_sound.mp3')
  },
  Animals: {
    baby_cry: require('./assets/sounds/animals/mp3/baby_cry.mp3'),
    squeaky_toy: require('./assets/sounds/animals/mp3/squeaky_toy.mp3'),
    man_sneezing: require('./assets/sounds/animals/mp3/man_sneezing.mp3')
  }
};

// For backwards compatibility with existing code
export const getOriginalSoundData = () => {
  // This function returns the sound data in the original format
  // but with MP3 files instead of WAV files
  const originalFormat = {};
  
  Object.keys(soundData).forEach(category => {
    originalFormat[category] = soundData[category].map(sound => ({
      id: sound.id,
      name: sound.name,
      file: soundFiles[category][sound.filename]
    }));
  });
  
  return originalFormat;
};
