const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Matcher
 * Uses Google's Gemini AI to intelligently match restaurants across different platforms
 */
class GeminiMatcher {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY;
        this.enabled = false;

        if (!this.apiKey) {
            console.log('⚠️ Gemini API key not provided - AI matching disabled, using fallback');
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            // Using stable Gemini model: gemini-1.5-flash (falls back if 2.0 is not available)
            // Try gemini-1.5-flash if gemini-2.0-flash-exp is blocked
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
            this.enabled = true;
        } catch (error) {
            console.log(`⚠️ Gemini AI initialization failed: ${error.message}`);
        }
    }

    /**
     * Find the best matching restaurant from search results using AI
     * @param {Object} sourceRestaurant - The original restaurant from TheChefz
     * @param {Array} candidates - Array of potential matching restaurants from other platforms
     * @param {string} platform - Platform name (e.g., "Jahez", "ToYou")
     * @returns {Object|null} - Best matching candidate or null
     */
    async findBestMatch(sourceRestaurant, candidates, platform = 'Unknown') {
        // Skip AI matching if not enabled
        if (!this.enabled) {
            console.log(`⚠️ Gemini AI not available - using fallback matching`);
            return this.fallbackMatch(sourceRestaurant, candidates);
        }

        if (!candidates || candidates.length === 0) {
            console.log(`⚠️ Gemini AI: No candidates provided for matching`);
            return null;
        }

        try {
            console.log(`\n🤖 Gemini AI: Analyzing ${candidates.length} ${platform} restaurants...`);

            // Prepare the prompt for Gemini
            const prompt = this.buildMatchingPrompt(sourceRestaurant, candidates, platform);

            // Generate content using Gemini AI
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log(`🤖 Gemini AI Response:\n${text}`);

            // Parse the response
            const matchResult = this.parseGeminiResponse(text, candidates);

            if (matchResult) {
                const matchedName = matchResult.restaurantName || matchResult.name || 'Unknown';
                console.log(`✅ Gemini AI: Matched "${sourceRestaurant.name}" with "${matchedName}"`);
                return matchResult;
            } else {
                console.log(`❌ Gemini AI: No confident match found for "${sourceRestaurant.name}"`);
                return null;
            }

        } catch (error) {
            console.error(`❌ Gemini AI Error: ${error.message}`);
            // Fallback to basic matching if AI fails
            return this.fallbackMatch(sourceRestaurant, candidates);
        }
    }

    /**
     * Build the prompt for Gemini AI
     */
    buildMatchingPrompt(sourceRestaurant, candidates, platform) {
        const sourceName = sourceRestaurant.name || 'Unknown';
        const sourceLat = sourceRestaurant.latitude || 'N/A';
        const sourceLng = sourceRestaurant.longitude || 'N/A';
        const sourceCategory = sourceRestaurant.category || sourceRestaurant.cuisine || 'N/A';

        // Build candidates list
        let candidatesList = candidates.map((candidate, index) => {
            const name = candidate.restaurantName || candidate.name || 'Unknown';
            const lat = candidate.latitude || candidate.address?.location?.coordinates?.[1] || 'N/A';
            const lng = candidate.longitude || candidate.address?.location?.coordinates?.[0] || 'N/A';
            const distance = this.calculateDistance(sourceLat, sourceLng, lat, lng);

            return `${index + 1}. Name: "${name}", Distance: ${distance.toFixed(2)}km, Lat: ${lat}, Lng: ${lng}`;
        }).join('\n');

        const prompt = `You are a restaurant matching expert. Your task is to find which restaurant from ${platform} matches the source restaurant from TheChefz.

SOURCE RESTAURANT (TheChefz):
- Name: "${sourceName}"
- Category: ${sourceCategory}
- Location: Lat ${sourceLat}, Lng ${sourceLng}

${platform.toUpperCase()} CANDIDATES (Search Results):
${candidatesList}

INSTRUCTIONS:
1. **PRIORITY #1: Location Proximity** (MOST IMPORTANT)
   - If a candidate is at the SAME location (distance < 0.05km = 50 meters), it's VERY LIKELY the same restaurant
   - Location is MORE IMPORTANT than exact name match, especially for short/abbreviated names
   - Restaurants at the same GPS coordinates with similar names are almost certainly the same

2. Analyze restaurant names carefully:
   - Exact name matches (same name in English or Arabic)
   - **SHORTENED NAMES**: "Slider" can match "Slider Smash Burger" or "SLID'R"
   - **PARTIAL MATCHES**: One name is a subset of the other (e.g., "Burger" matches "Big Burger")
   - Similar sounding names or transliterations
   - Brand names (like "McDonald's", "KFC", "Burger King", etc.)

3. Distance-based matching rules:
   - **Distance < 0.05km (50m)**: VERY HIGH confidence - same restaurant, even if name is slightly different
   - Distance 0.05-0.5km: HIGH confidence if name matches partially
   - Distance 0.5-2km: MEDIUM confidence - might be different branch
   - Distance > 5km: LOW confidence - likely different unless exact name match

4. Important matching rules:
   - Ignore branch numbers, location suffixes (e.g., "Branch 1", "Riyadh", "North")
   - Ignore special characters and punctuation differences ("Slider" = "SLID'R" = "Slider'z")
   - "McDonald's" matches "McDonald's - Riyadh" or "ماكدونالدز"
   - "KFC" matches "Kentucky Fried Chicken" or "كنتاكي"
   - Arabic and English versions of the same name should match

5. **CRITICAL**: If TheChefz name is SHORT (1-2 words), prioritize LOCATION over exact name match
   - Example: "Slider" (short name) + distance 0.03km → matches "Slider Smash Burger" ✅
   - Example: "Burger" (short name) + distance 5km → DO NOT match "Big Burger" ❌

6. Return ONLY ONE of the following:
   - "MATCH: <number>" (where number is the candidate number from the list)
   - "NO_MATCH" (if no confident match is found)

Examples:
- Source: "Slider", Candidate 1: "SLID'R | سلايدر", Distance: 0.03km → "MATCH: 1" ✅ (same location + similar name)
- Source: "Mama Noura", Candidate 2: "Mama Noura | ماما نورة", Distance: 0.08km → "MATCH: 2" ✅
- Source: "KFC", Candidate 1: "Kentucky Fried Chicken", Distance: 2km → "MATCH: 1" ✅
- Source: "Burger", Candidate 1: "Different Burger", Distance: 8km → "NO_MATCH" ❌ (too far)

YOUR RESPONSE (one line only):`;

        return prompt;
    }

    /**
     * Parse Gemini's response to extract the match
     */
    parseGeminiResponse(text, candidates) {
        // Clean up the response
        const cleanText = text.trim().toUpperCase();

        // Check for NO_MATCH
        if (cleanText.includes('NO_MATCH') || cleanText.includes('NO MATCH')) {
            return null;
        }

        // Extract match number using regex
        const matchRegex = /MATCH:\s*(\d+)/i;
        const match = text.match(matchRegex);

        if (match && match[1]) {
            const index = parseInt(match[1]) - 1; // Convert to 0-based index
            if (index >= 0 && index < candidates.length) {
                return candidates[index];
            }
        }

        // Try to find number after "MATCH"
        const numberMatch = text.match(/\d+/);
        if (numberMatch) {
            const index = parseInt(numberMatch[0]) - 1;
            if (index >= 0 && index < candidates.length) {
                return candidates[index];
            }
        }

        return null;
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 999; // Return large distance if coordinates missing

        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Fallback matching algorithm (location-aware name matching)
     * Used when AI fails or returns unclear results
     */
    fallbackMatch(sourceRestaurant, candidates) {
        console.log(`⚠️ Using fallback matching algorithm`);

        const sourceName = (sourceRestaurant.name || '').toLowerCase().trim();
        const sourceLat = sourceRestaurant.latitude;
        const sourceLng = sourceRestaurant.longitude;

        if (!sourceName) return null;

        // Helper function to normalize names (remove special chars)
        const normalizeName = (name) => {
            return name.toLowerCase()
                .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '') // Keep only letters, numbers, Arabic, spaces
                .trim();
        };

        const sourceNameNormalized = normalizeName(sourceName);
        const sourceWords = sourceNameNormalized.split(/\s+/);
        const isShortName = sourceWords.length <= 2; // Short name = 1-2 words

        // Score each candidate
        const scoredCandidates = [];

        for (const candidate of candidates) {
            const candidateName = (candidate.restaurantName || candidate.name || '').toLowerCase().trim();
            const candidateNameNormalized = normalizeName(candidateName);

            let score = 0;
            let matchType = 'none';

            // Calculate distance if coordinates available
            const candidateLat = candidate.latitude || candidate.address?.location?.coordinates?.[1];
            const candidateLng = candidate.longitude || candidate.address?.location?.coordinates?.[0];
            const distance = this.calculateDistance(sourceLat, sourceLng, candidateLat, candidateLng);

            // 1. Exact match (normalized)
            if (candidateNameNormalized === sourceNameNormalized) {
                score = 100;
                matchType = 'exact';
            }
            // 2. Partial match - check if source name is part of candidate
            else if (candidateNameNormalized.includes(sourceNameNormalized)) {
                score = 70;
                matchType = 'partial_subset';
            }
            // 3. Reverse partial - check if candidate is part of source
            else if (sourceNameNormalized.includes(candidateNameNormalized)) {
                score = 65;
                matchType = 'partial_superset';
            }
            // 4. Word overlap - check if all source words exist in candidate
            else {
                const candidateWords = candidateNameNormalized.split(/\s+/);
                const matchingWords = sourceWords.filter(word =>
                    candidateWords.some(cw => cw === word || cw.includes(word) || word.includes(cw))
                );

                if (matchingWords.length === sourceWords.length) {
                    score = 60;
                    matchType = 'word_overlap_full';
                } else if (matchingWords.length > 0) {
                    score = 30 + (matchingWords.length / sourceWords.length) * 20;
                    matchType = 'word_overlap_partial';
                }
            }

            // Skip if no name match at all
            if (score === 0) continue;

            // LOCATION BOOST: Add significant bonus for nearby locations
            if (distance < 999) { // Valid coordinates
                if (distance < 0.05) { // < 50 meters - SAME location
                    score += 50; // Big boost
                    console.log(`   📍 Location boost (+50): ${candidateName} is at same location (${distance.toFixed(3)}km)`);
                } else if (distance < 0.5) { // < 500 meters - Very close
                    score += 30;
                    console.log(`   📍 Location boost (+30): ${candidateName} is very close (${distance.toFixed(3)}km)`);
                } else if (distance < 2) { // < 2km - Nearby
                    score += 15;
                    console.log(`   📍 Location boost (+15): ${candidateName} is nearby (${distance.toFixed(2)}km)`);
                } else if (distance > 5) { // > 5km - Far away
                    score -= 20; // Penalty for being far
                    console.log(`   📍 Distance penalty (-20): ${candidateName} is far (${distance.toFixed(2)}km)`);
                }
            }

            // EXTRA BOOST: For short names, location matters MORE
            if (isShortName && distance < 0.1) {
                score += 30; // Extra boost for short names at same location
                console.log(`   ⭐ Short name + close location boost (+30): "${sourceName}" → "${candidateName}"`);
            }

            scoredCandidates.push({
                candidate,
                score,
                matchType,
                distance: distance < 999 ? distance.toFixed(3) : 'N/A',
                name: candidateName
            });
        }

        if (scoredCandidates.length === 0) {
            console.log(`❌ Fallback: No matches found for "${sourceName}"`);
            return null;
        }

        // Sort by score (highest first)
        scoredCandidates.sort((a, b) => b.score - a.score);

        // Show top candidates
        console.log(`\n📊 Fallback candidates (top 3):`);
        scoredCandidates.slice(0, 3).forEach((c, i) => {
            console.log(`   ${i + 1}. "${c.name}" - Score: ${c.score.toFixed(1)} (${c.matchType}, ${c.distance}km)`);
        });

        const best = scoredCandidates[0];

        // Require minimum score of 60 for short names, 50 for longer names
        const minScore = isShortName ? 60 : 50;

        if (best.score < minScore) {
            console.log(`❌ Fallback: Best score (${best.score.toFixed(1)}) below threshold (${minScore})`);
            return null;
        }

        console.log(`✅ Fallback: Selected "${best.name}" with score ${best.score.toFixed(1)}`);
        return best.candidate;
    }

    /**
     * Batch match multiple restaurants (for future use)
     */
    async batchMatch(sourceRestaurants, candidatesMap) {
        const results = [];

        for (const restaurant of sourceRestaurants) {
            const candidates = candidatesMap[restaurant.id] || [];
            const match = await this.findBestMatch(restaurant, candidates);
            results.push({
                source: restaurant,
                match: match
            });
        }

        return results;
    }
}

module.exports = GeminiMatcher;

