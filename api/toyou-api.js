const axios = require('axios');
const GeminiMatcher = require('./ai-matcher');
const ResponseLogger = require('./response-logger');

class ToYouAPI {
  constructor(latitude, longitude) {
    this.baseUrl = 'https://app.toyou.delivery';
    this.lat = latitude;
    this.lng = longitude;
    this.operationArea = 'SA_Riyadh';

    // Initialize response logger
    this.logger = new ResponseLogger('ToYou');

    // Load tokens from environment
    this.authToken = process.env.TOYOU_AUTH_TOKEN;
    this.refreshToken = process.env.TOYOU_REFRESH_TOKEN;
    this.authExpirationDate = process.env.TOYOU_AUTH_EXPIRATION_DATE;
    this.refreshExpirationDate = process.env.TOYOU_REFRESH_EXPIRATION_DATE;
    this.authExpirationPeriod = process.env.TOYOU_AUTH_EXPIRATION_PERIOD;
    this.refreshExpirationPeriod = process.env.TOYOU_REFRESH_EXPIRATION_PERIOD;
  }

  extractEnglishName(merchantName) {
    const parts = merchantName.split(' | ');
    if (parts.length > 1) {
      return parts[0].trim();
    }

    const dashParts = merchantName.split(' - ');
    if (dashParts.length > 1) {
      return dashParts[0].trim();
    }

    const words = merchantName.split(' ');
    const englishWords = words.filter(word =>
      /[a-zA-Z]/.test(word)
    );

    const result = englishWords.join(' ') || merchantName;
    return result.replace(/🇸🇦|🌞🌊/g, '').trim();
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

  async searchMerchant(merchantName) {
    // Extract English name only for searching
    const englishName = this.extractEnglishName(merchantName);
    console.log(`🔍 Searching ToYou with English name: "${englishName}"`);

    const url = `${this.baseUrl}/search/v12/c3-search`;
    const params = {
      lat: this.lat,
      lon: this.lng,
      query: englishName,
      operationArea: this.operationArea
    };

    const headers = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Accept-Language': 'en',
      'Ty-Distinct-Id': '02e00d2c-7d17-43be-a592-9db99c85b05b',
      'Ty-Installation-Id': '4EB650CC-B850-47B5-8E3C-7F29C97CED24',
      'User-Agent': 'com.arammeem.toyou.ios/2.35(25458) (iOS; 18.5; Apple)',
      'Accept-Encoding': 'gzip, deflate'
    };

    try {
      const response = await axios.get(url, { params, headers });
      // console.log(`📡 GET /search/v12/c3-search - Response: ${JSON.stringify(response.data)}`);
      console.log(`📡 GET /search/v12/c3-search - Status: ${response.status}`);
      // console.log(`📡 GET /search/v12/c3-search - Response: ${JSON.stringify(response.data)}`);

      const data = response.data;

      // Log the response
      this.logger.log('search_merchants', { params, url, query: englishName }, data, response.status, 'GET');

      const merchants = [];

      if (data.c3?.blocks) {
        for (const block of data.c3.blocks) {
          if (block.kind === 'GRID' && block.items) {
            for (const item of block.items) {
              if (item.kind === 'MERCHANT' && item.merchant) {
                merchants.push(item.merchant);
              }
            }
          }
        }
      }

      console.log(`✅ Found ${merchants.length} merchants in ToYou search`);
      return merchants;

    } catch (error) {
      console.error('❌ Error searching in ToYou:', error.message);

      // Log the error
      this.logger.logError('search_merchants', { params, url, query: englishName }, error);

      return [];
    }
  }

