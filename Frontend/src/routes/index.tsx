import { createFileRoute } from '@tanstack/react-router'
import DeliveryPage from '../pages/DeliveryPage'
import LocationPermissionModal from '../components/LocationPermissionModal'
import { useLocation } from '../contexts/LocationContext'

function Home() {
  const { showLocationModal, allowLocation, denyLocation, closeModal } = useLocation()

  return (
    <>
      <DeliveryPage />
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={closeModal}
        onAllow={allowLocation}
        onDeny={denyLocation}
      />
    </>
  )
}

export const Route = createFileRoute('/')({
  component: Home,
})