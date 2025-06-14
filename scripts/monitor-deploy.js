// Monitor Railway deployment status
const API_URL = 'https://stemuc-ai-live-production.up.railway.app';

console.log('🔄 Monitoring Railway Deployment Status');
console.log('=======================================');

let attempts = 0;
const maxAttempts = 20; // 10 minutes max
const interval = 30000; // 30 seconds

async function checkDeploymentStatus() {
    attempts++;
    console.log(`\n🔍 Attempt ${attempts}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
    
    try {
        // Test health endpoint
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        
        console.log('📊 Health Status:', healthData.status);
        console.log('📅 Timestamp:', healthData.timestamp);
        console.log('🔢 Version:', healthData.version || 'unknown');
        
        // Test CORS
        const corsResponse = await fetch(`${API_URL}/health`, {
            method: 'GET',
            headers: {
                'Origin': 'https://stemuc-ai-live.vercel.app'
            }
        });
        
        const hasCORS = corsResponse.headers.get('access-control-allow-origin');
        console.log('🌐 CORS Headers:', hasCORS ? '✅ Present' : '❌ Missing');
        
        // Test /separate endpoint
        const separateResponse = await fetch(`${API_URL}/separate`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://stemuc-ai-live.vercel.app',
                'Access-Control-Request-Method': 'POST'
            }
        });
        
        console.log('🎯 /separate Status:', separateResponse.status);
        
        // Check if deployment is successful
        if (hasCORS && (separateResponse.status === 200 || separateResponse.status === 405)) {
            console.log('\n🎉 SUCCESS! Deployment is ready:');
            console.log('✅ CORS headers present');
            console.log('✅ /separate endpoint available');
            console.log('\n🚀 You can now proceed with Vercel deployment!');
            return true;
        } else {
            console.log('⏳ Still waiting for deployment...');
            if (!hasCORS) console.log('  - CORS headers missing');
            if (separateResponse.status === 404) console.log('  - /separate endpoint not found');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error checking deployment:', error.message);
        return false;
    }
}

async function monitorDeployment() {
    console.log(`🎯 Monitoring: ${API_URL}`);
    console.log('⏰ Checking every 30 seconds...');
    
    const success = await checkDeploymentStatus();
    if (success) {
        return;
    }
    
    if (attempts >= maxAttempts) {
        console.log('\n⚠️ Maximum attempts reached. Deployment may have failed.');
        console.log('🔧 Manual steps:');
        console.log('1. Check Railway dashboard for deployment logs');
        console.log('2. Verify the latest commit was deployed');
        console.log('3. Check for any build errors');
        return;
    }
    
    // Schedule next check
    setTimeout(monitorDeployment, interval);
}

// Start monitoring
monitorDeployment().catch(console.error);

// Also provide manual test commands
console.log('\n📋 Manual Test Commands:');
console.log('========================');
console.log('// Test in browser console:');
console.log(`fetch('${API_URL}/health').then(r => r.json()).then(console.log)`);
console.log(`fetch('${API_URL}/separate', {method: 'OPTIONS'}).then(r => console.log('Status:', r.status))`);
console.log('\n// Test CORS:');
console.log(`fetch('${API_URL}/health', {headers: {'Origin': 'https://stemuc-ai-live.vercel.app'}}).then(r => console.log('CORS:', r.headers.get('access-control-allow-origin')))`); 