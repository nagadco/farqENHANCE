require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const ChefzAPI = require('./chefz-api');
const ToYouAPI = require('./toyou-api');
const JahezAPI = require('./jahez-api');
const DataPrimary = (process.env.DATA_PRIMARY || 'live').toLowerCase();
let restaurantData = null;
try { restaurantData = require('./data/restaurantData'); } catch (_) { restaurantData = null; }
const SlackHelper = require('./slack-helper');

const app = express();
const port = process.env.PORT || 3000;
const slackHelper = new SlackHelper();

// Sleep utility function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Timeout wrapper for API calls - prevents slow APIs from blocking others
const withTimeout = (promise, timeoutMs, fallbackValue) => {
  return Promise.race([
    promise,
    new Promise((resolve) =>
      setTimeout(() => {
        console.log(`⏱️ API call timeout after ${timeoutMs}ms, using fallback`);
        resolve(fallbackValue);
      }, timeoutMs)
    )
  ]);
};

// Create responses directory if it doesn't exist
const responsesDir = path.join(__dirname, 'responses');
if (!fs.existsSync(responsesDir)) {
  fs.mkdirSync(responsesDir, { recursive: true });
  console.log(`📁 Created responses directory: ${responsesDir}`);
}

// Function to save response to file (DISABLED)
const saveResponseToFile = (endpoint, requestData, responseData, processingTime) => {
  // Response logging is disabled
  return null;

  // try {
  //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  //   const fileName = `${endpoint}_${timestamp}.json`;
  //   const filePath = path.join(responsesDir, fileName);

  //   const dataToSave = {
  //     endpoint: endpoint,
  //     timestamp: new Date().toISOString(),
  //     processing_time_ms: processingTime,
  //     request: requestData,
  //     response: responseData
  //   };

  //   fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf8');
  //   console.log(`💾 Response saved to: ${fileName}`);

  //   return fileName;
  // } catch (error) {
  //   console.error('❌ Error saving response to file:', error.message);
  //   return null;
  // }
};

// Enable GZIP compression for all responses - reduces data transfer size
app.use(compression());

app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(morgan('combined'));
app.use(express.json());

let requestQueue = [];
let processing = false;

// New function to get only TheChefz restaurants quickly WITHOUT prices
const getChefzRestaurants = async (latitude, longitude, maxChefs = 6, page = 2, position = 0) => {
  console.log(`🚀 Getting TheChefz restaurants (without prices) for lat=${latitude}, lng=${longitude}, starting from page=${page}, position=${position}`);

  const chefzAPI = new ChefzAPI(latitude, longitude);

  // Test connection to TheChefz API first
  const connectionTest = await chefzAPI.testConnection();
  if (!connectionTest) {
    console.log('❌ TheChefz API connection failed, trying with different user agent...');
    chefzAPI.rotateUserAgent();
    const retryTest = await chefzAPI.testConnection();
    if (!retryTest) {
      throw new Error('TheChefz API is not accessible. Please check authentication tokens or try again later.');
    }
  }

  try {
    // Collect chefs across multiple pages until we reach the target
    const collectionResult = await chefzAPI.collectChefsUntilTarget(page, maxChefs, position);

    if (collectionResult.totalCollected === 0) {
      console.log('⚠️ No chefs found in TheChefz for this location');
      return res.json({
        restaurants: [],
        nextRequest: null,
        hasMore: false
      });
    }

    // console.log(`📊 Collected ${collectionResult.totalCollected} chefs from ${collectionResult.pagesScanned} pages`);

    const results = [];

    for (let i = 0; i < collectionResult.chefs.length; i++) {
      const chef = collectionResult.chefs[i];
      const chefName = chef.name || 'Unknown';
      const chefId = chef.branchId || chef.id;

      // console.log(`\n🍽️ Chef ${i + 1}/${collectionResult.chefs.length}: ${chefName}`);

      // Create restaurant object WITHOUT prices - just basic info
      const restaurant = {
        id: chefId,
        name: chefName,
        rating: parseFloat(chef.avgReview) || 0,
        distance: chef.distance ? `${chef.distance}km` : "N/A",
        tags: chef.cuisine ? chef.cuisine.map(c => c.name) : ["Restaurant"],
        image: chef.profilePicture || "",
        reviewCount: chef.reviewCount || 0,
        isClosed: false, // Default from TheChefz
        deliveryOptions: [], // Empty - no prices yet
        chefzData: chef, // Store original chef data for future use
        expanded: false,
        pricesLoaded: false // Track if prices have been loaded
      };

      results.push(restaurant);
    }

    console.log(`✅ TheChefz restaurants loaded (without prices): ${results.length} restaurants`);

    return {
      restaurants: results,
      pagination: {
        startPage: page,
        startPosition: position,
        lastPage: collectionResult.lastPage,
        lastChef: collectionResult.lastChef,
        totalCollected: collectionResult.totalCollected,
        pagesScanned: collectionResult.pagesScanned,
        nextPage: collectionResult.nextPage,
        nextPosition: collectionResult.nextPosition
      }
    };

  } catch (error) {
    console.error('❌ Error getting TheChefz restaurants:', error.message);
    throw error;
  }
};

