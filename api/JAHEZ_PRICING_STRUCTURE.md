# هيكل أسعار Jahez | Jahez Pricing Structure

## نظرة عامة | Overview

تم تحسين نظام عرض أسعار التوصيل في Jahez لإظهار:
- السعر الأصلي
- السعر المخفض (إذا كان هناك عرض)
- معلومات Prime (إذا كان متاحاً)

## بنية الـ Response

### الحقول الرئيسية | Main Fields

```json
{
  "name": "Jahez",
  "price": "3",                    // السعر النهائي (بعد العرض أو الخصم)
  "originalPrice": "17",           // السعر الأصلي قبل العرض
  "hasOffer": true,                // هل يوجد عرض مطبق
  "hasPrime": true,                // هل Prime متاح ومجاني (delivery = 0)
  "pricingType": "offer",          // نوع السعر: standard, offer, prime
  "deliveryOffer": "وفر 14 ريال", // رسالة العرض
  "deliveryDetails": {
    "pricing": {
      "originalPrice": 17,         // السعر الأصلي من invoiceBeforeDiscount
      "offerPrice": 3,             // السعر بعد العرض من offer
      "primePrice": 0,             // السعر للـ Prime من primeEligibility
      "finalPrice": 3,             // السعر النهائي المستخدم
      "type": "offer",             // standard | offer | prime
      "hasOffer": true,            // هل يوجد عرض
      "hasPrime": true             // هل Prime متاح ومجاني
    }
  }
}
```

## أنواع الأسعار | Pricing Types

### 1. Standard (السعر العادي)
```json
{
  "price": "17",
  "originalPrice": "17",
  "hasOffer": false,
  "hasPrime": false,
  "pricingType": "standard"
}
```
**العرض في Frontend:**
```
17 ريال
```

---

### 2. Offer (مع عرض)
```json
{
  "price": "3",
  "originalPrice": "17",
  "hasOffer": true,
  "hasPrime": false,
  "pricingType": "offer",
  "deliveryOffer": "وفر 14 ريال"
}
```
**العرض في Frontend:**
```
~~17~~ 3 ريال
وفر 14 ريال
```

---

### 3. Prime (مجاني للـ Prime)
```json
{
  "price": "3",           // السعر العادي (بعد العرض)
  "originalPrice": "17",
  "hasOffer": true,
  "hasPrime": true,       // Prime متاح ومجاني
  "pricingType": "offer",
  "deliveryOffer": "مجاني لمشتركي Prime"
}
```
**العرض في Frontend:**
```
~~17~~ 3 ريال
أو: مجاني لمشتركي Prime 👑
```

---

## كيفية العرض في Frontend | How to Display

### مثال بـ React/TypeScript

```typescript
interface JahezDeliveryOption {
  name: string;
  price: string;
  originalPrice?: string;
  hasOffer: boolean;
  hasPrime: boolean;
  pricingType: 'standard' | 'offer' | 'prime';
  deliveryOffer?: string;
}

function DeliveryPrice({ option }: { option: JahezDeliveryOption }) {
  const { price, originalPrice, hasOffer, hasPrime, deliveryOffer } = option;

  return (
    <div className="delivery-price">
      {/* عرض السعر */}
      <div className="price-display">
        {hasOffer && originalPrice && (
          <span className="original-price strikethrough">
            {originalPrice} ريال
          </span>
        )}
        <span className="final-price">
          {price} ريال
        </span>
      </div>

      {/* عرض رسالة العرض */}
      {deliveryOffer && (
        <div className="offer-badge">
          {hasPrime && <span className="prime-icon">👑</span>}
          {deliveryOffer}
        </div>
      )}
    </div>
  );
}
```

### مثال CSS

```css
.original-price.strikethrough {
  text-decoration: line-through;
  color: #999;
  margin-right: 8px;
}

.final-price {
  color: #00a651;
  font-weight: bold;
  font-size: 18px;
}

.offer-badge {
  background: #fff3cd;
  border: 1px solid #ffc107;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 4px;
  display: inline-block;
}

.prime-icon {
  margin-left: 4px;
}
```

