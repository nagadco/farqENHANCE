import React from 'react';
import { MapPin, Clock, Star, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { Restaurant } from '../types/restaurant';
import { useLanguage } from '../contexts/LanguageContext';

interface RestaurantCardProps extends Restaurant {
  onLoadPricesClick?: (restaurant: Restaurant) => void;
  onDeliveryOptionClick?: (restaurant: Restaurant, deliveryOption: any) => void;
}

export default function RestaurantCard({
  id,
  name,
  rating,
  distance,
  tags,
  image,
  deliveryOptions,
  isClosed = false,
  expanded = false,
  loadingPrices = false,
  pricesLoaded = false,
  chefzData,
  onLoadPricesClick,
  onDeliveryOptionClick
}: RestaurantCardProps) {
  const { translateTag, t, language } = useLanguage();
  const [showPrices, setShowPrices] = React.useState(true);
  const isRTL = language === 'ar';

  // Format price: show integer if no decimals, otherwise show 1 decimal place
  const formatPrice = (price: number): string => {
    return Number.isInteger(price) ? price.toString() : price.toFixed(1);
  };

  // Find the best (lowest) price among delivery options
  const getBestPrice = () => {
    const numericPrices = deliveryOptions
      .filter(option => !option.isFree)
      .map(option => typeof option.price === 'string' ? parseFloat(option.price) : option.price)
      .filter(price => !isNaN(price));

    return numericPrices.length > 0 ? Math.min(...numericPrices) : null;
  };

  const bestPrice = getBestPrice();
  const hasFreeOption = deliveryOptions.some(option => option.isFree);

  const isBestPrice = (option: typeof deliveryOptions[0]) => {
    // If this option is free and there's a free option, it's the best
    if (option.isFree) return true;

    // If there's a free option and this one isn't free, it's not the best
    if (hasFreeOption && !option.isFree) return false;

    // No free options, compare prices
    if (bestPrice !== null) {
      const optionPrice = typeof option.price === 'string' ? parseFloat(option.price) : option.price;
      const isBest = optionPrice === bestPrice;
      return isBest;
    }

    return false;
  };
  return (
    <div
      className={`w-full max-w-[333px] bg-white rounded-2xl border overflow-hidden relative ${isClosed ? 'opacity-75 border-gray-300' : 'border-gray-200'
        }`}
    >
      {/* Closed Overlay */}
      {isClosed && (
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10 flex items-center justify-center">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm">
            CLOSED
          </div>
        </div>
      )}

      {/* Restaurant Header */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Restaurant Image */}
          <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-gray-100">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/48x48';
              }}
            />
          </div>

          {/* Restaurant Info */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[#282A33] text-base font-semibold leading-6">
                {name}
              </h3>
              {isClosed && (
                <span className="text-red-600 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                  Closed
                </span>
              )}
            </div>

            {/* Rating and Distance */}
            <div className="flex items-center gap-1 h-5">
              <div className="flex items-center gap-0.5">
                <Star className="w-4 h-4 fill-[#009153] text-[#009153]" />
                <span className="text-[#009153] text-sm font-semibold">
                  {rating}
                </span>
              </div>
              <span className="text-[#44505C] text-sm">•</span>
              <div className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-[#44505C]" />
                <span className="text-[#44505C] text-sm">
                  {distance}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-1 flex-wrap min-h-[20px]">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="px-1 py-0.5 bg-[#F7FAFC] border border-[#EBF1F7] rounded text-[#282A33] text-xs font-semibold whitespace-nowrap"
                >
                  {translateTag(tag)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#EAE9E9]" />

      {/* Delivery Prices Section */}
      {deliveryOptions.length > 0 && (loadingPrices || pricesLoaded) && showPrices && (
        <>
          {/* Delivery Prices Header */}
          <div className="px-4 py-2 flex justify-start">
            <span className="text-[#655151] text-xs font-semibold">
              {t('delivery_prices')}
            </span>
          </div>

          {/* Delivery Options */}
          <div className="flex flex-col">
            {deliveryOptions.map((option, index) => {
                // التطبيق قابل للنقر إذا:
                // 1. المطعم مفتوح
                // 2. ليس في حالة تحميل
                // 3. لديه وقت توصيل حقيقي (ليس ... أو N/A)
                const isClickable = !isClosed &&
                  option.status !== 'loading' &&
                  option.time &&
                  option.time !== '...' &&
                  option.time !== 'N/A';

                return (
                  <div
                    key={index}
                    className={`px-4 py-2 transition-all ${isClosed ? 'opacity-60' : ''} ${isClickable
                      ? `cursor-pointer hover:bg-[#F4F4F4] ${isRTL ? 'hover:border-r-4' : 'hover:border-l-4'} hover:border-[#75F0A8]`
                      : ''
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isClickable && onDeliveryOptionClick) {
                        onDeliveryOptionClick({
                          id,
                          name,
                          rating,
                          distance,
                          tags,
                          image,
                          deliveryOptions,
                          isClosed,
                          chefzData
                        }, option);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Delivery Service Icon */}
                      <div className="w-9 h-9 bg-white rounded-md border border-gray-100 overflow-hidden flex-shrink-0">
                        <img
                          src={option.image || `/delivery_logos/${option.name.toLowerCase().replace(/\s+/g, '-')}.png`}
                          alt={option.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/36x39';
                          }}
                        />
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <h4 className="text-[#282A33] text-sm sm:text-base font-semibold truncate">
                          {t(option.name.toLowerCase().replace(/\s+/g, '')) || option.name}
                        </h4>
                        {option.status === 'loading' ? (
                          <div className="flex items-center gap-1">
                            <Loader2 className="w-4 h-4 text-[#043434] animate-spin flex-shrink-0" />
                            <span className="text-[#043434] text-xs sm:text-sm font-medium">
                              {t('loading_prices')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#0F172A] flex-shrink-0" />
                            <span className="text-[#282D33] text-xs sm:text-sm">
                              {option.time}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Price or Status */}
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        {option.status === 'loading' ? (
                          <Loader2 className="w-5 h-5 text-[#043434] animate-spin" />
                        ) : isClosed ? (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded-md">
                            <span className="text-gray-500 text-sm sm:text-base font-semibold">
                              {t('unavailable')}
                            </span>
                          </div>
                        ) : option.isFree ? (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 rounded-md">
                            <span className="text-[#008000] text-sm sm:text-base font-semibold">
                              {t('free')}
                            </span>
                          </div>
                        ) : (
                          <>
                            {/* Current Price Only */}
                            <div className="flex items-center gap-1">
                              <span
                                className="text-base font-semibold"
                                style={{ color: (isBestPrice(option) || option.deliveryOffer) ? '#008000' : '#000000' }}
                              >
                                {formatPrice(typeof option.price === 'string' ? parseFloat(option.price) : option.price)}
                              </span>
                              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.4443 10.9092C12.395 11.4104 12.2665 11.8888 12.0723 12.3291L7.95996 13.2227C8.00916 12.7213 8.13776 12.2433 8.33203 11.8027L12.4443 10.9092ZM6.67773 6.80469L7.95898 6.52637V2.53125C8.3133 2.08881 8.74946 1.71346 9.24023 1.43164V6.24805L12.4443 5.55176C12.3951 6.05321 12.2666 6.53212 12.0723 6.97266L9.24023 7.58789V8.92676L12.4443 8.23047C12.4074 8.60658 12.3255 8.96959 12.2051 9.31348L12.0723 9.65039L7.95898 10.5449V7.86621L6.67773 8.14453V9.62988C6.67773 9.76556 6.6375 9.8916 6.56836 9.99609L5.90234 11.0068C5.73707 11.2529 5.48227 11.4312 5.18652 11.4941L1.55371 12.2842C1.60292 11.7827 1.73144 11.3038 1.92578 10.8633L5.39648 10.1094V8.42285L2.1582 9.12695C2.20751 8.6255 2.33594 8.14659 2.53027 7.70605L5.39648 7.08398V1.87598C5.7508 1.43353 6.18695 1.05809 6.67773 0.776367V6.80469Z" fill={(isBestPrice(option) || option.deliveryOffer) ? '#008000' : '#000000'}/>
                              </svg>
                            </div>


                            {/* Prime Badge - show if Prime is available and free */}
                            {option.hasPrime && (
                              <div className="px-2 py-0.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-md text-[10px] font-bold text-amber-900 text-center flex items-center gap-1 max-w-[140px] shadow-sm">
                                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span className="truncate">PRIME</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {/* Load Prices Button */}
      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onLoadPricesClick && !pricesLoaded) {
              setShowPrices(true);
              onLoadPricesClick({
                id,
                name,
                rating,
                distance,
                tags,
                image,
                deliveryOptions,
                isClosed,
                expanded,
                loadingPrices,
                pricesLoaded,
                chefzData: chefzData
              });
            } else if (pricesLoaded) {
              setShowPrices(!showPrices);
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          disabled={loadingPrices}
        >
          {loadingPrices ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium text-gray-600">{t('loading_prices')}</span>
            </>
          ) : pricesLoaded ? (
            <>
              <span className="text-sm font-medium text-green-600">{t('prices_loaded')}</span>
              {showPrices ? (
                <ChevronUp className="w-4 h-4 text-green-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-green-500" />
              )}
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-700">{t('load_delivery_prices')}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