// New function to get ALL delivery options for a specific restaurant (TheChefz + ToYou + Jahez + Hunger Station)
// OPTIMIZED: All API calls run in parallel for faster response
\n  // Cache check (Supabase)\n  try {\n    const persistence = require('./persistence');\n    const cached = await persistence.getCachedDeliveryOptions(chefzData?.branchId || chefzData?.id || chefzData?.branchID || chefzData?.branch_id || chefzData?.chefId || chefzData?.chef_id || chefzData?.restaurantId || chefzData?.restaurant_id || null);\n    if (cached && cached.length) {\n      console.log('??? Using cached delivery options');\n      return cached;\n    }\n  } catch (e) { console.warn('Cache check failed:', e.message); }\n
    { name: "The Chefz", image: "/delivery_logos/the-chefs.png" },
    { name: "To You", image: "/delivery_logos/to-you.png" },
    { name: "Jahez", image: "/delivery_logos/jahez.png" },
    { name: "Hunger Station", image: "/delivery_logos/hunger-station.png" }
  ];

  // ⚡ PARALLEL EXECUTION with TIMEOUTS: All API calls run simultaneously
  // Each API has a timeout to prevent slow responses from blocking the user
  const startTime = Date.now();
  const API_TIMEOUT = 8000; // 8 seconds timeout per API

  const [chefzOption, toyouOption, jahezOption, hungerStationOption] = await Promise.all([
    // 1. Get TheChefz delivery fee
    withTimeout((async () => {
      console.log(`🍽️ Getting TheChefz price for: ${restaurantName}`);
      try {
        const chefResult = await chefzAPI.processSingleChef(chefzData);

        if (chefResult && chefResult.delivery_fee) {
          // Build delivery offer message if applicable
          let deliveryOfferMessage = null;
          const details = chefResult.deliveryDetails;

          if (details) {
            // Priority 1: Check for active applied promotion (discount already applied)
            if (details.appliedPromotion && parseFloat(details.appliedPromotion.discount || 0) > 0) {
              deliveryOfferMessage = `${details.appliedPromotion.discount} SAR off`;
            }
            // Priority 2: Check if promotion is active
            else if (details.currentPromotion?.tiers?.[0]?.isActive && details.availablePromotions?.length > 0) {
              const promo = details.availablePromotions[0];
              deliveryOfferMessage = promo.titleVariable || 'Promotion Active';
            }
            // Priority 3: Show remaining amount to activate promotion
            else if (details.promotionProgress?.remaining_amount && details.availablePromotions?.length > 0) {
              const promo = details.availablePromotions[0];
              deliveryOfferMessage = `Add ${details.promotionProgress.remaining_amount} for ${promo.titleVariable} off`;
            }
          }

          console.log(`✅ TheChefz: Delivery = ${chefResult.delivery_fee} SAR`);
          return {
            name: "The Chefz",
            time: chefzData.delivery_time_range || "20-30mins",
            price: chefResult.delivery_fee,
            isFree: parseFloat(chefResult.delivery_fee) === 0,
            image: "/delivery_logos/the-chefs.png",
            status: "success",
            deepLink: `thechefz://restaurant/${chefzData.branchId || chefzData.id}`,
            deliveryOffer: deliveryOfferMessage,
            deliveryDetails: details
          };
        } else {
          return {
            name: "The Chefz",
            time: "N/A",
            price: "0",
            isFree: false,
            image: "/delivery_logos/the-chefs.png",
            status: "not_found",
            errorMessage: "Restaurant not found"
          };
        }
      } catch (error) {
        console.error(`❌ TheChefz error: ${error.message}`);
        return {
          name: "The Chefz",
          time: "N/A",
          price: "0",
          isFree: false,
          image: "/delivery_logos/the-chefs.png",
          status: "error",
          errorMessage: "An error occurred"
        };
      }
    })(), API_TIMEOUT, {
      name: "The Chefz",
      time: "N/A",
      price: "0",
      isFree: false,
      image: "/delivery_logos/the-chefs.png",
      status: "timeout",
      errorMessage: "Request timeout"
    }),

    // 2. Search in ToYou
    withTimeout((async () => {
      console.log(`🔍 Searching ToYou for: ${restaurantName}`);
      try {
        const chefzLogoUrl = chefzData?.profilePicture || null;
        const toyouMerchants = await toyouAPI.searchMerchant(restaurantName);

        if (toyouMerchants.length > 0) {
          const bestMatch = await toyouAPI.findBestMatch(restaurantName, toyouMerchants, restaurantLat, restaurantLng, chefzLogoUrl);
          if (bestMatch) {
            const toyouDeliveryFee = toyouAPI.getDeliveryFee(bestMatch);
            console.log(`✅ ToYou: ${bestMatch.name} - Delivery = ${toyouDeliveryFee} SAR`);

            return {
              name: "To You",
              time: "25-35mins",
              price: toyouDeliveryFee.toString(),
              isFree: parseFloat(toyouDeliveryFee) === 0,
              image: "/delivery_logos/to-you.png",
              status: "success",
              merchantData: bestMatch,
              deepLink: bestMatch.id ? `toyou://merchant/${bestMatch.id}` : undefined
            };
          } else {
            return {
              name: "To You",
              time: "N/A",
              price: "0",
              isFree: false,
              image: "/delivery_logos/to-you.png",
              status: "not_found",
              errorMessage: "Restaurant not found"
            };
          }
        } else {
          console.log(`❌ No ToYou merchants found for: ${restaurantName}`);
          return {
            name: "To You",
            time: "N/A",
            price: "0",
            isFree: false,
            image: "/delivery_logos/to-you.png",
            status: "not_found",
            errorMessage: "Restaurant not found"
          };
        }
      } catch (error) {
        console.error(`❌ ToYou error: ${error.message}`);
        return {
          name: "To You",
          time: "N/A",
          price: "0",
          isFree: false,
          image: "/delivery_logos/to-you.png",
          status: "error",
          errorMessage: "An error occurred"
        };
      }
    })(), API_TIMEOUT, {
      name: "To You",
      time: "N/A",
      price: "0",
      isFree: false,
      image: "/delivery_logos/to-you.png",
      status: "timeout",
      errorMessage: "Request timeout"
    }),

    // 3. Search in Jahez
    withTimeout((async () => {
      console.log(`🔍 Searching Jahez for: ${restaurantName}`);
      try {
        const chefzLogoUrl = chefzData?.profilePicture || null;
        const jahezResult = await jahezAPI.getDeliveryFeeForRestaurant(restaurantName, restaurantLat, restaurantLng, chefzLogoUrl);

        if (jahezResult && jahezResult.deliveryFee !== null) {
          console.log(`✅ Jahez: ${jahezResult.restaurantName} - Delivery = ${jahezResult.deliveryFee} SAR`);

          // Create dynamic deep link using Branch.io API
          const deepLink = await jahezAPI.createDeepLink(
            jahezResult.restaurantId,
            jahezResult.branchId,
            jahezResult.restaurantName
          );

          // Build delivery offer message and pricing info
          let deliveryOfferMessage = null;
          const details = jahezResult.deliveryDetails;
          const pricing = details?.pricing;

          console.log(`🔍 Jahez Pricing Info for ${restaurantName}:`, {
            hasPricing: !!pricing,
            pricing: pricing,
            hasOffer: pricing?.hasOffer,
            hasPrime: pricing?.hasPrime,
            originalPrice: pricing?.originalPrice,
            offerPrice: pricing?.offerPrice,
            primePrice: pricing?.primePrice
          });

          // Build offer message based on pricing type
          let savedAmount = null;
          if (pricing?.hasOffer && pricing.offerPrice !== null && pricing.originalPrice) {
            savedAmount = pricing.originalPrice - pricing.offerPrice;
            deliveryOfferMessage = savedAmount.toFixed(2);
          } else if (pricing?.hasPrime && pricing.primePrice === 0) {
            deliveryOfferMessage = 'prime_free';
          } else if (details?.appliedOffer) {
            deliveryOfferMessage = details.appliedOffer.englishName || details.appliedOffer.arabicName;
            savedAmount = pricing?.originalPrice && pricing?.offerPrice ?
              (pricing.originalPrice - pricing.offerPrice).toFixed(2) : null;
          } else if (details?.tier && details.tier.tierEnglishName) {
            deliveryOfferMessage = `Distance: ${details.tier.tierEnglishName}`;
          }

          return {
            name: "Jahez",
            time: "25-40mins",
            price: jahezResult.deliveryFee.toString(),
            originalPrice: pricing?.originalPrice?.toString() || null,
            isFree: parseFloat(jahezResult.deliveryFee) === 0,
            hasOffer: pricing?.hasOffer || false,
            hasPrime: pricing?.hasPrime || false,
            pricingType: pricing?.type || 'standard',
            savedAmount: savedAmount,
            image: "/delivery_logos/jahez.png",
            status: "success",
            merchantData: jahezResult,
            deepLink: deepLink,
            deliveryOffer: deliveryOfferMessage,
            deliveryDetails: details
          };
        } else {
          return {
            name: "Jahez",
            time: "N/A",
            price: "0",
            isFree: false,
            image: "/delivery_logos/jahez.png",
            status: "not_found",
            errorMessage: "Restaurant not found"
          };
        }
      } catch (error) {
        console.error(`❌ Jahez error: ${error.message}`);
        return {
          name: "Jahez",
          time: "N/A",
          price: "0",
          isFree: false,
          image: "/delivery_logos/jahez.png",
          status: "error",
          errorMessage: "An error occurred"
        };
      }
    })(), API_TIMEOUT, {
      name: "Jahez",
      time: "N/A",
      price: "0",
      isFree: false,
      image: "/delivery_logos/jahez.png",
      status: "timeout",
      errorMessage: "Request timeout"
    }),

    // 4. Hunger Station (placeholder - will return not_found for now)
    withTimeout((async () => {
      console.log(`🔍 Searching Hunger Station for: ${restaurantName}`);
      return {
        name: "Hunger Station",
        time: "N/A",
        price: "0",
        isFree: false,
        image: "/delivery_logos/hunger-station.png",
        status: "not_found",
        errorMessage: "لم يتم العثور على المطعم"
      };
    })(), API_TIMEOUT, {
      name: "Hunger Station",
      time: "N/A",
      price: "0",
      isFree: false,
      image: "/delivery_logos/hunger-station.png",
      status: "timeout",
      errorMessage: "Request timeout"
    })
  ]);

  const allOptions = [chefzOption, toyouOption, jahezOption, hungerStationOption];
  const totalTime = Date.now() - startTime;

  // Count successful, failed, and timeout responses
  const stats = allOptions.reduce((acc, opt) => {
    if (opt.status === 'success') acc.success++;
    else if (opt.status === 'timeout') acc.timeout++;
    else acc.failed++;
    return acc;
  }, { success: 0, failed: 0, timeout: 0 });

  console.log(`⚡ Delivery options: ${allOptions.length} APIs in ${totalTime}ms | ✅ ${stats.success} success | ⏱️ ${stats.timeout} timeout | ❌ ${stats.failed} failed`);

  // Filter out error and not_found statuses
  const filteredOptions = allOptions.filter(opt => opt.status !== 'error' && opt.status !== 'not_found');
  console.log(`🔍 Filtered ${allOptions.length - filteredOptions.length} failed options, returning ${filteredOptions.length} options`);

  return filteredOptions;
};

