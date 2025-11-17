const axios = require('axios');
const GeminiMatcher = require('./ai-matcher');
const ResponseLogger = require('./response-logger');

class JahezAPI {
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.baseURL = 'https://jahez-portal-gateway.jahez.net';

        // Initialize response logger
        this.logger = new ResponseLogger('Jahez');

        // Branch.io configuration for deep links
        this.branchKey = 'key_live_ap6dqzSQIhuvEV8ltsQXYomeBsnw6APu';
        this.branchURL = 'https://api2.branch.io/v1/url';

        // User credentials
        this.userId = '20690575';
        this.deviceId = 'B13F525C-0275-4678-B943-C4605831AE8B';
        this.token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJleHAiOjE3NjQ0MzkwMzgsInVzZXJJZCI6IjIwNjkwNTc1IiwiaWFtVXNlcklkIjoiNTIxNDRhYmEtODdlYi00ZGU5LWJlMWEtMGM4NjM2NGM2YmQxIiwidXNlclR5cGUiOiJDIiwidXNlck5hbWUiOiI5NjY1MzkzMjI5MDAiLCJsYXN0TmFtZSI6Im1vaGFtbWVkIiwicm9sZSI6IkNVU1RPTUVSIiwicHJpbWVFeHBpcnlEYXRlIjoiMjAyNS0wNS0wNVQwMDowMDowMC4wMDErMDM6MDBbQXNpYS9SaXlhZGhdIiwic2NvcGUiOiJhcHBVc2VyIn0.cXnh_hQ0zTTy4Awxr8ordSxLIFz8BZVOyNbezKavWtQRLV3pRkV4Os4nk3eiykAPj370WXeZepx64ZJ04GwwhyYJ2O45KDWOoZq-qvmq679cdJ1QmmkdwRNHi9S88P9zk_gzabPewjdWIEG4tkCIy2wBOfEzlCAeKNtJ1xleLkAQnHAuML-QbWDZLciLXjoEkHstAKXoukg8pKgGxsIYS8sO7ONlY4zrqKb43iupT1ObJJON8eH2dHdeNOJO9nTQOWbc5O-pwAFIIih240BA4D7d9OtyTuJSFkMGNchokzqdqhfHkFEWj6mT81n1k0j4g-wrbS3772qmvxBLXgOB1A';