---

## أمثلة حقيقية | Real Examples

### مثال 1: مطعم مع عرض "3 ريال"
**Response:**
```json
{
  "name": "Jahez",
  "price": "3",
  "originalPrice": "17",
  "hasOffer": true,
  "hasPrime": true,
  "pricingType": "offer",
  "deliveryOffer": "وفر 14.00 ريال",
  "deliveryDetails": {
    "pricing": {
      "originalPrice": 17,
      "offerPrice": 3,
      "primePrice": 0,
      "finalPrice": 3,
      "type": "offer",
      "hasOffer": true,
      "hasPrime": true
    },
    "appliedOffer": {
      "id": 999,
      "englishName": "3 Riyal",
      "arabicName": "3 ريال",
      "amount": 2.61
    }
  }
}
```

**كيف يظهر:**
```
Jahez
~~17~~ 3 ريال
وفر 14.00 ريال
أو: مجاني لمشتركي Prime 👑
```

---

### مثال 2: مطعم بدون عرض
**Response:**
```json
{
  "name": "Jahez",
  "price": "15",
  "originalPrice": "15",
  "hasOffer": false,
  "hasPrime": false,
  "pricingType": "standard"
}
```

**كيف يظهر:**
```
Jahez
15 ريال
```

---

## معلومات إضافية | Additional Info

### من أين تأتي الأسعار | Where Prices Come From

1. **originalPrice** ← `delivery.originalDeliveryPrice` × 1.15 (إضافة ضريبة)
   - السعر الأصلي من الـ tier قبل أي خصومات
   - مثال: 14.78 × 1.15 = 17 ريال
   
2. **price (offer)** ← `offer.delivery`
   - السعر بعد تطبيق العرض (يشمل الضريبة)
   - مثال: 3 ريال
   
3. **primePrice** ← `primeEligibility.delivery`
   - السعر لمشتركي Prime (عادة 0 = مجاني)

### الأولويات | Priority

```
1. إذا كان هناك عرض مطبق → استخدم offer.delivery
2. إذا كان Prime فقط → استخدم standard price (مع إظهار Prime option)
3. السعر العادي → استخدم invoiceBeforeDiscount.delivery
```

---

## ملاحظات مهمة | Important Notes

✅ **السعر النهائي** يتم حسابه تلقائياً بناءً على الأولويات
✅ **Prime** يظهر كخيار إضافي، لا يحل محل العرض
✅ **جميع الأسعار** تشمل ضريبة القيمة المضافة 15%
✅ **العروض** يتم تحديثها تلقائياً من API Jahez

⚠️ إذا كان `hasOffer = true`، يجب إظهار السعر الأصلي مشطوباً
⚠️ إذا كان `hasPrime = true`، يجب إظهار خيار Prime

---

## API Reference

### Endpoint
```
POST /restaurant/:id/delivery-options
```

### Response Structure
```typescript
interface DeliveryOption {
  name: 'Jahez' | 'TheChefz' | 'ToYou' | 'Hunger Station';
  price: string;                    // السعر النهائي
  originalPrice?: string;           // السعر الأصلي (Jahez only)
  hasOffer?: boolean;               // هل يوجد عرض (Jahez only)
  hasPrime?: boolean;               // هل Prime متاح (Jahez only)
  pricingType?: string;             // نوع السعر (Jahez only)
  deliveryOffer?: string;           // رسالة العرض
  deliveryDetails?: object;         // تفاصيل كاملة
}
```

---

## Testing

### Test Case 1: With Offer
```bash
curl -X POST http://localhost:3000/restaurant/123/delivery-options \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": "24.597085454768177",
    "longitude": "46.67533477762606",
    "restaurantName": "KFC",
    "chefzData": {...}
  }'
```

Expected: `hasOffer: true`, `originalPrice: "17"`, `price: "3"`

### Test Case 2: Without Offer
Expected: `hasOffer: false`, `originalPrice: "15"`, `price: "15"`

---

تم التحديث: 2025-10-24

