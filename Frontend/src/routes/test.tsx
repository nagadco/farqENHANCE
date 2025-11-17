import { createFileRoute } from '@tanstack/react-router'
import DeliveryPage from '../pages/DeliveryPage'

export const Route = createFileRoute('/test')({
  component: DeliveryPage,
})