        // Headers required for Jahez API (matching exact curl headers)
        this.headers = {
            'Host': 'jahez-portal-gateway.jahez.net',
            'Userid': this.userId,
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Accept-Language': 'ar',
            'X-User-Device-Id': this.deviceId,
            'User-Agent': `os=IOS osVersion=18.5 appVersion=423.6 userId=${this.userId}`,
            'Authorization': `Bearer ${this.token}`,
            'Accept-Encoding': 'gzip, deflate'
        };
    }

    /**
     * Create dynamic deep link using Branch.io API
     * This creates a short link that properly opens the restaurant in the app
     */
    async createDeepLink(restaurantId, branchId, restaurantName = '') {
        try {
            const payload = {
                branch_key: this.branchKey,
                data: {
                    '$canonical_url': 'jahez-customer',
                    '$publicly_indexable': true,
                    '$locally_indexable': true,
                    '$canonical_identifier': 'restaurant',
                    'type': 'Share Restaurant',
                    'restaurant_id': restaurantId.toString(),
                    'branch_id': branchId.toString(),
                    '$og_title': restaurantName || 'Jahez Restaurant',
                    '$og_image_url': `https://portal.jahez.net/ShowRestaurantLogo.htm?lang=en&restaurantId=${restaurantId}`,
                    '$og_image_width': '300',
                    '$og_image_height': '300',
                    '$desktop_url': 'https://jahez.sa',
                    '$ios_url': 'https://jahez.app.link/ios',
                    '$android_url': 'https://play.google.com/store/apps/details?id=net.jahez'
                }
            };

            const response = await axios.post(this.branchURL, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.url) {
                console.log(`✅ Created deep link: ${response.data.url}`);
                return response.data.url;
            }

            console.log('⚠️ Branch.io did not return a URL, using fallback');
            return `https://jahez-alternate.app.link/?restaurantId=${restaurantId}&branchId=${branchId}`;
        } catch (error) {
            console.error('❌ Error creating deep link:', error.message);
            // Fallback to universal link
            return `https://jahez-alternate.app.link/?restaurantId=${restaurantId}&branchId=${branchId}`;
        }
    }

    /**
     * Extract English name only from combined name
     * Example: "Genneh | جنيه" -> "Genneh"
     */
    extractEnglishName(restaurantName) {
        // Try splitting by common separators
        const separators = [' | ', ' - ', '|', '-'];

        for (const separator of separators) {
            if (restaurantName.includes(separator)) {
                const parts = restaurantName.split(separator).map(p => p.trim());

                // Find the English part (contains English letters, no Arabic)
                for (const part of parts) {
                    const hasEnglish = /[a-zA-Z]/.test(part);
                    const hasArabic = /[\u0600-\u06FF]/.test(part);

                    if (hasEnglish && !hasArabic) {
                        return part;
                    }
                }
            }
        }

        // No separator found, return as is if it contains English
        const hasEnglish = /[a-zA-Z]/.test(restaurantName);
        return hasEnglish ? restaurantName : '';
    }

    /**
     * Search for restaurants by any name (English, Arabic, or mixed)
     */
    async searchRestaurants(searchText, pageSize = 50) {
        try {
            const url = `${this.baseURL}/restaurant-list/v2/searchNearestRestaurants`;

            if (!searchText || searchText.trim().length === 0) {
                console.log(`⚠️ Empty search text provided`);
                return [];
            }

            console.log(`🔍 Jahez API: Searching with "${searchText}"`);

            const params = {
                lat: this.latitude,
                lon: this.longitude,
                searchText: searchText.trim(),
                page: 0,
                pageSize: pageSize
            };

            const response = await axios.get(url, {
                headers: this.headers,
                params: params
            });

            const data = response.data;

            // Log the response
            this.logger.log('search_restaurants', { params, url, searchText }, data, response.status, 'GET');

            const restaurants = data?.restaurantList || [];
            console.log(`✅ Found ${restaurants.length} restaurants`);

            // Print all restaurant names for debugging
            if (restaurants.length > 0) {
                console.log(`📋 Jahez search results:`);
                restaurants.forEach((r, index) => {
                    console.log(`   ${index + 1}. "${r.restaurantName}" (ID: ${r.restaurantId})`);
                });
            }

            return restaurants;
        } catch (error) {
            console.error('Error searching Jahez restaurants:', error.message);

            // Log the error
            this.logger.logError('search_restaurants', { url, searchText }, error);

            return [];
        }
    }

    /**
     * Get restaurant menu
     */
    async getRestaurantMenu(restaurantId, branchId) {
        try {
            const url = `${this.baseURL}/partner/api/v1/customer-mobile/customerMenu`;

            const params = {
                restaurantId: restaurantId,
                branchId: branchId
            };

            const response = await axios.get(url, {
                headers: this.headers,
                params: params
            });

            const data = response.data;

            // Log the response
            this.logger.log('get_menu', { params, url, restaurantId, branchId }, data, response.status, 'GET');

            return data?.content?.categoryList || [];
        } catch (error) {
            console.error('Error getting Jahez menu:', error.message);

            // Log the error
            this.logger.logError('get_menu', { url, restaurantId, branchId }, error);

            return [];
        }
    }

    /**
     * Calculate delivery fee by adding a sample item to cart
     */
    async calculateDeliveryFee(restaurantId, branchId, sampleItem) {
        try {
            const url = `${this.baseURL}/new-order/api/v5/cart/create?`;

            const payload = {
                deliveryType: "H",
                menuItems: [{
                    itemOptions: [],
                    itemId: sampleItem.itemId,
                    quantity: 1,
                    uniqueId: Date.now().toString(),
                    image: sampleItem.image || ""
                }],
                useCustomerWallet: false,
                branchId: branchId.toString(),
                deliveryLocation: {
                    longitude: this.longitude,
                    latitude: this.latitude
                },
                restaurantId: parseInt(restaurantId),
                customerLocation: {
                    longitude: this.longitude,
                    latitude: this.latitude,
                    fullAddress: "User Location"
                }
            };

            // Headers for POST request (no Userid header for calculate endpoint)
            const postHeaders = {
                'Host': 'jahez-portal-gateway.jahez.net',
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Accept-Language': 'en',
                'Authorization': `Bearer ${this.token}`,
                'X-User-Device-Id': this.deviceId,
                'User-Agent': `os=IOS osVersion=18.5 appVersion=423.6 userId=${this.userId}`,
                'Accept-Encoding': 'gzip, deflate'
            };

            const response = await axios.post(url, payload, {
                headers: postHeaders
            });

            const data = response.data;

            // Log the response
            this.logger.log('calculate_delivery_cart', { url, payload, restaurantId, branchId }, data, response.status, 'POST');

            // Log key fields for debugging
            console.log(`📦 Jahez cart - Order subtotal: ${data?.invoiceBeforeDiscount?.subTotal} SAR`);
            console.log(`📦 Jahez cart - Delivery price (with VAT): ${data?.invoiceBeforeDiscount?.delivery} SAR`);
            if (response.data?.delivery?.appliedOffer) {
                console.log(`🎁 Jahez: Offer detected:`, response.data.delivery.appliedOffer);
            }
            if (response.data?.primeEligibility) {
                console.log(`👑 Jahez: Prime detected:`, response.data.primeEligibility);
            }

            // Extract all pricing information
            // السعر الأصلي من delivery.originalDeliveryPrice (قبل الضريبة) + نضيف 15% VAT
            const originalDeliveryPriceWithoutVAT = data?.delivery?.originalDeliveryPrice || data?.delivery?.tier?.tierPrice || null;
            const originalDeliveryPrice = originalDeliveryPriceWithoutVAT ? Math.round(originalDeliveryPriceWithoutVAT * 1.15 * 100) / 100 : null;

            const offerDeliveryPrice = data?.offer?.delivery ?? null; // السعر بعد العرض (مع الضريبة)
            const primeDeliveryPrice = data?.primeEligibility?.delivery ?? null; // السعر للـ Prime (مع الضريبة) - استخدم ?? لأن 0 قيمة صحيحة
            const hasAppliedOffer = !!data?.delivery?.appliedOffer; // هل يوجد عرض مطبق
            const hasPrimeEligibility = primeDeliveryPrice === 0; // هل Prime متاح ومجاني (delivery === 0)

            // Determine final delivery price and pricing type
            let deliveryPrice;
            let pricingType = 'standard'; // standard, offer, prime

            // Priority 1: If there's an applied offer, use offer price
            if (hasAppliedOffer && offerDeliveryPrice !== null) {
                deliveryPrice = offerDeliveryPrice;
                pricingType = 'offer';
                console.log(`📦 Using offer delivery price: ${deliveryPrice} SAR (Original: ${originalDeliveryPrice} SAR)`);
            }
            // Priority 2: If Prime eligible with free delivery (uncomment to prioritize Prime)
            // else if (hasPrimeEligibility) {
            //     deliveryPrice = primeDeliveryPrice;
            //     pricingType = 'prime';
            //     console.log(`📦 Using Prime delivery price: ${deliveryPrice} SAR (Free for Prime members)`);
            // }
            // Priority 3: Use standard price
            else {
                deliveryPrice = originalDeliveryPrice;
                pricingType = 'standard';
                console.log(`📦 Using standard delivery price: ${deliveryPrice} SAR`);
            }

            // Calculate discount with VAT if appliedOffer exists
            let discountWithVAT = null;
            const appliedOffer = response.data?.delivery?.appliedOffer;

            if (appliedOffer && appliedOffer.amount) {
                // amount is the discount without VAT, add 15% VAT to get actual discount
                discountWithVAT = Math.round(appliedOffer.amount * 1.15 * 100) / 100;
                console.log(`💰 Jahez: Discount = ${appliedOffer.amount} SAR (without VAT) → ${discountWithVAT} SAR (with VAT)`);
            }

            // Extract delivery offers and conditions based on actual API response
            const deliveryInfo = {
                // Final delivery fee (السعر النهائي)
                deliveryFee: deliveryPrice,

                // Pricing breakdown (تفاصيل الأسعار)
                pricing: {
                    originalPrice: originalDeliveryPrice,        // السعر الأصلي من invoiceBeforeDiscount
                    offerPrice: offerDeliveryPrice,             // السعر بعد العرض من offer
                    primePrice: primeDeliveryPrice,             // السعر للـ Prime من primeEligibility
                    finalPrice: deliveryPrice,                  // السعر النهائي المستخدم
                    type: pricingType,                          // نوع السعر: standard, offer, prime
                    hasOffer: hasAppliedOffer,                  // هل يوجد عرض
                    hasPrime: hasPrimeEligibility               // هل Prime متاح ومجاني
                },

                // Premium/Prime eligibility (معلومات Prime الكاملة)
                primeEligibility: response.data?.primeEligibility || null,

                // Applied offers (العروض المطبقة)
                appliedOffer: appliedOffer || null,

                // Calculated discount with VAT
                discountWithVAT: discountWithVAT,

                // Original delivery price from tier (already includes VAT from API)
                originalDeliveryPrice: response.data?.delivery?.originalDeliveryPrice || null,
                calculatedDeliveryPrice: response.data?.delivery?.calculatedDeliveryPrice || null,

                // Wafarha program price (loyalty discount)
                wafarhaPrice: response.data?.delivery?.calculatedWafarhaPrice || null,

                // Tier information (distance-based pricing)
                tier: response.data?.delivery?.tier || null,

                // Cart details for calculating conditional offers
                orderSubTotal: response.data?.invoiceBeforeDiscount?.subTotal || null,

                // Check if this is a partner delivery
                isPartnerDelivery: response.data?.partnerDelivery || false
            };

            return deliveryInfo;
        } catch (error) {
            console.error('Error calculating Jahez delivery fee:', error.message);

            // Log the error
            this.logger.logError('calculate_delivery_cart', { url, payload, restaurantId, branchId }, error);

            return null;
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    /**
     * Find best matching restaurant using Gemini AI
     * Falls back to traditional scoring system if AI fails
     */
    async findBestMatch(searchName, restaurants, restaurantLat = null, restaurantLng = null, chefzLogoUrl = null) {
        if (!restaurants || restaurants.length === 0) return null;

        // Prepare source restaurant data for Gemini AI
        const sourceRestaurant = {
            name: searchName,
            latitude: restaurantLat,
            longitude: restaurantLng,
            category: 'Unknown' // Can be enhanced later
        };

        // Try Gemini AI matching first (if API key is available)
        try {
            const geminiMatcher = new GeminiMatcher(process.env.GEMINI_API_KEY);
            const aiMatch = await geminiMatcher.findBestMatch(sourceRestaurant, restaurants, 'Jahez');

            if (aiMatch) {
                console.log(`✅ Gemini AI matched: ${aiMatch.restaurantName}`);
                return aiMatch;
            }
        } catch (error) {
            console.error(`⚠️ Gemini AI failed, falling back to traditional matching: ${error.message}`);
        }

        // Fallback to traditional matching
        console.log(`\n🔄 Using fallback matching for Jahez...`);

        // Extract English name for matching
        const searchEnglish = this.extractEnglishName(searchName).toLowerCase().trim();

        if (!searchEnglish) {
            console.log(`⚠️ No English name to match for: ${searchName}`);
            return null;
        }

        const normalizeText = (text) => {
            return text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .trim();
        };

        // Helper to check if text contains word as a complete word (not part of another word)
        const containsCompleteWord = (text, word) => {
            const words = text.split(/\s+/);
            const searchWords = word.split(/\s+/);

            // Check if all search words exist as complete words in text
            return searchWords.every(searchWord =>
                words.some(w => w === searchWord)
            );
        };

        const searchNormalized = normalizeText(searchEnglish);
        const searchWords = searchNormalized.split(/\s+/);
        const isShortName = searchWords.length <= 2; // Consider 1-2 words as "short"
        const candidates = [];

        console.log(`\n🔍 Matching "${searchNormalized}" (${searchWords.length} words, ${isShortName ? 'SHORT' : 'LONG'} name) against ${restaurants.length} restaurants:`);

        for (const restaurant of restaurants) {
            // Extract English name from restaurant name for matching
            const restaurantEnglish = this.extractEnglishName(restaurant.restaurantName);
            const restaurantNameNormalized = normalizeText(restaurantEnglish);
            let score = 0;
            let matchType = 'none';

            // Calculate distance first (needed for short name logic)
            let distance = null;
            if (restaurantLat && restaurantLng && restaurant.latitude && restaurant.longitude) {
                distance = this.calculateDistance(
                    restaurantLat,
                    restaurantLng,
                    restaurant.latitude,
                    restaurant.longitude
                );
            }

            // Name matching (primary criteria)
            if (restaurantNameNormalized === searchNormalized) {
                score = 100; // Exact match
                matchType = 'exact';
                console.log(`   ✅ "${restaurant.restaurantName}" - EXACT match`);
            } else if (containsCompleteWord(restaurantNameNormalized, searchNormalized)) {
                // Check if it's a genuine partial match (e.g., "KFC" in "KFC Riyadh")
                // vs false match (e.g., "Cleaver" should NOT match "Cleaver Burger")
                const restaurantWords = restaurantNameNormalized.split(/\s+/);

                // List of common branch/location words that don't change restaurant identity
                const branchKeywords = ['branch', 'riyadh', 'jeddah', 'dammam', 'makkah', 'madinah',
                    'khobar', 'dhahran', 'mall', 'plaza', 'center', 'centre',
                    'north', 'south', 'east', 'west', 'old', 'new', 'main'];

                // Get extra words (words in restaurant name but not in search)
                const extraWords = restaurantWords.filter(word => !searchWords.includes(word));

                // Accept if:
                // 1. All extra words are branch/location keywords
                // 2. Search has multiple words (compound name) - more specific
                // 3. SHORT NAME + CLOSE LOCATION (< 100m) - prioritize location over name
                const allExtraWordsAreBranchInfo = extraWords.every(word =>
                    branchKeywords.includes(word)
                );
                const isVeryClose = distance !== null && distance < 0.1; // Within 100 meters

                if (searchWords.length > 1 || allExtraWordsAreBranchInfo) {
                    score = 50; // Partial match
                    matchType = 'partial';
                    console.log(`   ✅ "${restaurant.restaurantName}" - PARTIAL match (extra words: ${extraWords.join(', ')})`);
                } else if (isShortName && isVeryClose) {
                    // SPECIAL CASE: Short name (1-2 words) + very close location
                    // Accept even if extra words aren't branch keywords
                    // Example: "Slider" matches "Slider Smash Burger" if at same location
                    score = 60; // Good match due to location
                    matchType = 'short_name_close_location';
                    console.log(`   ✅ "${restaurant.restaurantName}" - ACCEPTED (short name + close location: ${distance.toFixed(3)}km, extra words: ${extraWords.join(', ')})`);
                } else {
                    // Skip ambiguous matches like "Cleaver" vs "Cleaver Burger" when far apart
                    console.log(`   ❌ "${restaurant.restaurantName}" - REJECTED (ambiguous: extra words "${extraWords.join(', ')}" are not branch keywords, distance: ${distance ? distance.toFixed(2) + 'km' : 'N/A'})`);
                    continue;
                }
            } else {
                console.log(`   ⚪ "${restaurant.restaurantName}" - SKIPPED (no name match)`);
                continue; // Skip if no name match
            }

            // Distance scoring (secondary criteria) - distance already calculated above
            if (distance !== null) {
                // Add location boost for very close matches
                if (distance <= 0.05) {
                    // < 50 meters - SAME location, boost score significantly
                    score += 40;
                    console.log(`   📍 Location boost (+40): Restaurant is at same location (${distance.toFixed(3)}km)`);
                } else if (distance <= 0.5) {
                    // < 500 meters - Very close
                    score += 20;
                    console.log(`   📍 Location boost (+20): Restaurant is very close (${distance.toFixed(3)}km)`);
                } else if (distance <= 2) {
                    // < 2km - Nearby
                    score += 10;
                } else if (distance > 5) {
                    // > 5km - Far away, penalty
                    score -= 20;
                    console.log(`   📍 Distance penalty (-20): Restaurant is far (${distance.toFixed(2)}km)`);
                }

                candidates.push({
                    restaurant,
                    score,
                    matchType,
                    distance: distance.toFixed(2)
                });
            } else {
                // No distance info, use name score only
                candidates.push({
                    restaurant,
                    score,
                    matchType,
                    distance: 'N/A'
                });
            }
        }

        if (candidates.length === 0) {
            console.log(`\n❌ No match found for: ${searchName}`);
            return null;
        }

        // Sort by score (highest first)
        candidates.sort((a, b) => b.score - a.score);

        // Show all candidates with scores
        console.log(`\n📊 Candidates ranked by score:`);
        candidates.forEach((c, index) => {
            console.log(`   ${index + 1}. "${c.restaurant.restaurantName}" - Score: ${c.score} (${c.matchType}, ${c.distance}km)`);
        });

        const best = candidates[0];

        // Require minimum score of 40 to return a match
        if (best.score < 40) {
            console.log(`\n❌ No confident match found for: ${searchName} (best score: ${best.score})`);
            return null;
        }

        console.log(`\n✅ SELECTED: ${best.restaurant.restaurantName}\n`);

        return best.restaurant;
    }

    /**
     * Get delivery fee for a restaurant
     */
    async getDeliveryFeeForRestaurant(restaurantName, restaurantLat = null, restaurantLng = null, chefzLogoUrl = null) {
        try {
            console.log(`🔍 Jahez: Searching for "${restaurantName}"`);

            // Step 1: Try multiple search strategies
            let restaurants = [];
            let bestMatch = null;

            // Extract English name
            const englishName = this.extractEnglishName(restaurantName);

            // Strategy 1: Search with English name (most specific)
            if (englishName) {
                console.log(`🔍 Strategy 1: Searching with English name "${englishName}"`);
                restaurants = await this.searchRestaurants(englishName, 50);
                if (restaurants.length > 0) {
                    bestMatch = await this.findBestMatch(restaurantName, restaurants, restaurantLat, restaurantLng, chefzLogoUrl);
                }
            }

            // Strategy 2: If no match, try full name (includes Arabic)
            if (!bestMatch) {
                console.log(`🔍 Strategy 2: Searching with full name "${restaurantName}"`);
                restaurants = await this.searchRestaurants(restaurantName, 50);
                if (restaurants.length > 0) {
                    bestMatch = await this.findBestMatch(restaurantName, restaurants, restaurantLat, restaurantLng, chefzLogoUrl);
                }
            }

            // Strategy 3: If still no match and name has separator, try just the first part
            if (!bestMatch && (restaurantName.includes('|') || restaurantName.includes('-'))) {
                const separator = restaurantName.includes('|') ? '|' : '-';
                const firstPart = restaurantName.split(separator)[0].trim();
                if (firstPart && firstPart !== englishName) {
                    console.log(`🔍 Strategy 3: Searching with first part "${firstPart}"`);
                    restaurants = await this.searchRestaurants(firstPart, 50);
                    if (restaurants.length > 0) {
                        bestMatch = await this.findBestMatch(restaurantName, restaurants, restaurantLat, restaurantLng, chefzLogoUrl);
                    }
                }
            }

            if (!bestMatch) {
                console.log(`❌ Jahez: No good match found for "${restaurantName}" after trying all strategies`);
                return null;
            }

            console.log(`✅ Jahez: Found "${bestMatch.restaurantName}" (ID: ${bestMatch.restaurantId}, Branch: ${bestMatch.branchId})`);

            // Step 3: Get menu to find a sample item
            const menu = await this.getRestaurantMenu(bestMatch.restaurantId, bestMatch.branchId);

            if (!menu || menu.length === 0) {
                console.log(`❌ Jahez: No menu items found for "${bestMatch.restaurantName}"`);
                return null;
            }

            // Find the most expensive item from menu to trigger delivery offers
            let mostExpensiveItem = null;
            let maxPrice = 0;

            for (const category of menu) {
                if (category.products && category.products.length > 0) {
                    for (const product of category.products) {
                        const itemPrice = parseFloat(product.price) || 0;
                        if (itemPrice > maxPrice) {
                            maxPrice = itemPrice;
                            mostExpensiveItem = {
                                itemId: product.itemId,
                                image: product.image,
                                name: product.itemName,
                                price: itemPrice
                            };
                        }
                    }
                }
            }

            if (!mostExpensiveItem) {
                console.log(`❌ Jahez: No items found in menu for "${bestMatch.restaurantName}"`);
                return null;
            }

            console.log(`📋 Jahez: Using most expensive item "${mostExpensiveItem.name}" (${mostExpensiveItem.price} SAR) to calculate delivery`);

            // Step 4: Calculate delivery fee and get offer details
            const deliveryInfo = await this.calculateDeliveryFee(
                bestMatch.restaurantId,
                bestMatch.branchId,
                mostExpensiveItem
            );

            if (deliveryInfo === null) {
                console.log(`❌ Jahez: Could not calculate delivery fee for "${bestMatch.restaurantName}"`);
                return null;
            }

            console.log(`✅ Jahez: Delivery fee = ${deliveryInfo.deliveryFee} SAR`);

            // Log offer details if available
            if (deliveryInfo.appliedOffer) {
                console.log(`🎁 Jahez: Applied offer detected!`, deliveryInfo.appliedOffer);
            }
            if (deliveryInfo.primeEligibility) {
                console.log(`👑 Jahez: Prime eligibility detected!`, deliveryInfo.primeEligibility);
            }

            return {
                restaurantId: bestMatch.restaurantId,
                branchId: bestMatch.branchId,
                restaurantName: bestMatch.restaurantName,
                deliveryFee: deliveryInfo.deliveryFee,
                distance: bestMatch.distance,
                deliveryOffer: bestMatch.deliveryOffer,
                // Include all delivery info (premium, offers, tiers)
                deliveryDetails: {
                    // NEW: Include pricing breakdown for frontend
                    pricing: deliveryInfo.pricing,
                    // Existing fields
                    primeEligibility: deliveryInfo.primeEligibility,
                    appliedOffer: deliveryInfo.appliedOffer,
                    originalDeliveryPrice: deliveryInfo.originalDeliveryPrice,
                    calculatedDeliveryPrice: deliveryInfo.calculatedDeliveryPrice,
                    wafarhaPrice: deliveryInfo.wafarhaPrice,
                    tier: deliveryInfo.tier,
                    orderSubTotal: deliveryInfo.orderSubTotal,
                    isPartnerDelivery: deliveryInfo.isPartnerDelivery
                }
            };

        } catch (error) {
            console.error('❌ Jahez: Error getting delivery fee:', error.message);
            return null;
        }
    }
}

module.exports = JahezAPI;
