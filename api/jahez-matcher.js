const fs = require('fs');
const path = require('path');

/**
 * Jahez Restaurant Matcher
 * Matches TheChefz restaurants to Jahez restaurants using name similarity and location
 */
class JahezMatcher {
  constructor() {
    this.jahezRestaurants = [];
    this.loadJahezData();
  }

  loadJahezData() {
    try {
      const dataPath = path.join(__dirname, 'data', 'jahez-restaurants.json');
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      this.jahezRestaurants = JSON.parse(rawData);
      console.log(`✅ Loaded ${this.jahezRestaurants.length} Jahez restaurants`);
    } catch (error) {
      console.error('❌ Error loading Jahez data:', error.message);
      this.jahezRestaurants = [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Normalize restaurant name for comparison
   */
  normalizeName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')     // Normalize spaces
      .trim();
  }

  /**
   * Calculate name similarity score (0-1)
   */
  calculateNameSimilarity(name1, name2) {
    const n1 = this.normalizeName(name1);
    const n2 = this.normalizeName(name2);

    if (n1 === n2) return 1.0;

    // Check if one name contains the other
    if (n1.includes(n2) || n2.includes(n1)) return 0.8;

    // Split into words and check for common words
    const words1 = n1.split(' ');
    const words2 = n2.split(' ');
    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = Math.max(words1.length, words2.length);

    return commonWords / totalWords;
  }

  /**
   * Find matching Jahez restaurant for a given restaurant
   */
  findMatch(restaurantName, latitude, longitude, options = {}) {
    const {
      maxDistance = 2.0,  // Maximum distance in km
      minNameScore = 0.5, // Minimum name similarity score
      maxResults = 5      // Maximum number of candidates to consider
    } = options;

    if (!restaurantName || !latitude || !longitude) {
      return null;
    }

    // Find nearby Jahez restaurants
    const candidates = this.jahezRestaurants
      .map(restaurant => {
        const distance = this.calculateDistance(
          latitude, longitude,
          restaurant.lat, restaurant.lon
        );
        const nameScore = this.calculateNameSimilarity(
          restaurantName,
          restaurant.restaurantName
        );

        return {
          restaurant,
          distance,
          nameScore,
          totalScore: (nameScore * 0.7) + ((maxDistance - distance) / maxDistance * 0.3)
        };
      })
      .filter(match =>
        match.distance <= maxDistance &&
        match.nameScore >= minNameScore
      )
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, maxResults);

    if (candidates.length === 0) {
      console.log(`❌ No Jahez match found for: ${restaurantName}`);
      return null;
    }

    const bestMatch = candidates[0];
    console.log(`✅ Matched "${restaurantName}" to Jahez: "${bestMatch.restaurant.restaurantName}" (score: ${bestMatch.totalScore.toFixed(2)}, distance: ${bestMatch.distance.toFixed(2)}km)`);

    return bestMatch.restaurant;
  }

  /**
   * Get Jahez delivery info for matched restaurant
   */
  getDeliveryInfo(jahezRestaurant) {
    if (!jahezRestaurant) {
      return {
        available: false,
        message: 'Restaurant not available on Jahez'
      };
    }

    // Extract delivery fee from bottom offers (if available)
    let deliveryFee = '0'; // Default to free
    let deliveryOffer = null;

    if (jahezRestaurant.bottomOffers && jahezRestaurant.bottomOffers.length > 0) {
      const offer = jahezRestaurant.bottomOffers[0];
      if (offer.offerTypeCode === 'D') {
        // Delivery offer
        deliveryOffer = offer.tagLabel || 'Special Offer';
      }
    }

    // Estimate delivery time based on distance
    const distance = jahezRestaurant.distance || 5;
    const minTime = Math.max(15, Math.floor(distance * 2));
    const maxTime = Math.max(25, Math.floor(distance * 3));

    return {
      available: jahezRestaurant.deliveryEnabled,
      name: 'Jahez',
      time: `${minTime}-${maxTime}mins`,
      price: deliveryFee,
      isFree: deliveryFee === '0',
      image: '/delivery_logos/jahez.png',
      status: 'success',
      deliveryOffer: deliveryOffer,
      rating: jahezRestaurant.rating,
      primeRestaurant: jahezRestaurant.primeRestaurant,
      workHours: jahezRestaurant.workHours,
      nowWorking: jahezRestaurant.nowWorking,
      logo: jahezRestaurant.logo,
      jahezData: {
        restaurantId: jahezRestaurant.restaurantId,
        branchId: jahezRestaurant.branchId,
        thirdPartyBranchId: jahezRestaurant.thirdPartyBranchId
      }
    };
  }

  /**
   * Main method: Match restaurant and return delivery info
   */
  matchAndGetDelivery(restaurantName, latitude, longitude) {
    const jahezRestaurant = this.findMatch(restaurantName, latitude, longitude);
    return this.getDeliveryInfo(jahezRestaurant);
  }
}

// Singleton instance
const jahezMatcher = new JahezMatcher();

module.exports = jahezMatcher;
