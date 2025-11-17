import { createRootRoute, Outlet } from '@tanstack/react-router'
import { LocationProvider, useLocation } from '../contexts/LocationContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import LocationPermissionModal from '../components/LocationPermissionModal'
import MapPickerModal from '../components/MapPickerModal'

function RootComponent() {
  return (
    <LanguageProvider>
      <LocationProvider>
        <AppContent />
      </LocationProvider>
    </LanguageProvider>
  )
}

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

  return (
    <>
      <Outlet />
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

export const Route = createRootRoute({
  component: RootComponent,
})