const axios = require('axios');
let GoogleGenerativeAI;
try {
  ({ GoogleGenerativeAI } = require('@google/generative-ai'));
} catch (_err) {
  GoogleGenerativeAI = null;
}

class GeminiMatcherFacade {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.enabled = false;
    if (!this.apiKey || !GoogleGenerativeAI) return;
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      this.enabled = true;
    } catch (_e) {
      this.enabled = false;
    }
  }

  async generate(prompt) {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}

class OllamaMatcherFacade {
  constructor(model, host) {
    this.model = model || process.env.OLLAMA_MODEL; // e.g., "llama3.1:8b-instruct"
    this.host = host || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    this.enabled = !!this.model;
  }

  async generate(prompt) {
    const url = `${this.host.replace(/\/$/, '')}/api/generate`;
    const resp = await axios.post(url, {
      model: this.model,
      prompt,
      stream: false,
    }, { timeout: 30000 });
    if (resp.data && resp.data.response) return resp.data.response;
    return '';
  }
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => v === null || v === undefined || isNaN(Number(v)))) return Number.POSITIVE_INFINITY;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildMatchingPrompt(sourceRestaurant, candidates, platform = 'Unknown') {
  const sourceName = sourceRestaurant.name || 'Unknown';
  const sourceLat = sourceRestaurant.latitude ?? sourceRestaurant.lat ?? 'N/A';
  const sourceLng = sourceRestaurant.longitude ?? sourceRestaurant.lng ?? 'N/A';
  const sourceCategory = sourceRestaurant.category || sourceRestaurant.cuisine || 'N/A';

  const list = candidates.map((c, i) => {
    const name = c.restaurantName || c.name || 'Unknown';
    const lat = c.latitude || c.address?.location?.coordinates?.[1] || c.lat || 'N/A';
    const lng = c.longitude || c.address?.location?.coordinates?.[0] || c.lng || 'N/A';
    const dist = calculateDistanceKm(Number(sourceLat), Number(sourceLng), Number(lat), Number(lng));
    return `${i + 1}. name: "${name}", distance_km: ${isFinite(dist) ? dist.toFixed(2) : 'N/A'}, lat: ${lat}, lng: ${lng}`;
  }).join('\n');

  return `You match restaurants across apps. Choose the best candidate from ${platform} that corresponds to the source.

SOURCE:
- name: "${sourceName}"
- category: ${sourceCategory}
- lat: ${sourceLat}
- lng: ${sourceLng}

CANDIDATES (${platform}):
${list}

Return ONLY a compact JSON object on one line: {"index": <1-based best index or 0 if none>, "confidence": <0..1>, "restaurantName": "<matched name>"}.`;
}

function parseAiResponse(text, candidates) {
  if (!text) return null;
  // Try to find a JSON object in the response
  const match = text.match(/\{[\s\S]*\}/);
  let obj = null;
  try {
    obj = JSON.parse(match ? match[0] : text);
  } catch (_e) {
    return null;
  }
  const idx = Number(obj.index) || 0;
  if (idx < 1 || idx > candidates.length) return null;
  const cand = candidates[idx - 1];
  return {
    restaurantName: obj.restaurantName || cand.restaurantName || cand.name,
    index: idx - 1,
    confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.5,
    merchant: cand,
  };
}

class GeminiMatcher { // Keep class name for drop-in compatibility
  constructor(apiKey) {
    this.gemini = new GeminiMatcherFacade(apiKey);
    this.ollama = new OllamaMatcherFacade();
  }

  async findBestMatch(sourceRestaurant, candidates, platform = 'Unknown') {
    // Try Gemini first if enabled
    if (this.gemini && this.gemini.enabled) {
      try {
        const prompt = buildMatchingPrompt(sourceRestaurant, candidates, platform);
        const text = await this.gemini.generate(prompt);
        const parsed = parseAiResponse(text, candidates);
        if (parsed) return parsed;
      } catch (_e) {
        // swallow and try ollama
      }
    }

    // Try Ollama if configured
    if (this.ollama && this.ollama.enabled) {
      try {
        const prompt = buildMatchingPrompt(sourceRestaurant, candidates, platform);
        const text = await this.ollama.generate(prompt);
        const parsed = parseAiResponse(text, candidates);
        if (parsed) return parsed;
      } catch (_e) {
        // swallow to allow caller fallback
      }
    }

    return null; // Let caller's traditional fallback handle it
  }
}

module.exports = GeminiMatcher;

