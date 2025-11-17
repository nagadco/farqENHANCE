const path = require('path');
const fs = require('fs');
let XLSX;
try { XLSX = require('xlsx'); } catch (_) { XLSX = null; }
const { Document } = require('flexsearch');

let state = {
  loaded: false,
  rows: [],
  index: null,
  fields: ['name','nameAr','tags','city','altNames'],
};

function normalizeArabic(str = '') {
  return String(str)
    .normalize('NFKD')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[\u0640]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/[يى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]+/gu, '')
    .toLowerCase()
    .trim();
}

function toTags(val) {
  if (Array.isArray(val)) return val.filter(Boolean).map((t) => String(t).trim());
  if (!val) return [];
  return String(val)
    .split(/[;,،\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function distanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === undefined || v === null)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function mapRow(row, idx) {
  const id = row.id || row.ID || row.restaurant_id || row.branch_id || idx + 1;
  const name = row.name || row.Name || row.restaurant || row.restaurant_name || '';
  const nameAr = row.name_ar || row.nameAr || row['name ar'] || row['اسم'] || row['الاسم'] || '';
  const city = row.city || row.City || row['المدينة'] || '';
  const tags = toTags(row.tags || row.category || row.categories || row.cuisine || row['الفئة']);
  const lat = parseFloat(row.lat || row.latitude || row.Latitude);
  const lng = parseFloat(row.lng || row.long || row.longitude || row.Longitude);
  const rating = parseFloat(row.rating || row.Rating) || 4.5;
  const image = row.image || row.logo || row.logo_url || '';
  return {
    id: Number(id) || id,
    name: String(name || nameAr || 'Restaurant').trim(),
    nameAr: String(nameAr || name || '').trim(),
    city: String(city || '').trim(),
    tags,
    latitude: isFinite(lat) ? lat : undefined,
    longitude: isFinite(lng) ? lng : undefined,
    rating,
    image,
    reviewCount: row.reviews || row.review_count || undefined,
  };
}

function buildIndex(rows) {
  const index = new Document({
    document: {
      id: 'id',
      index: state.fields,
      store: ['id','name','nameAr','city']
    },
    tokenize: (str) => normalizeArabic(str).split(/\s+/),
  });
  rows.forEach((r) => {
    index.add({
      id: r.id,
      name: r.name,
      nameAr: r.nameAr,
      city: r.city || '',
      tags: (r.tags || []).join(' '),
      altNames: `${r.name} ${r.nameAr}`,
    });
  });
  return index;
}

function loadExcel(excelPath) {
  if (!XLSX) throw new Error('xlsx package not installed');
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.SheetNames[0];
  const json = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' });
  const rows = json.map(mapRow);
  state.rows = rows;
  state.index = buildIndex(rows);
  state.loaded = true;
  console.log(`📘 Loaded ${rows.length} restaurants from Excel`);
}

function ensureLoaded() {
  if (state.loaded) return;
  const excelPath = process.env.EXCEL_PATH || '';
  if (!excelPath || !fs.existsSync(excelPath)) {
    throw new Error('EXCEL_PATH not set or file not found');
  }
  loadExcel(excelPath);
}

function list({ page = 1, size = 50, latitude, longitude }) {
  ensureLoaded();
  const start = Math.max(0, (page - 1) * size);
  const end = start + size;
  const slice = state.rows.slice(start, end).map((r) => toFrontend(r, latitude, longitude));
  return { rows: slice, total: state.rows.length };
}

function search({ query = '', page = 1, size = 50, latitude, longitude }) {
  ensureLoaded();
  const q = normalizeArabic(query);
  if (!q) return list({ page, size, latitude, longitude });
  const hits = state.index.search(q, { limit: 500 }) || [];
  const ids = new Set();
  const ranked = [];
  const flat = Array.isArray(hits) ? hits.flatMap((h) => (h && h.result) ? h.result : []) : [];
  flat.forEach((id) => {
    if (!ids.has(id)) { ids.add(id); ranked.push(id); }
  });
  const rows = ranked.map((id) => state.rows.find((r) => r.id === id)).filter(Boolean);
  const start = Math.max(0, (page - 1) * size);
  const end = start + size;
  const pageRows = rows.slice(start, end).map((r) => toFrontend(r, latitude, longitude));
  return { rows: pageRows, total: rows.length };
}

function toFrontend(r, userLat, userLng) {
  let distance = 'N/A';
  if (r.latitude !== undefined && r.longitude !== undefined && userLat && userLng) {
    const d = distanceKm(userLat, userLng, r.latitude, r.longitude);
    if (isFinite(d)) distance = `${d.toFixed(1)}km`;
  }
  return {
    id: r.id,
    name: r.name,
    rating: r.rating || 4.5,
    distance,
    tags: r.tags || [],
    image: r.image || '',
    reviewCount: r.reviewCount || 0,
    isClosed: false,
    deliveryOptions: [],
    chefzData: { branchId: r.id, latitude: r.latitude, longitude: r.longitude, profilePicture: r.image },
    pricesLoaded: false,
    expanded: false,
  };
}

module.exports = {
  loadExcel,
  list,
  search,
  ensureLoaded,
};

