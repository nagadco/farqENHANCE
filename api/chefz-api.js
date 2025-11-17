const axios = require('axios');
const ResponseLogger = require('./response-logger');

class ChefzAPI {
  constructor(latitude, longitude) {
    // User-provided coordinates for location-based API calls
    this.baseUrl = 'https://api.thechefz.co';
    this.lat = latitude;  // User's latitude
    this.lng = longitude; // User's longitude

    // Initialize response logger
    this.logger = new ResponseLogger('TheChefz');

    // Multiple user agents for rotation
    this.userAgents = [
      'Tha Chefz/9.78.3 (com.thashefz.shogalbait; build:896; iOS 18.5.0) Alamofire/5.10.2',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.7 Mobile/15E148 Safari/604.1'
    ];

    this.currentUserAgentIndex = 0;
    this.updateHeaders();
  }

  updateHeaders() {
    // Check if we're running on Render (production)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

    this.headers = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'App-Version': '9.78.3',
      'Authorization': process.env.CHEFZ_AUTH_TOKEN || 'Bearer Rdjx2rp_-gOSfD8PRDzivkEH84zGSshNytJN3rr1',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'ar',
      'City': '1',
      'User-Agent': this.userAgents[this.currentUserAgentIndex],
      'Origin': 'https://thechefz.co',
      'Referer': 'https://thechefz.co/',
      'X-Requested-With': 'XMLHttpRequest',
      // Add more headers for production
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    };

    // Use different cookies for production if available
    const phpsessid = isProduction ?
      (process.env.CHEFZ_PHPSESSID_PROD || process.env.CHEFZ_PHPSESSID || 'jn0j2lvu7n84r8oupatg723ekf') :
      (process.env.CHEFZ_PHPSESSID || 'jn0j2lvu7n84r8oupatg723ekf');

    const csrf = isProduction ?
      (process.env.CHEFZ_CSRF_PROD || process.env.CHEFZ_CSRF || '5X6Et4l3Wyo__z0ZmC2_ciPsBHU4JY3G') :
      (process.env.CHEFZ_CSRF || '5X6Et4l3Wyo__z0ZmC2_ciPsBHU4JY3G');

