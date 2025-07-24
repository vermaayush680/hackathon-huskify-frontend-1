// Utility function to extract platform from URL
export const getPlatformFromUrl = (): string | null => {
  const path = window.location.pathname;
  // Extract platform from URL like /CSE, /Engineering, etc.
  const pathSegments = path.split('/').filter(segment => segment !== '');
  
  // Return the first segment as platform if it exists
  return pathSegments.length > 0 ? pathSegments[0] : null;
};

// Function to set platform in localStorage for persistence
export const setPlatformInStorage = (platform: string): void => {
  localStorage.setItem('platformContext', platform);
};

// Function to get platform from localStorage
export const getPlatformFromStorage = (): string | null => {
  return localStorage.getItem('platformContext');
};

// Function to get current platform (URL takes priority over storage)
export const getCurrentPlatform = (): string | null => {
  return getPlatformFromUrl() || getPlatformFromStorage();
};

// Function to clear platform from storage
export const clearPlatformFromStorage = (): void => {
  localStorage.removeItem('platformContext');
  localStorage.removeItem('selectedPlatformId');
  localStorage.removeItem('selectedPlatformName');
};

// Function to clear all platform-related data and force refresh
export const clearPlatformData = (): void => {
  // Clear platform context
  clearPlatformFromStorage();
  
  // Clear any cached API data that might be platform-specific
  // Note: You may need to add more cache clearing based on your app's state management
  sessionStorage.clear(); // Clear session storage
  
  // Clear any platform-specific localStorage keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('platform') || key.includes('dashboard') || key.includes('requests'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};
