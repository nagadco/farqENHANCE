# Farq API Setup & Analytics Checklist

هذا المستند يلخص جميع الخطوات الضرورية لتشغيل API الجديد بسرعة، مع مصدر البيانات الفوري وSupabase للتحليلات.

## ١. إعداد البيئة
- `DATA_PRIMARY=excel` لضمان أن `/compare` يستخدم ملف Excel كقاعدة رئيسية.
- `EXCEL_PATH=E:\farq\farq_enhancment\farq_database_full_export_20251103_231437.xlsx`
- `PERSIST_MODE=supabase` لتفعيل الحفظ في Supabase (أو `file` لحفظ JSON محلي).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (service key ضروري لكتابة الجداول). إن لم يكن متاحًا، زود `SUPABASE_KEY` واستخدم RLS مع سياسة إدراج.
- `CACHE_TTL_MINUTES` و`RESTAURANTS_TTL_MINUTES` للتحكم في زمن صلاحية الكاش.

## ٢. جداول Supabase المطلوبة
شغّل `farqqq/api/sql/setup.sql` داخل SQL Editor في مشروع Supabase. تضمّن:
- `compare_requests`: سجل كل طلب والمسار والنتيجة.
- `restaurants_cache` و`delivery_options_cache`: تسريع العودة لبيانات نفس المطعم.
- `pricing_snapshots`: سجل كل تطبيق/سعر/عرض.
- `events`: حفظ كل سلوك من الواجهة.
- materialized views `app_price_wins_daily` و`savings_daily` جاهزة للتحديث اليدوي.

## ٣. آلية التشغيل
1. `npm install` في `farqqq/api` لتحميل `@supabase/supabase-js`, `xlsx`, `flexsearch` وغيرها.
2. شغّل `npm start` بعد إعداد `.env`; `DATA_PRIMARY=excel` يضمن بحث فائق السرعة.
3. كل `/compare` و`/restaurant/:id/delivery-options` يكتبون cache + snapshot + analysis عبر `persistence.js`.
4. نقطة `/analytics` تستقبل أحداث الواجهة (page_view, load_prices, deep_link, wishlist…).

## ٤. تحسينات لتحليلات التطبيقات المنافسة
- كل حدث/سعر يُخزن في Supabase؛ يمكنك استخدام Supabase Studio أو ربط Metabase/Tablo لتقارير جيّدة.
- يمكنك إنشاء SQL views إضافية أو تشغيل Jobs لتنظيف السجلات الأقدم من TTL.

## ٥. قائمة تحقق سريعة
[] Data primary = Excel ✅
[] Supabase tables + cron (SQL script جاهز) ✅
[] Persistence via supabase-js + caching ✅
[] Analytics endpoint + snapshots ✅
[] Frontend analytics client – يحتاج تتفعيل (إن رغبت)

## ٦. تشغيل سريع
```bash
cd farqqq/api
npm install    # dependencies جديدة
npm start
```
وبعدها افتح `http://localhost:3001/compare` أو شغّل الواجهة على `http://localhost:5173` وستستخدم البيانات المحلية والخدمات المحفوظة.
