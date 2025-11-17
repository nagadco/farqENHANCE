import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useLanguage } from './LanguageContext';

interface LocationContextType {
  hasLocationPermission: boolean | null;
  showLocationModal: boolean;
  showMapModal: boolean;
  userLocation: { lat: number; lng: number } | null;
  locationAddress: string | null;
  isManualLocation: boolean;
  requestLocation: () => void;
  allowLocation: () => void;
  denyLocation: () => void;
  closeModal: () => void;
  openMapModal: () => void;
  closeMapModal: () => void;
  setManualLocation: (lat: number, lng: number) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const { t, language } = useLanguage();
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [isManualLocation, setIsManualLocation] = useState(false);

  // Fetch address from coordinates using Nominatim
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${language}`
      );
      const data = await response.json();

      if (data && data.address) {
        // Build address from available components (without city)
        const parts = [];
        if (data.address.road) parts.push(data.address.road);
        if (data.address.suburb || data.address.neighbourhood) {
          parts.push(data.address.suburb || data.address.neighbourhood);
        }

        const address = parts.join(', ') || data.display_name;
        setLocationAddress(address);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setLocationAddress(null);
    }
  };

  // Debug: Watch showMapModal changes
  useEffect(() => {
    console.log('🗺️ showMapModal changed to:', showMapModal);
  }, [showMapModal]);

  // Fetch address when location changes
  useEffect(() => {
    if (userLocation) {
      fetchAddress(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, language]);

  const requestLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success - get user's fresh location (no caching)
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setHasLocationPermission(true);
          localStorage.setItem('locationPermission', 'granted');
          // Do NOT save location to localStorage - always get fresh location
          setShowLocationModal(false);
        },
        (error) => {
          // Error - show user-friendly message
          console.error('Geolocation error:', error);

          let errorMessage = 'Unable to get your location. Please enable location services and try again.';

          if (error.code === 1) {
            errorMessage = t('location_denied');
          } else if (error.code === 2) {
            errorMessage = t('unable_to_determine_location');
          } else if (error.code === 3) {
            errorMessage = t('location_timeout');
          }

          alert(errorMessage);

          setHasLocationPermission(false);
          localStorage.setItem('locationPermission', 'denied');
          setShowLocationModal(false);
        },
        {
          enableHighAccuracy: false,  // Balance speed and accuracy
          timeout: 10000,
          maximumAge: 0  // Always get fresh location - no caching
        }
      );
    } else {
      // Geolocation not supported
      console.error('Geolocation is not supported by this browser');
      alert('Your browser does not support location services. Please use a modern browser.');
      setHasLocationPermission(false);
      localStorage.setItem('locationPermission', 'denied');
      setShowLocationModal(false);
    }
  }, []);

  useEffect(() => {
    // Clean up any old cached location data
    localStorage.removeItem('userLocation');

    // Check if user has a manual location saved
    const manualLocationStr = localStorage.getItem('manualLocation');
    if (manualLocationStr) {
      try {
        const manualLocation = JSON.parse(manualLocationStr);
        if (manualLocation?.lat && manualLocation?.lng) {
          setUserLocation({ lat: manualLocation.lat, lng: manualLocation.lng });
          setIsManualLocation(true);
          setHasLocationPermission(true);
          console.log('Loaded manual location from storage:', manualLocation);
          return; // Don't request location if manual location exists
        }
      } catch (e) {
        console.error('Failed to parse manual location:', e);
        localStorage.removeItem('manualLocation');
      }
    }

    // Check if user has already responded to location permission
    const locationPermission = localStorage.getItem('locationPermission');

    if (locationPermission === null) {
      // First time visitor - show modal
      setShowLocationModal(true);
    } else if (locationPermission === 'granted') {
      setHasLocationPermission(true);
      // Automatically request fresh location without showing modal
      requestLocation();
    } else if (locationPermission === 'denied') {
      // Even if denied before, show modal again to give another chance
      setShowLocationModal(true);
    }
  }, [requestLocation]);

  const allowLocation = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  const denyLocation = useCallback(() => {
    setHasLocationPermission(false);
    localStorage.setItem('locationPermission', 'denied');
    setShowLocationModal(false);
  }, []);

  const closeModal = useCallback(() => {
    setShowLocationModal(false);
  }, []);

  const openMapModal = useCallback(() => {
    console.log('openMapModal called - setting showMapModal to true');
    setShowMapModal(true);
    console.log('showMapModal state should now be true');
  }, []);

  const closeMapModal = useCallback(() => {
    console.log('closeMapModal called');
    setShowMapModal(false);
  }, []);

  const setManualLocation = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    setIsManualLocation(true);
    setHasLocationPermission(true);
    localStorage.setItem('locationPermission', 'granted');
    localStorage.setItem('manualLocation', JSON.stringify({ lat, lng }));
    console.log('Manual location set:', { lat, lng });
  }, []);

  const value: LocationContextType = useMemo(() => ({
    hasLocationPermission,
    showLocationModal,
    showMapModal,
    userLocation,
    locationAddress,
    isManualLocation,
    requestLocation,
    allowLocation,
    denyLocation,
    closeModal,
    openMapModal,
    closeMapModal,
    setManualLocation
  }), [
    hasLocationPermission,
    showLocationModal,
    showMapModal,
    locationAddress,
    userLocation,
    isManualLocation,
    requestLocation,
    allowLocation,
    denyLocation,
    closeModal,
    openMapModal,
    closeMapModal,
    setManualLocation
  ]);

  console.log('LocationContext value:', {
    showMapModal,
    showLocationModal,
    hasLocationPermission,
    hasUserLocation: !!userLocation
  });

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}