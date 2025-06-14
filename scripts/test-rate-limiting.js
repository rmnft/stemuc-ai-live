// Test Rate Limiting Configuration
const API_URL = 'https://stemuc-ai-live-production.up.railway.app';

console.log('🔒 Testing Rate Limiting Configuration');
console.log('=====================================');

// Test multiple requests to check rate limiting
async function testRateLimit(endpoint, numRequests = 10, delayMs = 100) {
    console.log(`\n🎯 Testing ${endpoint} with ${numRequests} requests (${delayMs}ms delay)`);
    
    const results = {
        success: 0,
        rateLimited: 0,
        errors: 0,
        responses: []
    };
    
    for (let i = 1; i <= numRequests; i++) {
        try {
            const startTime = Date.now();
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Origin': 'https://stemuc-ai-live.vercel.app'
                }
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (response.status === 429) {
                results.rateLimited++;
                console.log(`❌ Request ${i}: Rate Limited (429) - ${duration}ms`);
            } else if (response.ok) {
                results.success++;
                console.log(`✅ Request ${i}: Success (${response.status}) - ${duration}ms`);
            } else {
                results.errors++;
                console.log(`⚠️ Request ${i}: Error (${response.status}) - ${duration}ms`);
            }
            
            results.responses.push({
                request: i,
                status: response.status,
                duration: duration
            });
            
            // Add delay between requests
            if (i < numRequests) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            
        } catch (error) {
            results.errors++;
            console.log(`❌ Request ${i}: Network Error - ${error.message}`);
        }
    }
    
    return results;
}

// Test different endpoints
async function runRateLimitTests() {
    console.log(`🎯 Testing rate limits for: ${API_URL}`);
    
    // Test 1: Health endpoint (should have high limit)
    console.log('\n📊 Test 1: Health Endpoint');
    const healthResults = await testRateLimit('/health', 15, 50);
    
    // Test 2: Status endpoint
    console.log('\n📊 Test 2: Status Endpoint');
    const statusResults = await testRateLimit('/status', 10, 100);
    
    // Test 3: Separate endpoint (OPTIONS request)
    console.log('\n📊 Test 3: Separate Endpoint (OPTIONS)');
    const separateResults = await testRateLimit('/separate', 8, 200);
    
    // Summary
    console.log('\n📋 Rate Limiting Test Summary:');
    console.log('==============================');
    
    const allTests = [
        { name: 'Health', results: healthResults },
        { name: 'Status', results: statusResults },
        { name: 'Separate', results: separateResults }
    ];
    
    allTests.forEach(test => {
        const total = test.results.success + test.results.rateLimited + test.results.errors;
        console.log(`\n🎯 ${test.name} Endpoint:`);
        console.log(`  ✅ Success: ${test.results.success}/${total}`);
        console.log(`  ❌ Rate Limited: ${test.results.rateLimited}/${total}`);
        console.log(`  ⚠️ Errors: ${test.results.errors}/${total}`);
        
        if (test.results.rateLimited > 0) {
            console.log(`  🔒 Rate limiting is active`);
        } else {
            console.log(`  🟢 No rate limiting triggered`);
        }
    });
    
    // Recommendations
    console.log('\n🔧 Recommendations:');
    const totalRateLimited = allTests.reduce((sum, test) => sum + test.results.rateLimited, 0);
    
    if (totalRateLimited === 0) {
        console.log('✅ Rate limiting appears to be working correctly');
        console.log('✅ Limits are appropriate for normal usage');
    } else if (totalRateLimited < 5) {
        console.log('⚠️ Some rate limiting triggered - monitor in production');
    } else {
        console.log('❌ High rate limiting - consider increasing limits');
    }
    
    return allTests;
}

// Test rate limiting recovery
async function testRateLimitRecovery() {
    console.log('\n🔄 Testing Rate Limit Recovery');
    console.log('==============================');
    
    // Make rapid requests to trigger rate limiting
    console.log('🚀 Making rapid requests to trigger rate limiting...');
    await testRateLimit('/health', 20, 10); // Very fast requests
    
    // Wait and test recovery
    console.log('\n⏳ Waiting 30 seconds for rate limit recovery...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('🔄 Testing if rate limit has recovered...');
    const recoveryResults = await testRateLimit('/health', 5, 1000);
    
    if (recoveryResults.success > 0) {
        console.log('✅ Rate limit recovery working correctly');
    } else {
        console.log('❌ Rate limit recovery may be too slow');
    }
}

// Run all tests
async function runAllTests() {
    try {
        const results = await runRateLimitTests();
        
        // Optional: Test recovery (uncomment if needed)
        // await testRateLimitRecovery();
        
        console.log('\n🎉 Rate limiting tests completed!');
        return results;
        
    } catch (error) {
        console.error('❌ Rate limiting tests failed:', error);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testRateLimit };
} else {
    // Browser environment - run tests
    runAllTests().catch(console.error);
} 