const processQueue = async () => {
  if (processing || requestQueue.length === 0) return;

  processing = true;
  const request = requestQueue.shift();

  try {
    const { latitude, longitude, maxChefs, page, position = 0 } = request.data;
    const chefzResult = await getChefzRestaurants(latitude, longitude, maxChefs, page, position);
    request.resolve({
      status: 'completed',
      processed_at: new Date().toISOString(),
      restaurants: chefzResult.restaurants,
      total_processed: chefzResult.restaurants.length,
      pagination: chefzResult.pagination,
      next_request: {
        page: chefzResult.pagination.nextPage,
        position: chefzResult.pagination.nextPosition
      },
      last_restaurant: chefzResult.pagination.lastChef ? {
        id: chefzResult.pagination.lastChef.branchId || chefzResult.pagination.lastChef.id,
        name: chefzResult.pagination.lastChef.name
      } : null
    });
  } catch (error) {
    request.reject(error);
  } finally {
    processing = false;
    processQueue();
  }
};

app.post('/compare', async (req, res) => {
  const { latitude, longitude, maxChefs = 6, page = 2, position = 0 } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      error: 'Latitude and longitude are required'
    });
  }

  console.log(`📍 New comparison request: lat=${latitude}, lng=${longitude}, maxChefs=${maxChefs}, page=${page}, position=${position}`);

  // Serve from Excel when configured
  if (DataPrimary === 'excel' && restaurantData) {
    try {
      const query = (req.body.query || '').toString();
      const size = Number(maxChefs) || 50;
      const pageNum = Number(page) || 1;
      const result = query
        ? restaurantData.search({ query, page: pageNum, size, latitude, longitude })
        : restaurantData.list({ page: pageNum, size, latitude, longitude });

      const response = {
        status: 'completed',
        processed_at: new Date().toISOString(),
        total_processed: result.total,
        restaurants: result.rows,
        pagination: {
          startPage: pageNum,
          startPosition: 0,
          lastPage: Math.max(1, Math.ceil(result.total / size)),
          totalCollected: result.total,
          pagesScanned: 1,
          nextPage: pageNum + 1,
          nextPosition: 0,
        },
        next_request: null,
        last_restaurant: result.rows[0] ? { id: result.rows[0].id, name: result.rows[0].name } : null,
      };
      try {
        const persistence = require('./persistence');
        await persistence.saveCompareResult({ latitude, longitude, page: pageNum, position: 0, maxChefs: size, query }, response);
        await persistence.saveRestaurants(result.rows || []);
      } catch (e) {
        console.warn('Persist compare (excel) failed:', e.message);
      }
      return res.json(response);
    } catch (e) {
      console.error('Local dataset error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    requestQueue.push({
      data: { latitude, longitude, maxChefs, page, position },
      resolve,
      reject,
    });
    processQueue();
  })
    .then(async (result) => {
      const processingTime = Date.now() - startTime;
      // Persist compare result + restaurants
      try {
        const persistence = require('./persistence');
        await persistence.saveCompareResult(req.body, result);
        await persistence.saveRestaurants(result.restaurants || []);
      } catch (e) {
        console.warn('Persist compare failed:', e.message);
      }
      // Save response to file
      saveResponseToFile('compare', req.body, result, processingTime);
      // Send to Slack (non-blocking)
      slackHelper
        .sendComparisonResult(req.body, result, processingTime)
        .catch((err) => {
          console.error('Failed to send Slack notification:', err);
        });
      res.json(result);
    })
    .catch((error) => res.status(500).json({ error: error.message }));
});