  /**
   * Find best match using Gemini AI
   * Falls back to traditional scoring system if AI fails
   */
  async findBestMatch(chefzName, toyouMerchants, restaurantLat = null, restaurantLng = null, chefzLogoUrl = null) {
    if (!toyouMerchants || toyouMerchants.length === 0) {
      return null;
    }

    // Prepare source restaurant data for Gemini AI
    const sourceRestaurant = {
      name: chefzName,
      latitude: restaurantLat,
      longitude: restaurantLng,
      category: 'Unknown' // Can be enhanced later
    };

    // Try Gemini AI matching first (if API key is available)
    try {
      const geminiMatcher = new GeminiMatcher(process.env.GEMINI_API_KEY);
      const aiMatch = await geminiMatcher.findBestMatch(sourceRestaurant, toyouMerchants, 'ToYou');

      if (aiMatch) {
        console.log(`✅ Gemini AI matched: ${aiMatch.name}`);
        return aiMatch;
      }
    } catch (error) {
      console.error(`⚠️ Gemini AI failed, falling back to traditional matching: ${error.message}`);
    }

    // Fallback to traditional matching
    console.log(`\n🔄 Using fallback matching for ToYou...`);

    // Helper to check if text contains word as a complete word (not part of another word)
    const containsCompleteWord = (text, word) => {
      const words = text.split(/\s+/);
      const searchWords = word.split(/\s+/);

      // Check if all search words exist as complete words in text
      return searchWords.every(searchWord =>
        words.some(w => w === searchWord)
      );
    };

    // Extract English name only for matching
    const chefzEnglish = this.extractEnglishName(chefzName).toLowerCase().trim();
    const candidates = [];

    for (const merchant of toyouMerchants) {
      const toyouEnglish = this.extractEnglishName(merchant.name || '').toLowerCase().trim();
      let score = 0;
      let matchType = 'none';

      // Name matching (primary criteria)
      if (chefzEnglish === toyouEnglish) {
        score = 100; // Exact match
        matchType = 'exact';
      } else if (containsCompleteWord(toyouEnglish, chefzEnglish) || containsCompleteWord(chefzEnglish, toyouEnglish)) {
        // Check if it's a genuine partial match (e.g., "KFC" in "KFC Riyadh")
        // vs false match (e.g., "Cleaver" should NOT match "Cleaver Burger")
        const toyouWords = toyouEnglish.split(/\s+/);
        const chefzWords = chefzEnglish.split(/\s+/);

        // List of common branch/location words that don't change restaurant identity
        const branchKeywords = ['branch', 'riyadh', 'jeddah', 'dammam', 'makkah', 'madinah',
          'khobar', 'dhahran', 'mall', 'plaza', 'center', 'centre',
          'north', 'south', 'east', 'west', 'old', 'new', 'main'];

        // Get extra words (words in toyou name but not in chefz search)
        const extraWords = toyouWords.filter(word => !chefzWords.includes(word));

        // Accept if:
        // 1. All extra words are branch/location keywords
        // 2. Search has multiple words (compound name) - more specific
        const allExtraWordsAreBranchInfo = extraWords.every(word =>
          branchKeywords.includes(word)
        );

        if (chefzWords.length > 1 || allExtraWordsAreBranchInfo) {
          score = 50; // Partial match
          matchType = 'partial';
        } else {
          // Skip ambiguous matches like "Cleaver" vs "Cleaver Burger"
          console.log(`⚠️ ToYou: Skipping ambiguous match: "${chefzEnglish}" vs "${toyouEnglish}"`);
          continue;
        }
      } else {
        continue; // Skip if no name match
      }

      // Distance scoring (secondary criteria) - if coordinates available
      if (restaurantLat && restaurantLng && merchant.address?.location?.coordinates) {
        const merchantLat = merchant.address.location.coordinates[1];
        const merchantLng = merchant.address.location.coordinates[0];
        const distance = this.calculateDistance(restaurantLat, restaurantLng, merchantLat, merchantLng);

        // Only use distance in scoring if branch is within 30 meters (0.03 km)
        // This prevents matching distant branches of the same restaurant
        let distancePenalty = 0;
        if (distance <= 0.03) {
          // Branch is nearby - use distance scoring
          // 0-1km: -0 points
          // 1-5km: -5 to -15 points
          // >5km: -20 points
          if (distance <= 1) {
            distancePenalty = 0;
          } else if (distance <= 5) {
            distancePenalty = Math.min((distance - 1) * 2.5, 15);
          } else {
            distancePenalty = 20;
          }
          score -= distancePenalty;
        }
        // If distance > 30km, don't use distance in scoring (rely on name match only)

        candidates.push({
          merchant,
          score,
          matchType,
          distance: distance.toFixed(2)
        });
      } else {
        // No distance info, use name score only
        candidates.push({
          merchant,
          score,
          matchType,
          distance: 'N/A'
        });
      }
    }

    if (candidates.length === 0) {
      console.log(`❌ No match found for: ${chefzName}`);
      return null;
    }

    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];

    // Require minimum score of 40 to return a match
    if (best.score < 40) {
      console.log(`❌ No confident match found for: ${chefzName} (best score: ${best.score})`);
      return null;
    }

    console.log(`✅ Best match: ${best.merchant.name} (${best.matchType}, score: ${best.score}, distance: ${best.distance}km)`);

    // Log other candidates if any
    if (candidates.length > 1) {
      console.log(`   Other candidates:`);
      for (let i = 1; i < Math.min(candidates.length, 3); i++) {
        console.log(`   - ${candidates[i].merchant.name} (score: ${candidates[i].score}, distance: ${candidates[i].distance}km)`);
      }
    }

    return best.merchant;
  }

  getDeliveryFee(merchant) {
    if (merchant.fees?.delivery) {
      return merchant.fees.delivery;
    }
    if (merchant.delivery?.fees?.delivery) {
      return merchant.delivery.fees.delivery;
    }
    return null;
  }
}

module.exports = ToYouAPI;
