# أمثلة على الـ API Responses | API Response Examples

هذا المجلد يحتوي على أمثلة لـ responses من الـ endpoints المختلفة.

## الملفات | Files

### 1. `jahez-response-example.json`
مثال على response من Jahez **مع عرض** (offer)

**الميزات:**
- ✅ السعر الأصلي: 17 ريال
- ✅ السعر بعد العرض: 3 ريال  
- ✅ عرض "3 ريال" مطبق
- ✅ Prime متاح (مجاني)
- ✅ وفر 14 ريال

**كيف يظهر:**
```
~~17~~ 3 ریال
وفر 14.00 ریال
أو: مجاني لمشتركي Prime 👑
```

---

### 2. `jahez-response-no-offer.json`
مثال على response من Jahez **بدون عرض**

**الميزات:**
- السعر: 15 ریال
- لا يوجد عرض
- لا يوجد Prime

**كيف يظهر:**
```
15 ریال
```

---

## استخدام الأمثلة | Using Examples

### قراءة الأمثلة
```bash
cat examples/jahez-response-example.json | jq
```

### استخدامها في Testing
```javascript
const exampleResponse = require('./examples/jahez-response-example.json');

// Test your frontend component
<DeliveryOption data={exampleResponse.delivery_options[0]} />
```

### مقارنة الحالات المختلفة
```javascript
// With Offer
const withOffer = require('./examples/jahez-response-example.json');
console.log(withOffer.delivery_options[0].hasOffer); // true

// Without Offer  
const noOffer = require('./examples/jahez-response-no-offer.json');
console.log(noOffer.delivery_options[0].hasOffer); // false
```

---

## الحقول المهمة | Important Fields

### للعرض في UI
```javascript
{
  "price": "3",              // السعر النهائي - اعرضه دائماً
  "originalPrice": "17",     // السعر الأصلي - اعرضه مشطوباً إذا hasOffer = true
  "hasOffer": true,          // هل تشطب السعر الأصلي؟
  "hasPrime": true,          // هل تعرض أيقونة Prime؟
  "deliveryOffer": "وفر 14.00 ریال"  // الرسالة التوضيحية
}
```

### للتحليل والإحصائيات
```javascript
{
  "deliveryDetails": {
    "pricing": {
      "originalPrice": 17,
      "offerPrice": 3,
      "primePrice": 0,
      "type": "offer"
    },
    "appliedOffer": {...},   // تفاصيل العرض المطبق
    "tier": {...}            // معلومات المسافة
  }
}
```

---

## إضافة أمثلة جديدة | Adding New Examples

عند تجربة حالات جديدة، احفظ الـ responses هنا:

```bash
# 1. احصل على response من API
curl -X POST http://localhost:3000/restaurant/123/delivery-options \
  -H "Content-Type: application/json" \
  -d @request.json \
  > examples/new-example.json

# 2. نسق الملف
cat examples/new-example.json | jq . > examples/new-example-formatted.json

# 3. أضف وصف في هذا الـ README
```

---

## المزيد من المعلومات | More Info

راجع `JAHEZ_PRICING_STRUCTURE.md` للحصول على شرح تفصيلي لهيكل الأسعار.