// New endpoint to get ALL delivery options for a specific restaurant
app.post('/restaurant/:id/delivery-options', async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, restaurantName, chefzData } = req.body;

  if (!latitude || !longitude || !restaurantName || !chefzData) {
    return res.status(400).json({
      error: 'Latitude, longitude, restaurant name, and chefzData are required'
    });
  }

  const startTime = Date.now();

  try {
    console.log(`🔍 Getting ALL delivery options for restaurant: ${restaurantName} (ID: ${id})`);

    const allOptions = await getRestaurantDeliveryOptions(latitude, longitude, restaurantName, chefzData);

    const processingTime = Date.now() - startTime;

    const result = {
      status: 'completed',
      restaurant_id: id,
      restaurant_name: restaurantName,
      delivery_options: allOptions,
      processed_at: new Date().toISOString()
    };

    // Save response to file
    saveResponseToFile('delivery-options', { ...req.body, restaurant_id: id }, result, processingTime);

    // Persist pricing snapshots and cache (non-blocking)
    try {
      const persistence = require('./persistence');
      await persistence.savePricingSnapshots({
        restaurantId: parseInt(id, 10) || null,
        restaurantName,
        options: allOptions,
        latitude,
        longitude,
      });
      await persistence.setCachedDeliveryOptions(id, allOptions);
    } catch (e) {
      console.warn('Persist delivery options failed:', e.message);
    }

    // Send to Slack (non-blocking)
    slackHelper.sendDeliveryOptionsResult(req.body, result, processingTime)
      .then(async (slackResult) => {
      })
      .catch(err => {
        console.error('Failed to send Slack notification:', err);
      });

    res.json(result);
  } catch (error) {
    console.error('❌ Error getting delivery options:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/queue-status', (req, res) => {
  res.json({
    queue_length: requestQueue.length,
    processing: processing,
    timestamp: new Date().toISOString()
  });
});

// Analytics endpoint (optional). Saves raw events for future dashboards.
app.post('/analytics', async (req, res) => {
  const { event, ...props } = req.body || {};
  if (!event) return res.status(400).json({ error: 'event is required' });
  try {
    const persistence = require('./persistence');
    await persistence.saveEvent(event, props);
    res.status(204).end();
  } catch (e) {
    console.error('Analytics error:', e.message);
    res.status(500).json({ error: 'failed to persist event' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Endpoints:');
  console.log('  POST /compare - Get TheChefz restaurants (requires lat, lng, optional maxChefs, page, position)');
  console.log('  POST /restaurant/:id/delivery-options - Get additional delivery options for specific restaurant');
  console.log('  GET /queue-status - Check queue status');
  if (process.env.GEMINI_API_KEY) {
    console.log('AI Matching: Gemini enabled');
  } else if (process.env.OLLAMA_MODEL) {
    console.log(`AI Matching: Ollama enabled (model: ${process.env.OLLAMA_MODEL})`);
  } else {
    console.log('AI Matching: Disabled (set GEMINI_API_KEY or OLLAMA_MODEL)');
  }
});




