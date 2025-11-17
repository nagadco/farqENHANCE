import { X, Star, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface BestOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: {
    name: string;
    rating: number;
    distance: string;
    cuisine: string[];
    deliveryTime: string;
    deliveryPartner: {
      name: string;
      logo: string;
      rating: number;
    };
    offers: {
      discountPrice: number;
      standardPrice: number;
      conditions: string[];
      hasOffer: boolean;
      offerDescription?: string;
      hasPrime?: boolean;
      primeDescription?: string;
    };
    image: string;
    deepLink?: string;
  } | null;
}

export default function BestOfferModal({ isOpen, onClose, restaurant }: BestOfferModalProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  // Format price: show integer if no decimals, otherwise show 1 decimal place
  const formatPrice = (price: number): string => {
    return Number.isInteger(price) ? price.toString() : price.toFixed(1);
  };

  // Determine the best (lowest) price
  const getBestPrice = () => {
    if (!restaurant) return null;

    const prices = [];

    // Add discount price if available and has offer
    if (restaurant.offers.hasOffer && restaurant.offers.discountPrice !== undefined) {
      prices.push(restaurant.offers.discountPrice);
    }

    // Add standard price
    if (restaurant.offers.standardPrice !== undefined) {
      prices.push(restaurant.offers.standardPrice);
    }

    // Add prime price (0) if available
    if (restaurant.offers.hasPrime) {
      prices.push(0);
    }

    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const bestPrice = getBestPrice();
  const isBestPrice = (price: number) => price === bestPrice;

  if (!isOpen || !restaurant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={onClose} />

      {/* Modal - Bottom sheet on mobile, centered on desktop */}
      <div
        className="relative bg-[#F9FAFB] md:bg-white overflow-hidden w-full md:mx-4 md:max-w-md md:rounded-2xl rounded-t-3xl md:rounded-b-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Bottom sheet handle - only visible on mobile */}
        <div className="md:hidden w-full pt-5 pb-4 flex justify-center">
          <div className="w-[32px] h-[4px] bg-[#CDCDCD]" style={{ borderRadius: '100px' }} />
        </div>

        {/* Content wrapper */}
        <div className="p-4 sm:p-6 lg:p-8 pt-2 md:pt-8">
          {/* Close button - only visible on desktop */}
          <button
            onClick={onClose}
            className={`hidden md:block absolute top-4 p-2 hover:bg-gray-100 rounded-full transition-colors ${isRTL ? 'left-4' : 'right-4'}`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex flex-col gap-4 sm:gap-5">
          {/* Restaurant Info */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <div
                className="w-12 h-12 bg-white overflow-hidden rounded-lg flex justify-center items-center"
                style={{ backgroundImage: `url(${restaurant.image})` }}
              >
                <img className="w-12 h-12 object-cover" src={restaurant.image} alt={restaurant.name} />
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <div className="text-[#282A33] text-base sm:text-lg font-semibold leading-6">
                    {restaurant.name}
                  </div>
                </div>

                <div className="h-5 flex items-center gap-1">
                  <div className="flex items-end gap-0.5">
                    <Star className="w-4 h-4 fill-[#009153] text-[#009153]" />
                    <div className="text-[#009153] text-sm sm:text-base font-semibold">
                      {restaurant.rating}
                    </div>
                  </div>
                  <div className="text-[#44505C] text-sm">•</div>
                  <div className="flex-1 flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-[#44505C]" />
                    <div className="flex-1 text-[#44505C] text-sm sm:text-base">
                      {restaurant.distance}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#B2B2B2] opacity-30" />

          {/* Content */}
          <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Delivered by section */}
              <div className="flex flex-col gap-3">
                <div className="text-[#757575] text-sm sm:text-base font-semibold leading-[19.6px]">
                  {t('delivered_by')}:
                </div>
                <div className="h-[53px] flex items-center gap-3">
                  <div
                    className="w-12 h-12 bg-white overflow-hidden rounded-lg border border-black/8 flex justify-center items-center"
                    style={{ backgroundImage: `url(${restaurant.deliveryPartner.logo})` }}
                  >
                    <img
                      className="flex-1 h-[52.47px] object-cover"
                      src={restaurant.deliveryPartner.logo}
                      alt={restaurant.deliveryPartner.name}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <div className="text-[#282D33] text-xl sm:text-2xl font-bold leading-6">
                        {t(restaurant.deliveryPartner.name.toLowerCase().replace(/\s+/g, '')) || restaurant.deliveryPartner.name}
                      </div>
                    </div>
                    <div className="h-5 flex items-center gap-1">
                      <div className="flex-1 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-[#0F172A]" />
                        <div className="flex-1 text-[#282D33] text-base sm:text-lg font-semibold leading-[22.4px]">
                          {t('delivery_time')}: {restaurant.deliveryTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing section */}
              <div className="flex flex-col gap-4 sm:gap-6">
                {/* Show offer price only if there's an offer */}
                {restaurant.offers.hasOffer && (
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col justify-center items-start gap-1">
                      <div className="text-[#282D33] text-xl sm:text-2xl font-semibold leading-6">
                        {t('current_offer_price')}
                      </div>
                      <div className="w-full max-w-[190px] text-[#1E1E1E] text-sm sm:text-base leading-[19.6px]">
                        {restaurant.offers.offerDescription && (
                          <div>• {restaurant.offers.offerDescription}</div>
                        )}
                        {restaurant.offers.conditions.length > 0 && restaurant.offers.conditions.map((condition, index) => (
                          <div key={index}>• {condition}</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-[5px]">
                      {restaurant.offers.discountPrice === 0 ? (
                        <div className="text-[#008000] text-2xl sm:text-3xl font-semibold leading-[28.8px]">
                          {t('free')}
                        </div>
                      ) : (
                        <>
                          <div
                            className="text-2xl sm:text-3xl font-semibold leading-[28.8px]"
                            style={{ color: isBestPrice(restaurant.offers.discountPrice) ? '#008000' : '#000000' }}
                          >
                            {formatPrice(restaurant.offers.discountPrice)}
                          </div>
                          <svg width="22" height="22" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.4443 10.9092C12.395 11.4104 12.2665 11.8888 12.0723 12.3291L7.95996 13.2227C8.00916 12.7213 8.13776 12.2433 8.33203 11.8027L12.4443 10.9092ZM6.67773 6.80469L7.95898 6.52637V2.53125C8.3133 2.08881 8.74946 1.71346 9.24023 1.43164V6.24805L12.4443 5.55176C12.3951 6.05321 12.2666 6.53212 12.0723 6.97266L9.24023 7.58789V8.92676L12.4443 8.23047C12.4074 8.60658 12.3255 8.96959 12.2051 9.31348L12.0723 9.65039L7.95898 10.5449V7.86621L6.67773 8.14453V9.62988C6.67773 9.76556 6.6375 9.8916 6.56836 9.99609L5.90234 11.0068C5.73707 11.2529 5.48227 11.4312 5.18652 11.4941L1.55371 12.2842C1.60292 11.7827 1.73144 11.3038 1.92578 10.8633L5.39648 10.1094V8.42285L2.1582 9.12695C2.20751 8.6255 2.33594 8.14659 2.53027 7.70605L5.39648 7.08398V1.87598C5.7508 1.43353 6.18695 1.05809 6.67773 0.776367V6.80469Z" fill={isBestPrice(restaurant.offers.discountPrice) ? '#008000' : '#000000'}/>
                          </svg>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Standard Price - always show */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col justify-center items-start gap-1">
                    <div className="text-[#282D33] text-xl sm:text-2xl font-semibold leading-6">
                      {t('original_price')}
                    </div>
                    <div className="text-[#282D33] text-sm sm:text-base leading-[19.6px]">
                      {t('applies_to_all_other_users')}
                    </div>
                  </div>
                  <div className="flex items-center gap-[5px]">
                    <div
                      className="text-xl sm:text-2xl font-semibold leading-6"
                      style={{ color: isBestPrice(restaurant.offers.standardPrice) ? '#008000' : '#282D33' }}
                    >
                      {formatPrice(restaurant.offers.standardPrice)}
                    </div>
                    <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.4443 10.9092C12.395 11.4104 12.2665 11.8888 12.0723 12.3291L7.95996 13.2227C8.00916 12.7213 8.13776 12.2433 8.33203 11.8027L12.4443 10.9092ZM6.67773 6.80469L7.95898 6.52637V2.53125C8.3133 2.08881 8.74946 1.71346 9.24023 1.43164V6.24805L12.4443 5.55176C12.3951 6.05321 12.2666 6.53212 12.0723 6.97266L9.24023 7.58789V8.92676L12.4443 8.23047C12.4074 8.60658 12.3255 8.96959 12.2051 9.31348L12.0723 9.65039L7.95898 10.5449V7.86621L6.67773 8.14453V9.62988C6.67773 9.76556 6.6375 9.8916 6.56836 9.99609L5.90234 11.0068C5.73707 11.2529 5.48227 11.4312 5.18652 11.4941L1.55371 12.2842C1.60292 11.7827 1.73144 11.3038 1.92578 10.8633L5.39648 10.1094V8.42285L2.1582 9.12695C2.20751 8.6255 2.33594 8.14659 2.53027 7.70605L5.39648 7.08398V1.87598C5.7508 1.43353 6.18695 1.05809 6.67773 0.776367V6.80469Z" fill={isBestPrice(restaurant.offers.standardPrice) ? '#008000' : '#000000'}/>
                    </svg>
                  </div>
                </div>

                {/* Prime Option - show if available */}
                {restaurant.offers.hasPrime && (
                  <div className="flex justify-between items-center bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-2 border-amber-300 rounded-xl p-4 shadow-md">
                    <div className="flex flex-col justify-center items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </div>
                        <div className="text-amber-900 text-xl sm:text-2xl font-bold leading-6 tracking-wide">
                          PRIME
                        </div>
                      </div>
                      <div className="text-amber-800 text-sm sm:text-base font-medium leading-[19.6px]">
                        {t('prime_members_only')}
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-lg border-2 border-amber-400 shadow-sm">
                      <div className="text-amber-900 text-xl sm:text-2xl font-bold leading-[28.8px]">
                        {t('free')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Button */}
            <button
              onClick={() => {
                if (restaurant.deepLink) {
                  window.open(restaurant.deepLink, '_blank');
                }
              }}
              className="self-stretch px-4 sm:px-6 py-3 sm:py-4 bg-[#043434] rounded-lg flex justify-center items-center gap-1.5 hover:bg-[#033232] transition-colors"
            >
              <div className="text-center text-[#F8FAFC] text-lg sm:text-xl font-semibold leading-[22px]">
                {t('order_on')} {t(restaurant.deliveryPartner.name.toLowerCase().replace(/\s+/g, '')) || restaurant.deliveryPartner.name}
              </div>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}