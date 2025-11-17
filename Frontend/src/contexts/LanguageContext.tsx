import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  translateTag: (tag: string) => string;
}

// Tag translations mapping (Arabic to English)
const tagTranslations: { [key: string]: string } = {
  'برجر': 'Burger',
  'برغر': 'Burger',
  'دجاج': 'Chicken',
  'فراخ': 'Chicken',
  'عربي': 'Arabic',
  'عربية': 'Arabic',
  'صحي': 'Healthy',
  'صحية': 'Healthy',
  'شاورما': 'Shawarma',
  'شاورمة': 'Shawarma',
  'بيتزا': 'Pizza',
  'بيزا': 'Pizza',
  'قهوة': 'Coffee',
  'كوفي': 'Coffee',
  'مشويات': 'Grill',
  'مشاوي': 'Grill',
  'سمك': 'Seafood',
  'مأكولات بحرية': 'Seafood',
  'آسيوي': 'Asian',
  'آسيوية': 'Asian',
  'سندويش': 'Sandwich',
  'ساندويتش': 'Sandwich',
  'مكسيكي': 'Mexican',
  'مكسيكية': 'Mexican',
  'باستا': 'Pasta',
  'معكرونة': 'Pasta',
  'وجبات سريعة': 'Fast Food',
  'فاست فود': 'Fast Food',
  'حلويات': 'Desserts',
  'حلى': 'Desserts',
  'مخبوزات': 'Bakery',
  'مطعم': 'Restaurant',
  'مطاعم': 'Restaurant',
  'ايطالي': 'Italian',
  'ايطالية': 'Italian',
  'هندي': 'Indian',
  'هندية': 'Indian',
  'ياباني': 'Japanese',
  'يابانية': 'Japanese',
  'صيني': 'Chinese',
  'صينية': 'Chinese',
  'كوري': 'Korean',
  'كورية': 'Korean',
  'تركي': 'Turkish',
  'تركية': 'Turkish',
  'لبناني': 'Lebanese',
  'لبنانية': 'Lebanese',
  'سوري': 'Syrian',
  'سورية': 'Syrian',
  'مصري': 'Egyptian',
  'مصرية': 'Egyptian',
  'مغربي': 'Moroccan',
  'مغربية': 'Moroccan',
  'فرنسي': 'French',
  'فرنسية': 'French',
  'امريكي': 'American',
  'امريكية': 'American',
  'ستيك': 'Steak',
  'لحم': 'Meat',
  'لحوم': 'Meat',
  'نباتي': 'Vegetarian',
  'نباتية': 'Vegetarian',
  'نباتي صرف': 'Vegan',
  'سوشي': 'Sushi',
  'سلطات': 'Salads',
  'سلطة': 'Salad',
  'حساء': 'Soup',
  'شوربة': 'Soup',
  'فطور': 'Breakfast',
  'إفطار': 'Breakfast',
  'غداء': 'Lunch',
  'عشاء': 'Dinner',
  'مقبلات': 'Appetizers',
  'عصائر': 'Juices',
  'عصير': 'Juice',
  'مشروبات': 'Drinks',
  'مشروب': 'Drink',
  'آيس كريم': 'Ice Cream',
  'ايس كريم': 'Ice Cream',
  'كيك': 'Cake',
  'كعك': 'Cake',
  'فطائر': 'Pies',
  'فطيرة': 'Pie',
  'مناقيش': 'Manakish',
  'منقوشة': 'Manakish',
  'فلافل': 'Falafel',
  'حمص': 'Hummus',
  'كباب': 'Kebab',
  'كبسة': 'Kabsa',
  'مندي': 'Mandi',
  'برياني': 'Biryani',
  'كاري': 'Curry',
  'نودلز': 'Noodles',
  'رامن': 'Ramen',
  'تاكو': 'Taco',
  'بوريتو': 'Burrito',
  'ناتشوز': 'Nachos',
  'بروست': 'Broasted',
  'مقلي': 'Fried',
  'مشوي': 'Grilled',
  'تندوري': 'Tandoori',
  'عالمي': 'International',
  'عالمية': 'International',
  'الجمعات': 'Jumaat',
  'مأكولات شرقية': 'Eastern Cuisine',
  'شرقية': 'Eastern',
  'شرقي': 'Eastern',
  'بيتزا وباستا': 'Pizza & Pasta',
  'مطاعم فاخرة': 'Fine Dining',
  'فاخرة': 'Fine Dining',
  'فاخر': 'Fine Dining',
  'مأكولات': 'Cuisine',
  'طعام': 'Food',
  'أطعمة': 'Food',
  'سعودي': 'Saudi',
  'سعودية': 'Saudi',
  'عروض': 'Offers',
  'عرض': 'Offer',
  'عروض اليوم الوطني': 'National Day Offers',
  'عروض اليوم الوطني 95': 'National Day 95 Offers',
  'اليوم الوطني': 'National Day',
  'اليوم الوطني 95': 'National Day 95'
};

// Helper function to detect if text is Arabic
const isArabic = (text: string): boolean => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
};

