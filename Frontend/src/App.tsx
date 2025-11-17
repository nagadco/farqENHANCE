import { useEffect } from 'react'
import DeliveryPage from './pages/DeliveryPage'
import { LocationProvider, useLocation } from './contexts/LocationContext'
import { LanguageProvider } from './contexts/LanguageContext'
import LocationPermissionModal from './components/LocationPermissionModal'
import MapPickerModal from './components/MapPickerModal'

function AppContent() {
  const {
    showLocationModal,
    showMapModal,
    userLocation,
    allowLocation,
    denyLocation,
    closeModal,
    closeMapModal,
    setManualLocation
  } = useLocation()

  console.log('🔄 AppContent render - showMapModal:', showMapModal, 'showLocationModal:', showLocationModal);

  // Debug: Watch showMapModal with useEffect
  useEffect(() => {
    console.log('✅ AppContent useEffect - showMapModal changed to:', showMapModal);
  }, [showMapModal]);

  return (
    <>
      <DeliveryPage />
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={closeModal}
        onAllow={allowLocation}
        onDeny={denyLocation}
      />
      <MapPickerModal
        isOpen={showMapModal}
        onClose={closeMapModal}
        currentLocation={userLocation}
        onLocationSelect={setManualLocation}
      />
    </>
  )
}

function App() {
  return (
    <LanguageProvider>
      <LocationProvider>
        <AppContent />
      </LocationProvider>
    </LanguageProvider>
  )
}

export default App