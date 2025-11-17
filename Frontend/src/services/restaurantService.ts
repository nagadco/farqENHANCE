import type { Restaurant } from '../types/restaurant';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface FetchRestaurantsParams {
  latitude: number;
  longitude: number;
  maxChefs?: number;
  page?: number;
  position?: number;
}

export interface ApiRestaurant {
  id: number;
  name: string;
  rating: number;
  distance: string;
  tags: string[];
  image: string;
  reviewCount?: number;
  isClosed?: boolean;
  deliveryOptions: Array<{
    name: string;
    time: string;
    price: string;
    isFree: boolean;
    image: string;
  }>;
  toyouLogo?: string;
  chefzData?: any; // Store original chef data
  expanded?: boolean; // Track if restaurant is expanded
}

export interface NextRequest {
  page: number;
  position: number;
}

export interface ApiResponse {
  status: string;
  processed_at: string;
  restaurants: ApiRestaurant[];
  total_processed: number;
  pagination: {
    startPage: number;
    startPosition: number;
    lastPage: number;
    totalCollected: number;
    pagesScanned: number;
    nextPage: number;
    nextPosition: number;
  };
  next_request: NextRequest;
  last_restaurant: {
    id: number;
    name: string;
  };
}

export interface RestaurantApiResult {
  restaurants: Restaurant[];
  nextRequest: NextRequest | null;
  hasMore: boolean;
}

export class RestaurantService {

  static async fetchRestaurants(params: FetchRestaurantsParams): Promise<RestaurantApiResult> {
    const {
      latitude,
      longitude,
      maxChefs = 6,
      page = 2,
      position = 0
    } = params;

    try {
      const response = await fetch(`${API_BASE_URL}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          maxChefs,
          page,
          position
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      // Transform API data to match our Restaurant type
      const transformedRestaurants: Restaurant[] = data.restaurants.map((restaurant: ApiRestaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        rating: restaurant.rating,
        distance: restaurant.distance,
        tags: restaurant.tags,
        image: restaurant.image,
        reviewCount: restaurant.reviewCount,
        isClosed: restaurant.isClosed,
        chefzData: restaurant.chefzData,
        deliveryOptions: restaurant.deliveryOptions.map((option) => ({
          name: option.name,
          time: option.time,
          price: option.price,
          isFree: option.isFree,
          image: option.image
        }))
      }));

      return {
        restaurants: transformedRestaurants,
        nextRequest: data.next_request,
        hasMore: data.restaurants.length > 0 && data.next_request !== null
      };
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw new Error('Failed to load restaurants. Please try again.');
    }
  }

  static async checkQueueStatus(): Promise<{ queue_length: number; processing: boolean; timestamp: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/queue-status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking queue status:', error);
      throw new Error('Failed to check queue status.');
    }
  }

  static async getRestaurantDeliveryOptions(
    restaurantId: number,
    latitude: number,
    longitude: number,
    restaurantName: string,
    chefzData: any
  ): Promise<Array<{
    name: string;
    time: string;
    price: string;
    isFree: boolean;
    image: string;
    merchantData?: any;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/restaurant/${restaurantId}/delivery-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          restaurantName,
          chefzData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.delivery_options || [];
    } catch (error) {
      console.error('Error getting delivery options:', error);
      throw new Error('Failed to load delivery options. Please try again.');
    }
  }
}