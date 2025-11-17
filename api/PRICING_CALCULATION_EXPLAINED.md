# شرح حساب الأسعار في Jahez | Jahez Pricing Calculation Explained

## المصدر الصحيح للسعر الأصلي | Correct Source for Original Price

### ❌ خطأ (Wrong)
```javascript
// لا تستخدم invoiceBeforeDiscount.delivery
const originalPrice = data.invoiceBeforeDiscount.delivery; // 17
```

### ✅ صحيح (Correct)
```javascript
// استخدم delivery.originalDeliveryPrice + أضف 15% ضريبة
const originalPriceWithoutVAT = data.delivery.originalDeliveryPrice; // 14.78
const originalPrice = originalPriceWithoutVAT * 1.15; // 16.997 ≈ 17
```

---

## البنية الفعلية من API | Actual API Structure

### مثال حقيقي | Real Example

```json
{
  "invoiceBeforeDiscount": {
    "delivery": 17,          // ❌ ليس المصدر الصحيح
    "subTotal": 149,
    "total": 166
  },
  "offer": {
    "delivery": 3,           // ✅ السعر بعد العرض (مع ضريبة)
    "subTotal": 149,
    "total": 152
  },
  "delivery": {
    "originalDeliveryPrice": 14.78,  // ✅ السعر الأصلي (قبل ضريبة)
    "calculatedDeliveryPrice": 2.61, // السعر المحسوب (قبل ضريبة)
    "tier": {
      "tierPrice": 14.78             // نفس originalDeliveryPrice
    },
    "appliedOffer": {
      "amount": 2.61                 // قيمة الخصم (قبل ضريبة)
    }
  },
  "primeEligibility": {
    "delivery": 0            // ✅ مجاني لـ Prime
  }
}
```

---

## الحسابات | Calculations

### 1. السعر الأصلي (مع ضريبة)
```javascript
originalDeliveryPrice = 14.78 × 1.15 = 16.997 SAR ≈ 17 SAR
```

### 2. السعر بعد العرض (مع ضريبة)
```javascript
offerDeliveryPrice = 3 SAR  // من offer.delivery
```

### 3. قيمة التوفير
```javascript
saved = originalPrice - offerPrice
saved = 16.997 - 3 = 13.997 SAR ≈ 14 SAR
```

### 4. السعر لـ Prime
```javascript
primePrice = 0 SAR  // مجاني
```

---

## التوضيح بالأرقام | Numeric Breakdown

| الحقل | القيمة | الوصف | مع/بدون ضريبة |
|-------|--------|-------|----------------|
| `delivery.tier.tierPrice` | 14.78 | السعر الأساسي | بدون ضريبة |
| `delivery.originalDeliveryPrice` | 14.78 | السعر الأصلي | بدون ضريبة |
| **السعر الأصلي النهائي** | **17.00** | **14.78 × 1.15** | **مع ضريبة 15%** |
| `delivery.calculatedDeliveryPrice` | 2.61 | السعر بعد الخصم | بدون ضريبة |
| `offer.delivery` | 3.00 | السعر بعد العرض | مع ضريبة |
| `primeEligibility.delivery` | 0.00 | Prime مجاني | مع ضريبة |
| **التوفير** | **14.00** | **17 - 3** | **مع ضريبة** |

---

## لماذا لا نستخدم invoiceBeforeDiscount.delivery؟ | Why Not Use invoiceBeforeDiscount.delivery?

### الأسباب | Reasons

1. **غير دقيق للسعر الأصلي الفعلي**
   - `invoiceBeforeDiscount.delivery` (17) قد يكون محسوباً بطريقة مختلفة
   - قد يتضمن تعديلات أخرى غير واضحة

2. **المصدر الصحيح هو delivery.originalDeliveryPrice**
   - يأتي مباشرة من tier pricing
   - واضح وشفاف: `tier.tierPrice` = `originalDeliveryPrice`
   - نضيف الضريبة بأنفسنا بطريقة صريحة

3. **الاتساق والشفافية**
   ```javascript
   // واضح ومفهوم
   const original = tierPrice * 1.15;
   
   // غامض
   const original = invoiceBeforeDiscount.delivery; // من أين جاء 17؟
   ```

---

## الكود النهائي | Final Code

### في jahez-api.js

```javascript
// Extract all pricing information
// السعر الأصلي من delivery.originalDeliveryPrice (قبل الضريبة) + نضيف 15% VAT
const originalDeliveryPriceWithoutVAT = 
  data?.delivery?.originalDeliveryPrice || 
  data?.delivery?.tier?.tierPrice || 
  null;

const originalDeliveryPrice = originalDeliveryPriceWithoutVAT 
  ? Math.round(originalDeliveryPriceWithoutVAT * 1.15 * 100) / 100 
  : null;

const offerDeliveryPrice = data?.offer?.delivery || null; 
const primeDeliveryPrice = data?.primeEligibility?.delivery || null;
const hasAppliedOffer = !!data?.delivery?.appliedOffer;
const hasPrimeEligibility = primeDeliveryPrice === 0;

// Determine final price
let deliveryPrice;
let pricingType = 'standard';

if (hasAppliedOffer && offerDeliveryPrice !== null) {
  deliveryPrice = offerDeliveryPrice;
  pricingType = 'offer';
} else {
  deliveryPrice = originalDeliveryPrice;
  pricingType = 'standard';
}
```

---

## الـ Response للـ Frontend | Response to Frontend

```json
{
  "name": "Jahez",
  "price": "3",                  // السعر النهائي بعد العرض
  "originalPrice": "17",         // السعر الأصلي (16.997 ≈ 17)
  "hasOffer": true,              // يوجد عرض - اشطب السعر الأصلي
  "hasPrime": true,              // Prime متاح - أظهر الأيقونة
  "pricingType": "offer",        // نوع السعر
  "deliveryOffer": "وفر 14.00 ريال"
}
```

---

## كيف يظهر في UI | How It Displays

### مع عرض | With Offer
```
Jahez
~~17~~ 3 ريال
وفر 14 ريال
👑 أو مجاني لمشتركي Prime
```

### بدون عرض | Without Offer
```
Jahez
15 ريال
```

---

## الخلاصة | Summary

✅ **السعر الأصلي**: `delivery.originalDeliveryPrice × 1.15`

✅ **السعر بعد العرض**: `offer.delivery`

✅ **Prime**: `primeEligibility.delivery` (0 = مجاني)

❌ **لا تستخدم**: `invoiceBeforeDiscount.delivery` للسعر الأصلي

---

تم التحديث: 2025-10-24
المصدر الصحيح: `delivery.originalDeliveryPrice` + 15% VAT

