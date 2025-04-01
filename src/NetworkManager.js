import { useState, useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Default timeout for network operations (in milliseconds)
const DEFAULT_TIMEOUT = 15000;

class NetworkManager {
  constructor() {
    this.isConnected = true;
    this.connectionType = 'unknown';
    this.connectionQuality = 'unknown';
    this.listeners = [];
    
    // Initialize network monitoring
    this.unsubscribe = null;
    this.initialize();
  }
  
  // Initialize network monitoring
  initialize() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Subscribe to network info updates
    this.unsubscribe = NetInfo.addEventListener(state => {
      const prevConnected = this.isConnected;
      this.isConnected = state.isConnected;
      this.connectionType = state.type;
      
      // Determine connection quality based on connection type
      if (!state.isConnected) {
        this.connectionQuality = 'none';
      } else if (state.type === 'wifi' || state.type === 'ethernet') {
        this.connectionQuality = 'good';
      } else if (state.type === 'cellular') {
        // On cellular, check the cellular generation
        switch (state.details?.cellularGeneration) {
          case '4g':
          case '5g':
            this.connectionQuality = 'good';
            break;
          case '3g':
            this.connectionQuality = 'fair';
            break;
          case '2g':
          default:
            this.connectionQuality = 'poor';
            break;
        }
      } else {
        this.connectionQuality = 'unknown';
      }
      
      // Notify listeners if connection state changed
      if (prevConnected !== this.isConnected) {
        this.notifyListeners();
      }
    });
  }
  
  // Add a listener for network state changes
  addListener(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback({
      isConnected: this.isConnected,
      connectionType: this.connectionType,
      connectionQuality: this.connectionQuality
    });
    
    // Return a function to remove this listener
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  // Notify all listeners of network state changes
  notifyListeners() {
    const networkState = {
      isConnected: this.isConnected,
      connectionType: this.connectionType,
      connectionQuality: this.connectionQuality
    };
    
    this.listeners.forEach(listener => {
      listener(networkState);
    });
  }
  
  // Check if the device is currently connected
  isNetworkConnected() {
    return this.isConnected;
  }
  
  // Get the current connection quality
  getConnectionQuality() {
    return this.connectionQuality;
  }
  
  // Perform a network request with timeout and retry logic
  async fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT, retries = 3) {
    // If not connected, throw an error immediately
    if (!this.isConnected) {
      throw new Error('No network connection available');
    }
    
    // Set up timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Add abort signal to options
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // If we have retries left and it's a timeout or network error, retry
      if (
        retries > 0 && 
        (error.name === 'AbortError' || error.message.includes('network'))
      ) {
        console.log(`Network request failed, retrying... (${retries} retries left)`);
        // Exponential backoff
        const delay = 1000 * (Math.pow(2, 4 - retries) - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithTimeout(url, options, timeout, retries - 1);
      }
      
      // No more retries or different error, rethrow
      throw error;
    }
  }
  
  // Clean up resources
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }
}

// Create a singleton instance
const networkManager = new NetworkManager();

// React hook for components to use network state
export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState({
    isConnected: networkManager.isConnected,
    connectionType: networkManager.connectionType,
    connectionQuality: networkManager.connectionQuality
  });
  
  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = networkManager.addListener(newState => {
      setNetworkState(newState);
    });
    
    // Clean up on unmount
    return unsubscribe;
  }, []);
  
  return networkState;
}

export default networkManager;
