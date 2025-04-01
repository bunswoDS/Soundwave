import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Maximum number of sounds to keep in cache
const MAX_CACHE_SIZE = 10;

class AudioCache {
  constructor() {
    this.cache = new Map();
    this.loadOrder = []; // Track the order of loaded sounds for LRU cache
  }

  // Get a sound from the cache
  async getSound(category, soundItem) {
    const cacheKey = `${category}_${soundItem.id}`;
    
    // Check if the sound is already in the cache
    if (this.cache.has(cacheKey)) {
      console.log(`Cache hit for ${cacheKey}`);
      
      // Move this sound to the end of the load order (most recently used)
      this.loadOrder = this.loadOrder.filter(key => key !== cacheKey);
      this.loadOrder.push(cacheKey);
      
      return this.cache.get(cacheKey);
    }
    
    console.log(`Cache miss for ${cacheKey}, loading sound...`);
    
    try {
      // Get the sound source from our static imports in soundData.js
      // This avoids dynamic requires which aren't supported by Metro
      const { soundFiles } = require('../soundData');
      const soundSource = soundFiles[category][soundItem.filename];
      
      // Load the sound
      const { sound } = await Audio.Sound.createAsync(
        soundSource,
        { shouldPlay: false } // Don't play automatically, we'll control this separately
      );
      
      // Add to cache
      this.addToCache(cacheKey, sound);
      
      return sound;
    } catch (error) {
      console.error(`Error loading sound ${cacheKey}:`, error);
      throw error;
    }
  }
  
  // Add a sound to the cache
  addToCache(key, sound) {
    // If cache is full, remove the least recently used sound
    if (this.loadOrder.length >= MAX_CACHE_SIZE) {
      const oldestKey = this.loadOrder.shift();
      const oldSound = this.cache.get(oldestKey);
      
      if (oldSound) {
        console.log(`Cache full, unloading ${oldestKey}`);
        oldSound.unloadAsync().catch(err => 
          console.warn(`Error unloading sound ${oldestKey}:`, err)
        );
        this.cache.delete(oldestKey);
      }
    }
    
    // Add the new sound to the cache
    this.cache.set(key, sound);
    this.loadOrder.push(key);
    console.log(`Added ${key} to cache. Cache size: ${this.cache.size}`);
  }
  
  // Play a sound from the cache or load it if not cached
  async playSound(category, soundItem) {
    try {
      const sound = await this.getSound(category, soundItem);
      
      // Reset the sound to the beginning
      await sound.setPositionAsync(0);
      
      // Play the sound
      await sound.playAsync();
      
      return sound;
    } catch (error) {
      console.error(`Error playing sound ${category}_${soundItem.id}:`, error);
      throw error;
    }
  }
  
  // Clear the entire cache
  async clearCache() {
    console.log('Clearing audio cache...');
    
    // Unload all sounds
    const unloadPromises = Array.from(this.cache.entries()).map(async ([key, sound]) => {
      try {
        await sound.unloadAsync();
        console.log(`Unloaded ${key}`);
      } catch (err) {
        console.warn(`Error unloading sound ${key}:`, err);
      }
    });
    
    await Promise.all(unloadPromises);
    
    // Clear the cache and load order
    this.cache.clear();
    this.loadOrder = [];
    console.log('Audio cache cleared');
  }
}

// Create a singleton instance
const audioCache = new AudioCache();

export default audioCache;
