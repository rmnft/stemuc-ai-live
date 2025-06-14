// Test specific endpoint issues
const API_URL = 'https://stemuc-ai-live-production.up.railway.app';

console.log('🔍 Testing /separate endpoint specifically');
console.log('==========================================');

// Test 1: Check if /separate endpoint exists
async function testSeparateEndpoint() {
    console.log('\n1. Testing /separate endpoint existence...');
    
    // Test with OPTIONS first (CORS preflight)
    try {
        console.log('📋 Testing OPTIONS request...');
        const optionsResponse = await fetch(`${API_URL}/separate`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://stemuc-ai-live.vercel.app',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        
        console.log('✅ OPTIONS Status:', optionsResponse.status);
        console.log('📋 OPTIONS Headers:');
        for (let [key, value] of optionsResponse.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        if (optionsResponse.status === 404) {
            console.log('❌ /separate endpoint not found (404)');
            return false;
        }
        
    } catch (error) {
        console.error('❌ OPTIONS request failed:', error.message);
    }
    
    // Test with GET (should return 405 Method Not Allowed)
    try {
        console.log('\n📋 Testing GET request (should be 405)...');
        const getResponse = await fetch(`${API_URL}/separate`, {
            method: 'GET',
            headers: {
                'Origin': 'https://stemuc-ai-live.vercel.app'
            }
        });
        
        console.log('📊 GET Status:', getResponse.status);
        if (getResponse.status === 405) {
            console.log('✅ Endpoint exists (405 Method Not Allowed is expected)');
            return true;
        } else if (getResponse.status === 404) {
            console.log('❌ Endpoint does not exist (404)');
            return false;
        }
        
    } catch (error) {
        console.error('❌ GET request failed:', error.message);
    }
    
    return false;
}

// Test 2: Check available endpoints from root
async function checkAvailableEndpoints() {
    console.log('\n2. Checking available endpoints from root...');
    try {
        const response = await fetch(`${API_URL}/`);
        const data = await response.json();
        
        console.log('📋 Available endpoints:', data.endpoints);
        
        if (data.endpoints && data.endpoints.separate) {
            console.log('✅ /separate endpoint is listed in root');
            return true;
        } else {
            console.log('❌ /separate endpoint not listed in root');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Failed to check root endpoints:', error.message);
        return false;
    }
}

// Test 3: Check FastAPI docs for endpoints
async function checkDocsEndpoints() {
    console.log('\n3. Checking FastAPI docs...');
    try {
        const response = await fetch(`${API_URL}/openapi.json`);
        if (response.ok) {
            const openapi = await response.json();
            console.log('📋 Available paths in OpenAPI:');
            Object.keys(openapi.paths || {}).forEach(path => {
                console.log(`  ${path}`);
            });
            
            if (openapi.paths && openapi.paths['/separate']) {
                console.log('✅ /separate found in OpenAPI spec');
                return true;
            } else {
                console.log('❌ /separate not found in OpenAPI spec');
                return false;
            }
        } else {
            console.log('⚠️ OpenAPI spec not available');
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to check OpenAPI spec:', error.message);
        return false;
    }
}

// Test 4: Test CORS headers specifically
async function testCORSHeaders() {
    console.log('\n4. Testing CORS headers specifically...');
    try {
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            headers: {
                'Origin': 'https://stemuc-ai-live.vercel.app'
            }
        });
        
        console.log('📊 Response Status:', response.status);
        console.log('📋 CORS-related headers:');
        
        const corsHeaders = [
            'access-control-allow-origin',
            'access-control-allow-methods',
            'access-control-allow-headers',
            'access-control-expose-headers',
            'access-control-allow-credentials'
        ];
        
        let hasCORSHeaders = false;
        corsHeaders.forEach(header => {
            const value = response.headers.get(header);
            if (value) {
                console.log(`  ✅ ${header}: ${value}`);
                hasCORSHeaders = true;
            } else {
                console.log(`  ❌ ${header}: not present`);
            }
        });
        
        return hasCORSHeaders;
        
    } catch (error) {
        console.error('❌ CORS headers test failed:', error.message);
        return false;
    }
}

// Run all tests
async function runDiagnostics() {
    console.log(`🎯 Diagnosing issues with: ${API_URL}`);
    
    const results = {
        separateExists: await testSeparateEndpoint(),
        endpointsListed: await checkAvailableEndpoints(),
        openAPICheck: await checkDocsEndpoints(),
        corsHeaders: await testCORSHeaders()
    };
    
    console.log('\n📊 Diagnostic Results:');
    console.log('======================');
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log('\n🔧 Recommendations:');
    if (!results.separateExists) {
        console.log('❌ /separate endpoint missing - check backend deployment');
    }
    if (!results.corsHeaders) {
        console.log('❌ CORS headers missing - Railway may not have redeployed');
    }
    if (!results.endpointsListed) {
        console.log('❌ Endpoints not properly registered');
    }
    
    return results;
}

// Run diagnostics
runDiagnostics().catch(console.error); 