const translations = {
  en: {
    'welcome': 'Welcome to Farq',
    'location_description': 'We need your location to show nearby restaurants and delivery prices',
    'enable_location': 'Enable Location',
    'privacy_text': 'We will only use your location to display nearby restaurants and will not share it with any third party',
    'best_offers': 'Best offers',
    'search_placeholder': 'Search for a restaurant or type of food',
    'search_mobile_placeholder': 'Search for Restaurants',
    'sort_by_distance': 'Sort by Distance',
    'sort_by_price': 'Sort by Price',
    'sort_by_rating': 'Sort by Rating',
    'search_results': 'Search Results',
    'no_restaurants': 'No restaurants found',
    'try_different_search': 'Try searching for a different restaurant, food type, or delivery app',
    'search': 'Search',
    'delivery_prices': 'Delivery Prices',
    'free': 'Free',
    'delivered_by': 'Delivered by',
    'delivery_time': 'Delivery Time',
    'discount_price': 'Discount Price',
    'standard_price': 'Standard Price',
    'standard_delivery_description': 'Standard delivery price for all users',
    'order_on': 'Order on',
    'loading': 'Loading',
    'save_more_by_comparing': 'Save More by Comparing',
    'save_more_description': 'On average, users in Saudi Arabia save up to 20–25% by checking the same meal across different delivery apps',
    'previous': 'Previous',
    'next': 'Next',
    'searching_restaurants': 'Searching restaurants',
    'analyzing_prices': 'Analyzing prices',
    'comparing_offers': 'Comparing offers',
    'finding_best_deals': 'Finding best deals',
    'calculating_savings': 'Calculating savings',
    'almost_ready': 'Almost ready',
    'tip_compare_prices': 'Compare Before You Order',
    'tip_compare_prices_desc': 'The same restaurant can have different prices across delivery apps. Always compare to find the best deal',
    'tip_track_favorites': 'Save Your Favorites',
    'tip_track_favorites_desc': 'Keep track of your go-to restaurants and compare their prices instantly whenever you\'re hungry',
    'tip_delivery_fees': 'Watch Delivery Fees',
    'tip_delivery_fees_desc': 'Delivery fees can vary significantly. Sometimes a higher menu price with lower delivery fees saves you money',
    'loading_prices': 'Loading...',
    'restaurant_not_found': 'Restaurant not found',
    'error_occurred': 'An error occurred',
    'click_for_details': '👆 Click for details',
    'delivery_price': 'Delivery Price',
    'standard_delivery_fee': 'Standard delivery fee',
    'prime': 'Prime',
    'prime_free': 'Free for Prime members',
    'prime_members_only': 'Exclusive for Prime members',
    'unavailable': 'Unavailable',
    'save_amount': 'Save',
    'sar': 'SAR',
    'or': 'or',
    'load_delivery_prices': 'Load delivery prices',
    'prices_loaded': 'Prices loaded',
    'location_access_required': 'Location access required',
    'allow_location_message': 'Please allow location access to see restaurants near you',
    'refresh_page': 'Refresh Page',
    'unable_to_determine_location': 'Unable to determine your location. Please check your device settings.',
    'location_denied': 'Location access denied. Please allow location access in your browser settings.',
    'location_timeout': 'Location request timed out. Please try again.',
    'all_prices_in_one_place': 'All food delivery prices in one place. More visibility, zero cost',
    'jahez': 'Jahez',
    'hungerstation': 'Hunger Station',
    'toyou': 'ToYou',
    'thechefs': 'The Chefz',
    'thechefz': 'The Chefz',
    'minimum_fee_applied': 'Minimum fee applied',
    'reviews': 'reviews',
    'current_offer_price': 'Current Offer Price',
    'new_users': 'New Users',
    'plus_memberships': 'Plus Memberships',
    'orders_above': 'Orders above',
    'original_price': 'Original Price',
    'applies_to_all_other_users': 'Applies to all other users',
    'set_location': 'Set location'
  },
  ar: {
    'welcome': 'مرحبًا بك في فرق',
    'location_description': 'نحتاج إلى موقعك لنعرض لك المطاعم القريبة وأسعار التوصيل بدقة',
    'enable_location': 'السماح باستخدام الموقع',
    'privacy_text': 'نستخدم موقعك فقط لعرض المطاعم القريبة، ولن نشاركه مع أي جهة خارجية.',
    'best_offers': 'أفضل العروض',
    'search_placeholder': 'ابحث عن مطعم أو نوع طعام',
    'search_mobile_placeholder': 'ابحث عن المطاعم',
    'sort_by_distance': 'ترتيب حسب المسافة',
    'sort_by_price': 'ترتيب حسب السعر',
    'sort_by_rating': 'ترتيب حسب التقييم',
    'search_results': 'نتائج البحث',
    'no_restaurants': 'لم يتم العثور على مطاعم',
    'try_different_search': 'جرب البحث عن مطعم أو نوع طعام أو تطبيق توصيل مختلف',
    'search': 'بحث',
    'delivery_prices': 'أسعار التوصيل',
    'free': 'مجاني',
    'delivered_by': 'توصيل بواسطة',
    'delivery_time': 'وقت التوصيل',
    'discount_price': 'السعر بالخصم',
    'standard_price': 'السعر العادي',
    'standard_delivery_description': 'سعر التوصيل العادي لجميع المستخدمين',
    'order_on': 'اطلب من',
    'loading': 'جاري التحميل',
    'save_more_by_comparing': 'وفّر أكثر بمقارنة الأسعار',
    'save_more_description': 'في السعودية، يمكن للمستخدمين توفير 20–25٪ عند مقارنة أسعار نفس الوجبة في تطبيقات توصيل مختلفة.',
    'previous': 'السابق',
    'next': 'التالي',
    'searching_restaurants': 'البحث عن المطاعم',
    'analyzing_prices': 'تحليل الأسعار',
    'comparing_offers': 'مقارنة العروض',
    'finding_best_deals': 'البحث عن أفضل الصفقات',
    'calculating_savings': 'حساب التوفيرات',
    'almost_ready': 'تقريباً جاهز',
    'tip_compare_prices': 'قارن قبل الطلب',
    'tip_compare_prices_desc': 'نفس المطعم يمكن أن يكون له أسعار مختلفة عبر تطبيقات التوصيل. قارن دائماً للحصول على أفضل صفقة',
    'tip_track_favorites': 'احفظ مطاعمك المفضلة',
    'tip_track_favorites_desc': 'تابع مطاعمك المفضلة وقارن أسعارها فوراً عندما تشعر بالجوع',
    'tip_delivery_fees': 'راقب رسوم التوصيل',
    'tip_delivery_fees_desc': 'رسوم التوصيل يمكن أن تختلف بشكل كبير. أحياناً سعر أعلى مع رسوم توصيل أقل يوفر لك المال',
    'loading_prices': 'جاري التحميل...',
    'restaurant_not_found': 'لم يتم العثور على المطعم',
    'error_occurred': 'حدث خطأ',
    'click_for_details': '👆 اضغط للتفاصيل',
    'delivery_price': 'سعر التوصيل',
    'standard_delivery_fee': 'رسوم التوصيل العادية',
    'prime': 'برايم',
    'prime_free': 'مجاني لمشتركي Prime',
    'prime_members_only': 'حصرياً لمشتركي برايم',
    'unavailable': 'غير متاح',
    'save_amount': 'وفر',
    'sar': 'ريال',
    'or': 'أو',
    'load_delivery_prices': 'عرض أسعار التوصيل',
    'prices_loaded': 'تم تحميل الأسعار',
    'location_access_required': 'مطلوب السماح بالوصول للموقع',
    'allow_location_message': 'يرجى السماح بالوصول للموقع لعرض المطاعم القريبة منك',
    'refresh_page': 'تحديث الصفحة',
    'all_prices_in_one_place': 'جميع أسعار توصيل الطعام في مكان واحد. المزيد من الرؤية، صفر تكلفة',
    'jahez': 'جاهز',
    'hungerstation': 'هنقرستيشن',
    'toyou': 'تويو',
    'thechefs': 'ذا شفز',
    'thechefz': 'ذا شفز',
    'minimum_fee_applied': 'تم تطبيق الحد الأدنى من الرسوم',
    'reviews': 'تقييم',
    'current_offer_price': 'سعر العرض الحالي',
    'new_users': 'للمستخدمين الجدد',
    'plus_memberships': 'عضويات بلس',
    'orders_above': 'الطلبات فوق',
    'original_price': 'السعر الأصلي',
    'applies_to_all_other_users': 'ينطبق على جميع المستخدمين الآخرين',
    'unable_to_determine_location': 'غير قادر على تحديد موقعك. يرجى التحقق من إعدادات جهازك.',
    'location_denied': 'تم رفض الوصول للموقع. يرجى السماح بالوصول للموقع من إعدادات المتصفح.',
    'location_timeout': 'انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى.',
    'set_location': 'تحديد الموقع'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Initialize language from localStorage or default to 'ar'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'ar';
  });

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const translateTag = (tag: string): string => {
    // If language is Arabic, return tag as-is
    if (language === 'ar') {
      return tag;
    }

    // If language is English and tag is in Arabic, translate it
    if (language === 'en' && isArabic(tag)) {
      // Try dictionary first for common terms
      if (tagTranslations[tag]) {
        return tagTranslations[tag];
      }

      // Try case-insensitive match
      const lowerTag = tag.toLowerCase().trim();
      for (const [arKey, enValue] of Object.entries(tagTranslations)) {
        if (arKey.toLowerCase() === lowerTag) {
          return enValue;
        }
      }

      // If no translation in dictionary, use Google Translate via libre-translate or keep Arabic
      // For now, we'll use a simple transliteration or keep original
      // You can integrate with translation API here
      console.warn(`No translation found for tag: "${tag}" - Consider adding to dictionary`);
      return tag;
    }

    // If tag is already in English or language is Arabic, return as-is
    return tag;
  };

  const value: LanguageContextType = {
    language,
    toggleLanguage,
    t,
    translateTag
  };

  return (
    <LanguageContext.Provider value={value}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={language === 'ar' ? 'font-arabic' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}