    this.cookies = `PHPSESSID=${phpsessid}; _csrf=${csrf}`;
  }

  rotateUserAgent() {
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
    this.updateHeaders();
  }

  // Create mobile-like headers for better compatibility
  createMobileHeaders() {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

    return {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'App-Version': '9.78.3',
      'Authorization': process.env.CHEFZ_AUTH_TOKEN || 'Bearer 8D1r7UFMcMFVGKFB07U1u4yjz6g3VZG5zdM_9Ehf',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'ar',
      'City': '1',
      'User-Agent': this.userAgents[this.currentUserAgentIndex],
      'Origin': 'https://thechefz.co',
      'Referer': 'https://thechefz.co/',
      'X-Requested-With': 'XMLHttpRequest',
      // Mobile-specific headers
      'X-Forwarded-For': isProduction ? '192.168.1.1' : undefined,
      'X-Real-IP': isProduction ? '192.168.1.1' : undefined,
      'CF-Connecting-IP': isProduction ? '192.168.1.1' : undefined,
      // Additional mobile headers
      'Accept-Charset': 'UTF-8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  async testConnection() {
    try {
      console.log('🔍 Testing TheChefz API connection...');
      console.log('📍 Environment:', process.env.NODE_ENV || 'development');
      console.log('🌐 Render:', process.env.RENDER ? 'Yes' : 'No');
      console.log('🔑 Auth Token:', this.headers.Authorization ? 'Present' : 'Missing');
      console.log('🍪 Cookies:', this.cookies ? 'Present' : 'Missing');

      const response = await axios.get(`${this.baseUrl}/v9/cuisine/316/chefs`, {
        params: {
          arrivalTime: 'now',
          cn_tag: '-1',
          distance: '50',
          expand: 'title,store,marketplace',
          isPickup: '0',
          lat: this.lat,
          long: this.lng,
          page: '1',
          ratingPlus: '0',
          sort: 'distance',
          tag: '1'
        },
        headers: {
          ...this.headers,
          'Long': this.lng,
          'Lat': this.lat,
          'City': '1',
          'Cookie': this.cookies
        },
        timeout: 15000
      });

      console.log('✅ TheChefz API connection successful:', response.status);
      // console.log('📡 GET /v9/cuisine/316/chefs - Response: ' + JSON.stringify(response.data));
      return response.status === 200;
    } catch (error) {
      console.log('❌ TheChefz API connection failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.message);
      console.log('Headers:', error.response?.headers);
      return false;
    }
  }


  async getNearestHomeChefs(page = 2, retryCount = 0) {
    const url = `${this.baseUrl}/v9/cuisine/316/chefs`;
    const params = {
      "arrivalTime": "now",
      "cn_tag": "-1",
      "distance": "50",
      "expand": "title,store,marketplace",
      "isPickup": "0",
      "lat": this.lat,
      "long": this.lng,
      "page": page.toString(),
      "ratingPlus": "0",
      "sort": "distance",
      "tag": "1"
    };
    const headers = {
      ...this.createMobileHeaders(),
      'Long': this.lng,
      'Lat': this.lat,
      'City': '1',
      'Cookie': this.cookies
    };

    try {
      const response = await axios.get(url, {
        params,
        headers,
        timeout: 10000,
        maxRedirects: 5
      });

      const data = response.data;
      const chefsCount = data?.data?.chefs?.length || 0;

      // Log the response
      this.logger.log('search_chefs', { params, url }, data, response.status, 'GET');

      return data;
    } catch (error) {
      // Log the error
      this.logger.logError('search_chefs', { params, url, retryCount }, error);

      if (error.response?.status === 403 && retryCount < 3) {
        // Try with different user agent and wait
        this.rotateUserAgent();
        await new Promise(resolve => setTimeout(resolve, 3000 + (retryCount * 2000)));
        return this.getNearestHomeChefs(page, retryCount + 1);
      }

      if (error.response?.status === 429) {
        // Rate limited, wait longer
        await new Promise(resolve => setTimeout(resolve, 5000 + (retryCount * 3000)));
        return this.getNearestHomeChefs(page, retryCount + 1);
      }

      return null;
    }
  }

  async collectChefsUntilTarget(startPage = 2, targetCount = 6, startPosition = 0) {
    console.log(`🎯 Collecting ${targetCount} chefs starting from page ${startPage}, position ${startPosition}`);

    let allChefs = [];
    let currentPage = startPage;
    let currentPosition = startPosition;
    let seenIds = new Set(); // لتجنب المطاعم المكررة

    while (allChefs.length < targetCount && currentPage <= 20) { // حد أقصى 20 صفحة
      console.log(`📄 Fetching page ${currentPage}...`);

      const response = await this.getNearestHomeChefs(currentPage);
      if (!response?.success) {
        console.log(`❌ No more data available at page ${currentPage}`);
        break;
      }

      const chefs = response.data?.chefs || [];
      if (chefs.length === 0) {
        console.log(`📄 Page ${currentPage} is empty, stopping collection`);
        break;
      }

      // إذا كنا في الصفحة الأولى، ابدأ من الموضع المحدد
      const chefsFromPosition = currentPage === startPage ? chefs.slice(currentPosition) : chefs;
      console.log(`📄 Page ${currentPage}: Found ${chefs.length} chefs, using ${chefsFromPosition.length} from position ${currentPage === startPage ? currentPosition : 0}`);

      // فلترة المطاعم المكررة وإضافة الجديدة
      const uniqueChefs = chefsFromPosition.filter(chef => {
        const chefId = chef.branchId || chef.id;
        if (seenIds.has(chefId)) {
          return false; // مكرر
        }
        seenIds.add(chefId);
        return true;
      });

      console.log(`📄 Page ${currentPage}: ${uniqueChefs.length} unique chefs after filtering`);

      // إضافة المطاعم الجديدة حتى نصل للعدد المطلوب
      const remainingNeeded = targetCount - allChefs.length;
      const chefsToAdd = uniqueChefs.slice(0, remainingNeeded);
      allChefs = allChefs.concat(chefsToAdd);

      console.log(`📊 Total collected: ${allChefs.length}/${targetCount}`);

      // حساب الموضع التالي
      let nextPage = currentPage;
      let nextPosition = 0;

      if (allChefs.length >= targetCount) {
        // وصلنا للهدف، احسب الموضع التالي
        const usedFromCurrentPage = chefsToAdd.length;
        const totalUsedFromCurrentPage = (currentPage === startPage ? currentPosition : 0) + usedFromCurrentPage;

        if (totalUsedFromCurrentPage < chefs.length) {
          // باقي مطاعم في نفس الصفحة
          nextPage = currentPage;
          nextPosition = totalUsedFromCurrentPage;
        } else {
          // خلصت الصفحة، انتقل للتالية
          nextPage = currentPage + 1;
          nextPosition = 0;
        }

        console.log(`✅ Target reached! Next start: page ${nextPage}, position ${nextPosition}`);
        break;
      }

      // إذا خلصت الصفحة الحالية، انتقل للتالية
      currentPage++;
      currentPosition = 0;

      // انتظار قصير بين الصفحات
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // حساب الموضع التالي للحالة النهائية
    let finalNextPage = currentPage;
    let finalNextPosition = 0;

    if (allChefs.length > 0) {
      // ابحث عن آخر مطعم في الصفحات للحصول على الموضع الصحيح
      for (let pageNum = startPage; pageNum <= currentPage; pageNum++) {
        const response = await this.getNearestHomeChefs(pageNum);
        const chefs = response?.data?.chefs || [];

        const lastChefId = allChefs[allChefs.length - 1].branchId || allChefs[allChefs.length - 1].id;
        const lastChefIndex = chefs.findIndex(chef => (chef.branchId || chef.id) === lastChefId);

        if (lastChefIndex !== -1) {
          if (lastChefIndex + 1 < chefs.length) {
            // باقي مطاعم في نفس الصفحة
            finalNextPage = pageNum;
            finalNextPosition = lastChefIndex + 1;
          } else {
            // خلصت الصفحة
            finalNextPage = pageNum + 1;
            finalNextPosition = 0;
          }
          break;
        }
      }
    }

    return {
      chefs: allChefs,
      lastPage: currentPage,
      lastChef: allChefs.length > 0 ? allChefs[allChefs.length - 1] : null,
      totalCollected: allChefs.length,
      pagesScanned: currentPage - startPage + 1,
      nextPage: finalNextPage,
      nextPosition: finalNextPosition
    };
  }

  async getChefCategories(branchId) {
    const url = `${this.baseUrl}/v9/chef-category/-1`;
    const params = {
      expand: 'supportVirtualCategories',
      nearest_branch_id: branchId,
      page: '1'
    };

    const headers = {
      ...this.headers,
      'Long': this.lng,
      'Lat': this.lat,
      'Cookie': this.cookies
    };

    try {
      const response = await axios.get(url, { params, headers });
      console.log(`📡 GET /v9/chef-category/-1 - Status: ${response.status}`);
      // console.log(url);

      const data = response.data;

      // Log the response
      this.logger.log('get_menu', { params, url, branchId }, data, response.status, 'GET');

      // console.log('📡 GET /v9/chef-category/-1 - Response: ' + JSON.stringify(data));

      // Extract the most expensive dish from response
      let dishId = null;
      let mostExpensiveDish = null;
      let maxPrice = 0;

      if (data.success && data.data) {
        const dishes = data.data.dishes || [];
        if (dishes.length > 0) {
          // Find the most expensive dish
          for (const dish of dishes) {
            const dishPrice = parseFloat(dish.price) || 0;
            if (dishPrice > maxPrice) {
              maxPrice = dishPrice;
              mostExpensiveDish = dish;
            }
          }

          if (mostExpensiveDish) {
            dishId = mostExpensiveDish.id.toString();
            console.log(`✅ Found most expensive dish: ${mostExpensiveDish.name} - Price: ${maxPrice} SAR (ID: ${dishId})`);
          }
        } else {
          console.log('❌ No dishes found');
        }
      }

      return { data, dishId };
    } catch (error) {
      console.error('❌ Error getting categories:', error.message);

      // Log the error
      this.logger.logError('get_menu', { params, url, branchId }, error);

      return { data: null, dishId: null };
    }
  }

  async processSingleChef(chef) {
    // Try to get branchId first, fallback to id
    const branchId = chef.branchId || chef.id;
    const chefName = chef.name || 'Unknown';

    console.log(`🔍 Branch ID: ${branchId}`);
    console.log(`\n--- Processing: ${chefName} (ID: ${branchId}) ---`);

    if (!branchId) {
      console.log('❌ Branch ID not available');
      return null;
    }

    try {
      // 0. Clear cart first to avoid "Add dishes from same chef" error
      await this.clearCart();

      // 1. Get chef categories and extract dish_id
      const { data: categoriesData, dishId } = await this.getChefCategories(branchId);
      if (!categoriesData || !categoriesData.success) {
        console.log(`❌ No categories available at ${chefName}`);
        return null;
      }

      if (!dishId) {
        console.log(`❌ No dishes available at ${chefName}`);
        return null;
      }

      console.log(`✅ Found dish ID: ${dishId}`);

      // 2. Add dish to cart
      const addResponse = await this.addToCart(dishId);
      if (!addResponse) {
        console.log(`❌ Failed to send add-to-cart request for ${chefName}`);
        return null;
      }

      if (!addResponse.success) {
        const errorMsg = addResponse.status_message || 'Unknown error';
        console.log(`❌ Failed to add to cart for ${chefName}: ${errorMsg}`);
        return null;
      }

      // Extract item_id from response
      const itemId = addResponse.data?.item_id;
      if (!itemId) {
        console.log(`❌ No item_id from ${chefName}`);
        console.log(`Add response: ${JSON.stringify(addResponse)}`);
        return null;
      }

      console.log(`✅ Got item_id: ${itemId}`);

      // 3. Get cart contents
      const cartResponse = await this.getMyCart();
      if (!cartResponse || !cartResponse.success) {
        console.log(`❌ Failed to get cart for ${chefName}`);
        return null;
      }

      // Extract delivery fee and all promotion data
      const cartData = cartResponse.data;

      // Get final delivery price after discounts
      // Priority: 
      // 1. applicableDeliveryPromotion.deliveryFeeAfterDiscount (if promotion is applied)
      // 2. deliveryFee (standard price)
      let deliveryFee;

      if (cartData?.applicableDeliveryPromotion?.deliveryFeeAfterDiscount !== undefined) {
        deliveryFee = cartData.applicableDeliveryPromotion.deliveryFeeAfterDiscount;
        console.log(`📦 Using delivery fee after discount: ${deliveryFee} SAR (Original: ${cartData?.deliveryFee} SAR)`);
      } else {
        deliveryFee = cartData?.deliveryFee;
        console.log(`📦 Using standard delivery fee: ${deliveryFee} SAR`);
      }

      const totalPrice = cartData?.totalPrice;
      const dishTotal = cartData?.dishTotal;

      const result = {
        chef_name: chefName,
        chef_id: branchId,
        dish_id: dishId,
        item_id: itemId,
        delivery_fee: deliveryFee,
        total_price: totalPrice,
        // Include all delivery promotion info (similar to Jahez deliveryDetails)
        deliveryDetails: {
          // Available promotions
          availablePromotions: cartData?.deliveryPromotationInfo || null,
          // Current promotion status
          currentPromotion: cartData?.deliveryPromotation || null,
          // Promotion encouragement messages
          promotionProgress: cartData?.promotion_encourage_messages || null,
          // Applied delivery promotion (if active)
          appliedPromotion: cartData?.applicableDeliveryPromotion || null,
          // Pricing breakdown
          dishTotal: dishTotal,
          deliveryFee: deliveryFee, // Final price after discount
          originalDeliveryPrice: cartData?.deliveryFee || null, // Original price before discount
          totalPrice: totalPrice,
          // VAT information
          vat: cartData?.vat || null
        }
      };

      console.log(`✅ ${chefName}: Delivery = ${deliveryFee} SAR, Total = ${totalPrice} SAR`);

      // 4. Delete item from cart
      const deleteResponse = await this.deleteCartItem(itemId);
      if (deleteResponse && deleteResponse.success) {
        console.log(`✅ Item deleted from cart`);
      } else {
        console.log(`❌ Failed to delete item from cart`);
      }

      return result;

    } catch (error) {
      console.error('❌ Error processing chef:', error.message);
      return null;
    }
  }

  async addToCart(dishId, quantity = 1, noteToChef = "") {
    console.log(`🛒 Adding dish ${dishId} to cart...`);

    const url = `${this.baseUrl}/v9/add-to-cart`;
    const params = {
      expand: 'customized_card'
    };

    const headers = {
      ...this.headers,
      'Long': this.lng,
      'Lat': this.lat,
      'Cookie': this.cookies
    };

    const payload = {
      noteToChef: noteToChef,
      current_lng: this.lng,
      validateDishNote: 1,
      qty: quantity,
      isDeliveryPaymentRequired: 1,
      dishId: parseInt(dishId),
      current_lat: this.lat,
      variety: [] // Add empty variety array to avoid "Variety cannot be blank" error
    };

    try {
      const response = await axios.post(url, payload, { params, headers });
      console.log(`📡 POST /v9/add-to-cart - Status: ${response.status}`);

      const data = response.data;

      // Log the response
      this.logger.log('add_to_cart', { params, url, payload }, data, response.status, 'POST');

      if (data.success) {
        const itemId = data.data?.item_id;
        console.log(`✅ Added to cart. Item ID: ${itemId}`);
        return data;
      } else {
        console.log('❌ Failed to add to cart');
        console.log(data);
        return null;
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error.message);

      // Log the error
      this.logger.logError('add_to_cart', { params, url, payload }, error);

      return null;
    }
  }

  async getMyCart() {
    console.log('🛒 Getting cart contents...');

    const url = `${this.baseUrl}/v9/my-cart`;
    const params = {
      arrivalTime: 'now',
      latitude: this.lat,
      longitude: this.lng
    };

    const headers = {
      ...this.headers,
      'Long': this.lng,
      'Lat': this.lat,
      'Cookie': this.cookies
    };

    try {
      const response = await axios.get(url, { params, headers });
      console.log(`📡 GET /v9/my-cart - Status: ${response.status}`);

      const data = response.data;

      // Log the response
      this.logger.log('get_cart_pricing', { params, url }, data, response.status, 'GET');

      if (data.success) {
        const cartData = data.data;
        const deliveryFee = cartData?.deliveryFee;
        const totalPrice = cartData?.totalPrice;
        const dishTotal = cartData?.dishTotal;

        // Print pricing information
        console.log(`\n💰 Pricing Information:`);
        console.log(`   Dish Total: ${dishTotal} SAR`);
        console.log(`   Delivery Fee: ${deliveryFee} SAR`);
        console.log(`   Total Price: ${totalPrice} SAR`);

        // Print delivery promotion info (عروض التوصيل)
        if (cartData?.deliveryPromotationInfo && cartData.deliveryPromotationInfo.length > 0) {
          console.log(`\n🎁 Delivery Promotion Available:`);
          cartData.deliveryPromotationInfo.forEach(promo => {
            console.log(`   📊 ${promo.title} (${promo.titleVariable})`);
            console.log(`   ℹ️  ${promo.subTitle}`);
            console.log(`      - Min Order: ${promo.subTitleVariable1}`);
            console.log(`      - Discount: ${promo.subTitleVariable2}`);
          });
        }

        // Print delivery promotion status (حالة العرض)
        if (cartData?.deliveryPromotation) {
          console.log(`\n📈 Promotion Status:`);
          const promo = cartData.deliveryPromotation;
          console.log(`   ${promo.title}`);

          if (promo.tiers && promo.tiers.length > 0) {
            promo.tiers.forEach(tier => {
              const status = tier.isActive ? '✅ Active' : '❌ Inactive';
              console.log(`   - ${tier.title} discount (${tier.percentage}% progress) - ${status}`);
            });
          }
        }

        // Print encouragement messages (رسائل التشجيع)
        if (cartData?.promotion_encourage_messages) {
          console.log(`\n💡 Promotion Encouragement:`);
          const msg = cartData.promotion_encourage_messages;
          if (msg.remaining_amount) {
            console.log(`   Remaining: ${msg.remaining_amount}`);
          }
          if (msg.message_percentage_for_promotion_cart) {
            console.log(`   Progress: ${msg.message_percentage_for_promotion_cart}`);
          }
        }

        // Print applicable delivery promotion (العرض المطبق حالياً)
        if (cartData?.applicableDeliveryPromotion) {
          console.log(`\n🏷️  Applicable Delivery Promotion:`);
          const applicable = cartData.applicableDeliveryPromotion;
          console.log(`   Discount: ${applicable.discount} SAR`);
          console.log(`   Delivery After Discount: ${applicable.deliveryFeeAfterDiscount} SAR`);
          console.log(`   Min Order Value: ${applicable.minimum_order_value} SAR`);
          if (applicable.promotion_message) {
            console.log(`   Message: ${applicable.promotion_message}`);
          }
        }

        return data;
      } else {
        console.log('❌ Failed to get cart');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting cart:', error.message);

      // Log the error
      this.logger.logError('get_cart_pricing', { params, url }, error);

      return null;
    }
  }

  async clearCart() {
    // First check if cart has items
    const cartResponse = await this.getMyCart();
    if (!cartResponse || !cartResponse.success) {
      return { success: true, message: "Cart already empty" };
    }

    // Check if cart has items
    const cartData = cartResponse.data || {};
    const items = cartData.dishes || [];
    if (!items || items.length === 0) {
      return { success: true, message: "Cart already empty" };
    }

    // If cart has items, clear them one by one
    let clearedCount = 0;
    for (const item of items) {
      const itemId = item.itemId;
      if (itemId) {
        const deleteResult = await this.deleteCartItem(itemId.toString());
        if (deleteResult && deleteResult.success) {
          clearedCount++;
        }
      }
    }

    return { success: true, message: `Cleared ${clearedCount} items` };
  }

  async deleteCartItem(itemId) {
    const url = `${this.baseUrl}/v9/cart`;

    const headers = {
      ...this.headers,
      'Long': this.lng,
      'Lat': this.lat,
      'Cookie': this.cookies
    };

    const payload = {
      isDeliveryPaymentRequired: 1,
      itemId: parseInt(itemId)
    };

    try {
      const response = await axios.delete(url, { headers, data: payload });
      const data = response.data;

      if (data.success) {
        return data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  async runFullFlow(maxChefs = 10) {
    console.log('🚀 Starting full flow...');
    console.log('='.repeat(50));

    // 0. Clear cart at start
    console.log('🗑️ Clearing cart at start...');
    await this.clearCart();

    // 1. Get nearest chefs
    const chefsResponse = await this.getNearestHomeChefs();
    if (!chefsResponse || !chefsResponse.success) {
      console.log('❌ Failed to get chefs list');
      return;
    }

    // Extract branch IDs from response
    const chefsData = chefsResponse.data || {};
    const chefs = chefsData.chefs || [];

    if (!chefs.length) {
      console.log('❌ No chefs found');
      return;
    }

    // Determine number of chefs to process
    const chefsToProcess = chefs.slice(0, maxChefs);
    console.log(`📊 Found ${chefs.length} chefs, processing first ${chefsToProcess.length}`);

    // 2. Process each chef
    const results = [];
    for (let i = 0; i < chefsToProcess.length; i++) {
      const chef = chefsToProcess[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🍽️ Chef ${i + 1}/${chefsToProcess.length}`);

      const result = await this.processSingleChef(chef);
      if (result) {
        results.push(result);
      }

      // Short pause between requests to avoid rate limiting
      if (i < chefsToProcess.length - 1) {
        console.log('⏳ Waiting 2s before next chef...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 3. Show final results
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 Final Results:');
    console.log(`✅ Processed ${results.length} chefs successfully out of ${chefsToProcess.length}`);

    if (results.length > 0) {
      console.log('\n💰 Delivery fees:');
      results.forEach(result => {
        console.log(`- ${result.chef_name}: ${result.delivery_fee} SAR`);
      });
    }

    console.log('\n💾 Results ready for processing');

    return results;
  }

  async getDeliveryFee(branchId, dishId) {
    const url = `${this.baseUrl}/v9/calculate-invoice`;
    const payload = {
      nearest_branch_id: branchId,
      dishes: [{ id: dishId, qty: 1 }],
      isPickup: 0,
      voucher_code: "",
      lat: this.lat,
      long: this.lng
    };

    const headers = {
      ...this.headers,
      'Long': this.lng,
      'Lat': this.lat,
      'Cookie': this.cookies
    };

    try {
      const response = await axios.post(url, payload, { headers });
      console.log(`📡 POST /v9/calculate-invoice - Status: ${response.status}`);

      const data = response.data;
      if (data.success) {
        const deliveryFee = data.data?.delivery_fee || 0;
        const totalPrice = data.data?.total_amount || 0;

        return {
          delivery_fee: deliveryFee.toString(),
          total_price: totalPrice.toString(),
          success: true
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting delivery fee:', error.message);
      return null;
    }
  }
}

// Example usage (similar to Python main function)
async function main() {
  // Location coordinates - should be provided by user
  // These are example coordinates for Riyadh, Saudi Arabia
  const latitude = "24.734807778343";   // User's latitude
  const longitude = "46.651097791854";  // User's longitude

  console.log(`📍 Using user coordinates: Lat=${latitude}, Lng=${longitude}`);

  // Create API object with user coordinates
  const api = new ChefzAPI(latitude, longitude);

  // Run full flow
  await api.runFullFlow();
}

// Uncomment to run the example
// main().catch(console.error);

module.exports = ChefzAPI;