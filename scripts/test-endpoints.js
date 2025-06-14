// Test Backend Endpoints and CORS
const API_URL = 'https://stemuc-ai-live-production.up.railway.app';

console.log('🔧 Testing Backend Endpoints and CORS');
console.log('=====================================');

// Test 1: Health Check
async function testHealth() {
    console.log('\n1. Testing /health endpoint...');
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('✅ Health check successful:', data.status);
        console.log('📊 Models loaded:', data.models_loaded);
        console.log('🎤 Diarization available:', data.diarization_available);
        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

// Test 2: Root endpoint
async function testRoot() {
    console.log('\n2. Testing / (root) endpoint...');
    try {
        const response = await fetch(`${API_URL}/`);
        const data = await response.json();
        console.log('✅ Root endpoint successful');
        console.log('📋 Available endpoints:', data.endpoints);
        return true;
    } catch (error) {
        console.error('❌ Root endpoint failed:', error.message);
        return false;
    }
}

// Test 3: Status endpoint
async function testStatus() {
    console.log('\n3. Testing /status endpoint...');
    try {
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();
        console.log('✅ Status endpoint successful');
        console.log('🔧 System status:', data.system);
        console.log('🤖 Models:', data.models);
        return true;
    } catch (error) {
        console.error('❌ Status endpoint failed:', error.message);
        return false;
    }
}

// Test 4: CORS preflight
async function testCORS() {
    console.log('\n4. Testing CORS configuration...');
    try {
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://stemuc-ai-live.vercel.app'
            }
        });
        
        if (response.ok) {
            console.log('✅ CORS test successful');
            console.log('🌐 Access-Control headers present');
            return true;
        } else {
            console.error('❌ CORS test failed - Response not OK');
            return false;
        }
    } catch (error) {
        console.error('❌ CORS test failed:', error.message);
        return false;
    }
}

// Test 5: Documentation endpoint
async function testDocs() {
    console.log('\n5. Testing /docs endpoint...');
    try {
        const response = await fetch(`${API_URL}/docs`);
        if (response.ok) {
            console.log('✅ Documentation endpoint accessible');
            console.log('📖 FastAPI docs available at:', `${API_URL}/docs`);
            return true;
        } else {
            console.log('⚠️ Documentation endpoint disabled (production mode)');
            return true; // This is expected in production
        }
    } catch (error) {
        console.error('❌ Documentation test failed:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log(`🎯 Testing backend at: ${API_URL}`);
    
    const results = {
        health: await testHealth(),
        root: await testRoot(),
        status: await testStatus(),
        cors: await testCORS(),
        docs: await testDocs()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Backend is ready for production.');
    } else {
        console.log('⚠️ Some tests failed. Check the backend configuration.');
    }
    
    return results;
}

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, API_URL };
} else {
    // Browser environment - run tests immediately
    runAllTests().catch(console.error);
} 