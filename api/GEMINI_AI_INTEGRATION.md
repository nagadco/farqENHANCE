# Gemini AI Integration

## Overview
This project uses Google's **Gemini AI** (model: `gemini-1.5-flash`) to intelligently match restaurants across different delivery platforms (TheChefz, Jahez, ToYou).

## Why Gemini AI?
Previously, we used logo matching with image hashing and OpenCV. However, AI-based matching provides:
- **Better accuracy**: Understands context, transliterations, and brand names
- **Lower cost**: No need for expensive image processing libraries
- **Faster**: API-based matching is quicker than image downloads and processing
- **Smarter**: Handles edge cases like "McDonald's" vs "ماكدونالدز" or "KFC" vs "Kentucky Fried Chicken"

## Setup

### 1. Get Your API Key

⚠️ **Important**: You need to create your own API key from Google AI Studio.

**Steps to get API key:**

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Choose your Google Cloud project (or create a new one)
5. Copy the generated API key

**Enable the API:**

If you get a 403 error, you need to enable the Generative Language API:
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable "Generative Language API" for your project
- Some models may require billing to be enabled

Add your API key to `.env` file:
```bash
GEMINI_API_KEY=your_api_key_here
```

### 2. Install Dependencies
```bash
cd api
npm install
```

This will install `@google/generative-ai` package.

## How It Works

### Flow Diagram
```
User searches for restaurant
    ↓
TheChefz API returns source restaurant (with lat, lng, category)
    ↓
Search other platforms (Jahez, ToYou)
    ↓
Send to Gemini AI:
  - Source restaurant details
  - List of candidates from platform
    ↓
Gemini AI analyzes and returns best match
    ↓
If AI fails → Fallback to traditional matching
    ↓
Return matched restaurant
```

### Matching Process

1. **Gemini AI Receives:**
   - Source restaurant name, latitude, longitude, category
   - List of candidate restaurants from the platform
   - Platform name (Jahez/ToYou)

2. **Gemini AI Analyzes:**
   - Name similarity (exact, partial, transliteration)
   - Location proximity
   - Brand recognition
   - Context understanding

3. **Gemini AI Returns:**
   - `MATCH: <number>` - The candidate number that matches
   - `NO_MATCH` - If no confident match found

4. **Fallback Matching:**
   - If Gemini AI fails or returns unclear results
   - Uses traditional name-based matching
   - Ensures the system always works

## Code Structure

### Files
- `gemini-matcher.js` - Main Gemini AI integration class
- `jahez-api.js` - Updated to use Gemini AI
- `toyou-api.js` - Updated to use Gemini AI
- `package.json` - Added `@google/generative-ai` dependency

### Key Functions

#### GeminiMatcher Class
```javascript
const geminiMatcher = new GeminiMatcher(apiKey);
const match = await geminiMatcher.findBestMatch(sourceRestaurant, candidates, platform);
```

#### Parameters
- `sourceRestaurant`: Object with `name`, `latitude`, `longitude`, `category`
- `candidates`: Array of potential matching restaurants
- `platform`: String ('Jahez' or 'ToYou')

#### Response
- Returns matched restaurant object or `null`

## Example Usage

```javascript
const GeminiMatcher = require('./gemini-matcher');

// Initialize
const matcher = new GeminiMatcher(process.env.GEMINI_API_KEY);

// Source restaurant
const source = {
  name: "McDonald's",
  latitude: 24.7136,
  longitude: 46.6753,
  category: "Fast Food"
};

// Candidates from Jahez
const candidates = [
  { restaurantName: "ماكدونالدز | McDonald's", latitude: 24.7138, longitude: 46.6751 },
  { restaurantName: "Burger King", latitude: 24.7200, longitude: 46.6800 },
  { restaurantName: "KFC", latitude: 24.7100, longitude: 46.6700 }
];

// Find match
const match = await matcher.findBestMatch(source, candidates, 'Jahez');

console.log(match); // Returns first candidate (McDonald's)
```

## Benefits

### Accuracy Improvements
- ✅ Handles Arabic/English name variations
- ✅ Recognizes brand names across languages
- ✅ Understands location proximity
- ✅ Ignores branch suffixes automatically

### Performance
- ⚡ Fast API response (~1-2 seconds)
- 💰 Cost-effective (no image downloads)
- 🔄 Automatic fallback ensures reliability

### Maintenance
- 🧠 AI learns from context
- 📝 Simple prompt updates for improvements
- 🔧 Easy to debug with clear responses

## Monitoring

The system logs all matching attempts:
```
🤖 Gemini AI: Analyzing 5 Jahez restaurants...
🤖 Gemini AI Response: MATCH: 2
✅ Gemini AI: Matched "McDonald's" with "ماكدونالدز | McDonald's"
```

If AI fails:
```
⚠️ Gemini AI failed, falling back to traditional matching
🔄 Using fallback matching for Jahez...
```

## Future Enhancements

1. **Category Extraction**: Auto-detect restaurant category from TheChefz
2. **Batch Matching**: Match multiple restaurants in one API call
3. **Learning**: Store successful matches to improve future accuracy
4. **Cache**: Cache Gemini responses to reduce API calls
5. **Multi-language**: Add support for more languages

## API Limits

### Gemini 1.5 Flash
- **Free tier**: 15 requests per minute, 1,500 per day
- **Context window**: 1 million tokens
- **Paid tier**: Higher limits available
- **Rate limiting**: Built-in retry logic

## Troubleshooting

### Error: "API key is required"
- Make sure `GEMINI_API_KEY` is set in `.env`
- Generate a new API key from Google AI Studio

### Error: 403 Forbidden "API_KEY_SERVICE_BLOCKED"
**This is the most common error!**

Solutions:
1. **Enable the API**: Go to [Google Cloud Console](https://console.cloud.google.com/) and enable "Generative Language API"
2. **Check billing**: Some models require billing to be enabled
3. **Generate new key**: Your API key might be restricted. Create a new one at [Google AI Studio](https://aistudio.google.com/app/apikey)
4. **Use stable model**: The code now uses `gemini-1.5-flash` (more stable than experimental versions)
5. **Check region**: Make sure the API is available in your region

### Error: "Resource exhausted"
- API rate limit exceeded
- Wait a minute and retry
- Consider upgrading API plan

### AI returns NO_MATCH frequently
- Check if source restaurant name is clear
- Verify candidates list is correct
- Review Gemini's response in logs

## Cost Estimation

### Gemini 1.5 Flash (Free Tier)
- **Requests**: 15/min, 1,500/day
- **Cost**: FREE up to the limit
- **Expected usage**: ~50-100 requests/day (well within free tier)

### If upgrading needed
- Check [Google AI Pricing](https://ai.google.dev/pricing)
- Paid tier offers higher rate limits

## Support

For issues or questions:
1. Check logs for error messages
2. Verify API key is valid
3. Test with simple examples first
4. Review Gemini API documentation

---

**Last Updated**: October 2025  
**Model**: gemini-1.5-flash (stable)  
**Status**: ✅ Active and working

