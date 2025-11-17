const fs = require('fs');
const path = require('path');

const PERSIST_MODE = (process.env.PERSIST_MODE || '').toLowerCase(); // 'supabase' | 'file' | ''
const { getSupabaseAdmin } = require('./supabaseClient');
const CACHE_TTL_MINUTES = parseInt(process.env.CACHE_TTL_MINUTES || '60', 10); // delivery options
const RESTAURANTS_TTL_MINUTES = parseInt(process.env.RESTAURANTS_TTL_MINUTES || '360', 10);

const responsesDir = path.join(__dirname, 'responses');
if (!fs.existsSync(responsesDir)) {
  try {
    fs.mkdirSync(responsesDir, { recursive: true });
  } catch (_) {}
}

function nowIso() {
  return new Date().toISOString();
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

// supabase-js client is used via getSupabaseAdmin(); REST fallback removed

async function saveCompareResult(requestData, result) {
  if (PERSIST_MODE === 'file') {
    const fileName = `compare_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(responsesDir, fileName);
    fs.writeFileSync(
      filePath,
      JSON.stringify({ endpoint: 'compare', timestamp: nowIso(), request: requestData, response: result }, null, 2),
      'utf8'
    );
    return { file: fileName };
  }
  if (PERSIST_MODE === 'supabase') {
    const expires_at = addMinutes(new Date(), RESTAURANTS_TTL_MINUTES).toISOString();
    try {
      const supabase = await getSupabaseAdmin();
      await supabase.from('compare_requests').insert({
        latitude: requestData.latitude,
        longitude: requestData.longitude,
        page: requestData.page,
        position: requestData.position,
        max_chefs: requestData.maxChefs,
        processed_at: nowIso(),
        expires_at,
        response: result,
      });
    } catch (e) {
      console.error('Supabase saveCompareResult error:', e.message);
    }
    return { saved: true };
  }
  return null;
}

async function saveRestaurants(restaurantsArray) {
  if (PERSIST_MODE === 'supabase') {
    const expires_at = addMinutes(new Date(), RESTAURANTS_TTL_MINUTES).toISOString();
    const rows = restaurantsArray.map(r => ({
      restaurant_id: r.id || null,
      name: r.name,
      data: r,
      expires_at,
      created_at: nowIso(),
    }));
    try {
      const supabase = await getSupabaseAdmin();
      await supabase.from('restaurants_cache').upsert(rows, { onConflict: 'restaurant_id' });
    } catch (e) {
      console.error('Supabase saveRestaurants error:', e.message);
    }
  } else if (PERSIST_MODE === 'file') {
    const fileName = `restaurants_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(responsesDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(restaurantsArray, null, 2), 'utf8');
  }
}

async function getCachedDeliveryOptions(restaurantId) {
  if (PERSIST_MODE !== 'supabase') return null;
  try {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('delivery_options_cache')
      .select('delivery_options')
      .eq('restaurant_id', restaurantId)
      .gt('expires_at', nowIso())
      .maybeSingle();
    if (error) throw error;
    if (data && data.delivery_options) return data.delivery_options;
  } catch (e) {
    console.error('Supabase getCachedDeliveryOptions error:', e.message);
  }
  return null;
}

async function setCachedDeliveryOptions(restaurantId, deliveryOptions) {
  if (PERSIST_MODE === 'supabase') {
    const expires_at = addMinutes(new Date(), CACHE_TTL_MINUTES).toISOString();
    try {
      const supabase = await getSupabaseAdmin();
      await supabase.from('delivery_options_cache').upsert({
        restaurant_id: Number(restaurantId) || null,
        delivery_options: deliveryOptions,
        expires_at,
        created_at: nowIso(),
      }, { onConflict: 'restaurant_id' });
    } catch (e) {
      console.error('Supabase setCachedDeliveryOptions error:', e.message);
    }
  } else if (PERSIST_MODE === 'file') {
    const fileName = `delivery_options_${restaurantId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(responsesDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(deliveryOptions, null, 2), 'utf8');
  }
}

module.exports = {
  saveCompareResult,
  saveRestaurants,
  getCachedDeliveryOptions,
  setCachedDeliveryOptions,
};

// -------- Extended analytics & snapshots --------

async function saveEvent(event, props) {
  if (!event) return;
  if (PERSIST_MODE === 'file') {
    const fileName = `event_${new Date().toISOString().replace(/[:.]/g, '-')}_${event}.json`;
    const filePath = path.join(responsesDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify({ ts: nowIso(), event, props }, null, 2), 'utf8');
    return;
  }
  if (PERSIST_MODE === 'supabase') {
    try {
      const supabase = await getSupabaseAdmin();
      await supabase.from('events').insert({ ts: nowIso(), event, props });
    } catch (e) {
      console.error('Supabase saveEvent error:', e.message);
    }
  }
}

async function savePricingSnapshots({
  restaurantId,
  restaurantName,
  options,
  latitude,
  longitude,
  city,
}) {
  if (!Array.isArray(options) || options.length === 0) return;
  const ts = nowIso();
  if (PERSIST_MODE === 'file') {
    const fileName = `pricing_${new Date().toISOString().replace(/[:.]/g, '-')}_${restaurantId || 'unknown'}.json`;
    const filePath = path.join(responsesDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify({ ts, restaurantId, restaurantName, latitude, longitude, city, options }, null, 2), 'utf8');
    return;
  }
  if (PERSIST_MODE === 'supabase') {
    const rows = options.map((opt) => ({
      ts,
      restaurant_id: restaurantId || null,
      restaurant_name: restaurantName || null,
      app: opt.name || null,
      price: (typeof opt.price === 'string' ? parseFloat(opt.price) : opt.price) ?? null,
      original_price: opt.originalPrice ? parseFloat(opt.originalPrice) : null,
      is_free: !!opt.isFree,
      has_offer: !!opt.hasOffer,
      has_prime: !!opt.hasPrime,
      delivery_time: opt.time || null,
      city: city || null,
      raw: opt,
    }));
    try {
      const supabase = await getSupabaseAdmin();
      await supabase.from('pricing_snapshots').insert(rows);
    } catch (e) {
      console.error('Supabase savePricingSnapshots error:', e.message);
    }
  }
}

module.exports.saveEvent = saveEvent;
module.exports.savePricingSnapshots = savePricingSnapshots;
