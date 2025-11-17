# نظام حفظ الـ Responses | Response Logging System

## نظرة عامة | Overview

### العربية
تم إضافة نظام شامل لحفظ جميع الـ API responses الداخلية من جميع المصادر (TheChefz, ToYou, Jahez) في ملفات منفصلة منظمة.

### English
A comprehensive system has been added to save all internal API responses from all sources (TheChefz, ToYou, Jahez) in organized separate files.

---

## ما الذي يتم حفظه؟ | What Gets Saved?

### 1. TheChefz API
- **البحث عن المطاعم** `search_chefs` - Restaurant search
- **قوائم الطعام** `get_menu` - Restaurant menus
- **إضافة للسلة** `add_to_cart` - Add items to cart
- **تفاصيل الأسعار والعروض** `get_cart_pricing` - Pricing details and offers

### 2. ToYou API
- **البحث عن المطاعم** `search_merchants` - Restaurant search

### 3. Jahez API
- **البحث عن المطاعم** `search_restaurants` - Restaurant search
- **قوائم الطعام** `get_menu` - Restaurant menus
- **حساب التوصيل والأسعار** `calculate_delivery_cart` - Delivery calculation and pricing

### 4. Main Endpoints
- **مقارنة المطاعم** `compare` - Restaurant comparison endpoint
- **خيارات التوصيل** `delivery-options` - Delivery options endpoint

---

## بنية المجلدات | Folder Structure

```
api/
├── responses/                          # المجلد الرئيسي للـ responses
│   ├── README.md                       # توثيق البنية
│   ├── thechefz/                       # TheChefz responses
│   │   ├── search_chefs_*.json
│   │   ├── get_menu_*.json
│   │   ├── add_to_cart_*.json
│   │   └── get_cart_pricing_*.json
│   ├── toyou/                          # ToYou responses
│   │   └── search_merchants_*.json
│   ├── jahez/                          # Jahez responses
│   │   ├── search_restaurants_*.json
│   │   ├── get_menu_*.json
│   │   └── calculate_delivery_cart_*.json
│   ├── compare_*.json                  # Main endpoint responses
│   └── delivery-options_*.json
├── response-logger.js                  # Logger utility class
├── server.js                           # Main server (logs endpoint responses)
├── chefz-api.js                        # TheChefz API (logs internal calls)
├── toyou-api.js                        # ToYou API (logs internal calls)
└── jahez-api.js                        # Jahez API (logs internal calls)
```

---

## كيف يعمل النظام؟ | How It Works

### العربية

1. **ResponseLogger Class**: كلاس مشترك لحفظ الـ responses في `response-logger.js`
2. **API Classes**: كل API class يستخدم ResponseLogger لحفظ كل request/response
3. **Server Endpoints**: الـ server يحفظ الـ responses النهائية للـ endpoints الرئيسية
4. **Auto-Created Folders**: المجلدات يتم إنشاؤها تلقائياً عند أول استخدام
5. **Timestamp Naming**: الملفات تُسمى بالتوقيت الدقيق لسهولة التتبع

### English

1. **ResponseLogger Class**: Shared logger class in `response-logger.js`
2. **API Classes**: Each API class uses ResponseLogger to save every request/response
3. **Server Endpoints**: Server saves final responses for main endpoints
4. **Auto-Created Folders**: Folders are created automatically on first use
5. **Timestamp Naming**: Files are named with precise timestamps for easy tracking

---

## مثال على محتوى الملف | File Content Example

### Success Response

```json
{
  "source": "TheChefz",
  "endpoint": "get_cart_pricing",
  "method": "GET",
  "timestamp": "2025-10-24T11:54:15.496Z",
  "status_code": 200,
  "request": {
    "params": {
      "arrivalTime": "now",
      "latitude": "24.7136",
      "longitude": "46.6753"
    },
    "url": "https://api.thechefz.co/v9/my-cart"
  },
  "response": {
    "success": true,
    "data": {
      "deliveryFee": 5.75,
      "totalPrice": 48.30,
      "dishTotal": 42.55,
      "deliveryPromotationInfo": [...],
      "applicableDeliveryPromotion": {...}
    }
  }
}
```

### Error Response

```json
{
  "source": "Jahez",
  "endpoint": "search_restaurants",
  "timestamp": "2025-10-24T11:54:20.123Z",
  "error": true,
  "request": {
    "url": "https://jahez-portal-gateway.jahez.net/...",
    "searchText": "KFC"
  },
  "error_message": "Request failed with status code 500",
  "error_status": 500,
  "error_response": {...}
}
```

---

## الفوائد | Benefits

### العربية

✅ **تتبع كامل**: حفظ جميع الـ API calls الداخلية والخارجية
✅ **تحليل الأسعار**: دراسة أنماط الأسعار والعروض من كل مصدر
✅ **اختبار وتطوير**: إعادة تشغيل السيناريوهات بيانات حقيقية
✅ **كشف المشاكل**: رصد التغييرات في الـ APIs أو الأخطاء
✅ **تدقيق الأداء**: قياس أوقات الاستجابة وتحسين الأداء

### English

✅ **Complete Tracking**: Save all internal and external API calls
✅ **Price Analysis**: Study pricing patterns and offers from each source
✅ **Testing & Development**: Replay scenarios with real data
✅ **Issue Detection**: Monitor API changes or errors
✅ **Performance Audit**: Measure response times and improve performance

---

## ملاحظات مهمة | Important Notes

### العربية

⚠️ **الخصوصية**: مجلد `responses/` مُضاف إلى `.gitignore` لحماية البيانات الحساسة
📁 **المساحة**: الملفات قد تتراكم بسرعة، يُنصح بحذف الملفات القديمة بشكل دوري
🔍 **التفتيش**: يمكن استخدام هذه الملفات لفهم سلوك الـ APIs والتحقق من البيانات
🚀 **الأداء**: الحفظ يتم بشكل synchronous، قد يؤثر قليلاً على الأداء في الطلبات الكثيرة

### English

⚠️ **Privacy**: `responses/` folder is added to `.gitignore` to protect sensitive data
📁 **Storage**: Files can accumulate quickly, periodic cleanup recommended
🔍 **Inspection**: Use these files to understand API behavior and verify data
🚀 **Performance**: Saving is synchronous, may slightly affect performance under heavy load

---

## التخصيص | Customization

### تعطيل الحفظ لـ endpoint معين | Disable Logging for Specific Endpoint

```javascript
// في الـ API class
// Comment out the logger.log() call
// this.logger.log('endpoint_name', requestData, responseData, status, method);
```

### تغيير مسار المجلد | Change Folder Path

```javascript
// في response-logger.js
this.responsesDir = path.join(__dirname, 'your-custom-folder');
```

---

## الدعم | Support

للمزيد من المعلومات أو الأسئلة، راجع الملفات التالية:
- `api/response-logger.js` - Logger implementation
- `api/responses/README.md` - Detailed folder structure
- `.gitignore` - Protected files configuration

For more information or questions, check these files:
- `api/response-logger.js` - Logger implementation
- `api/responses/README.md` - Detailed folder structure
- `.gitignore` - Protected files configuration

