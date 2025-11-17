export type DeliveryOptionStatus = 'loading' | 'success' | 'not_found' | 'error';

export interface DeliveryOption {
  name: string;
  time: string;
  price: string | number;
  originalPrice?: string | null; // السعر الأصلي قبل الخصم (للعرض مشطوباً)
  isFree?: boolean;
  hasOffer?: boolean; // هل يوجد عرض
  hasPrime?: boolean; // هل Prime متاح
  pricingType?: 'standard' | 'offer' | 'prime'; // نوع السعر
  savedAmount?: number | string | null; // المبلغ الموفر (رقم فقط)
  image?: string;
  status?: DeliveryOptionStatus;
  errorMessage?: string;
  deepLink?: string;
  merchantData?: any;
  deliveryOffer?: string | null;
  deliveryDetails?: any;
}

export interface Restaurant {
  id?: number;
  name: string;
  nameAr?: string;
  rating: number;
  distance: string;
  tags: string[];
  image: string;
  deliveryOptions: DeliveryOption[];
  isClosed?: boolean;
  expanded?: boolean;
  loadingPrices?: boolean;
  pricesLoaded?: boolean;
  chefzData?: any;
}