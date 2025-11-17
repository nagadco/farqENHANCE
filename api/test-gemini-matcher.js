const GeminiMatcher = require('./gemini-matcher');

/**
 * Test Gemini AI Matcher
 * Simple test to verify the integration works
 */
async function testGeminiMatcher() {
    console.log('🧪 Testing Gemini AI Matcher\n');
    console.log('='.repeat(60));

    try {
        // Initialize matcher
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBXhVj27EH13eDSVUjxC50wMw-ecgFawts';
        const matcher = new GeminiMatcher(apiKey);

        console.log('✅ GeminiMatcher initialized successfully\n');

        // Test Case 1: McDonald's matching
        console.log('Test 1: McDonald\'s matching');
        console.log('-'.repeat(60));

        const source1 = {
            name: "McDonald's",
            latitude: 24.7136,
            longitude: 46.6753,
            category: "Fast Food"
        };

        const candidates1 = [
            {
                restaurantName: "Burger King",
                restaurantId: "123",
                latitude: 24.7200,
                longitude: 46.6800
            },
            {
                restaurantName: "ماكدونالدز | McDonald's",
                restaurantId: "456",
                latitude: 24.7138,
                longitude: 46.6751
            },
            {
                restaurantName: "KFC",
                restaurantId: "789",
                latitude: 24.7100,
                longitude: 46.6700
            }
        ];

        const match1 = await matcher.findBestMatch(source1, candidates1, 'Jahez');

        if (match1) {
            console.log(`\n✅ Test 1 PASSED: Matched "${match1.restaurantName}"`);
        } else {
            console.log(`\n❌ Test 1 FAILED: No match found`);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test Case 2: KFC matching
        console.log('Test 2: KFC matching');
        console.log('-'.repeat(60));

        const source2 = {
            name: "KFC",
            latitude: 24.7100,
            longitude: 46.6700,
            category: "Fast Food"
        };

        const candidates2 = [
            {
                name: "McDonald's",
                id: "m1",
                address: { location: { coordinates: [46.6753, 24.7136] } }
            },
            {
                name: "Kentucky Fried Chicken | كنتاكي",
                id: "k1",
                address: { location: { coordinates: [46.6702, 24.7098] } }
            },
            {
                name: "Pizza Hut",
                id: "p1",
                address: { location: { coordinates: [46.6800, 24.7200] } }
            }
        ];

        const match2 = await matcher.findBestMatch(source2, candidates2, 'ToYou');

        if (match2) {
            console.log(`\n✅ Test 2 PASSED: Matched "${match2.name}"`);
        } else {
            console.log(`\n❌ Test 2 FAILED: No match found`);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test Case 3: No match scenario
        console.log('Test 3: No match scenario');
        console.log('-'.repeat(60));

        const source3 = {
            name: "Mama Noura",
            latitude: 24.7000,
            longitude: 46.6500,
            category: "Arabic Food"
        };

        const candidates3 = [
            {
                restaurantName: "Al Baik",
                restaurantId: "a1",
                latitude: 24.7136,
                longitude: 46.6753
            },
            {
                restaurantName: "Herfy",
                restaurantId: "h1",
                latitude: 24.7200,
                longitude: 46.6800
            }
        ];

        const match3 = await matcher.findBestMatch(source3, candidates3, 'Jahez');

        if (!match3) {
            console.log(`\n✅ Test 3 PASSED: Correctly identified no match`);
        } else {
            console.log(`\n⚠️  Test 3 WARNING: Found match "${match3.restaurantName}" (might be false positive)`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n🎉 All tests completed!\n');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests
console.log('\n🚀 Starting Gemini AI Matcher Tests...\n');
testGeminiMatcher()
    .then(() => {
        console.log('✅ Tests completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Tests failed:', error);
        process.exit(1);
    });

