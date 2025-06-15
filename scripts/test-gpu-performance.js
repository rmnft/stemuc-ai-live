// Test GPU Performance for Audio Processing
const fs = require('fs');
const path = require('path');

const API_URL = 'https://stemuc-ai-live-production.up.railway.app';

console.log('🔥 Testing GPU Performance for Audio Processing');
console.log('===============================================');

// Test audio processing with different file sizes and modes
async function testGPUPerformance() {
    console.log(`🎯 Testing GPU performance for: ${API_URL}`);
    
    // Test 1: Health check to verify GPU status
    console.log('\n📊 Test 1: GPU Status Check');
    try {
        const response = await fetch(`${API_URL}/health`);
        const health = await response.json();
        
        console.log(`✅ Status: ${health.status}`);
        console.log(`🎮 Device: ${health.device}`);
        console.log(`🔥 CUDA Available: ${health.cuda_available}`);
        
        if (health.gpu_info) {
            console.log(`🚀 GPU: ${health.gpu_info.name}`);
            console.log(`💾 GPU Memory Total: ${(health.gpu_info.memory_total / 1024**3).toFixed(2)}GB`);
            console.log(`📊 GPU Memory Used: ${(health.gpu_info.memory_allocated / 1024**3).toFixed(2)}GB`);
        }
        
        console.log(`🤖 Models Loaded: ${health.models_loaded.join(', ')}`);
        console.log(`🎵 Demucs Ready: ${health.demucs_ready}`);
        
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return;
    }
    
    // Test 2: Performance test with test file
    console.log('\n📊 Test 2: Audio Processing Performance');
    
    const testFile = path.join(__dirname, '..', 'test_song.mp3');
    
    if (!fs.existsSync(testFile)) {
        console.log('⚠️ Test file not found. Skipping performance test.');
        console.log(`Expected: ${testFile}`);
        return;
    }
    
    const fileStats = fs.statSync(testFile);
    const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
    console.log(`📁 Test file: ${path.basename(testFile)} (${fileSizeMB}MB)`);
    
    // Test different modes
    const testModes = [
        { mode: '2-stem', description: 'Vocals + Instrumental' },
        { mode: '4-stem', description: 'Vocals, Drums, Bass, Other' },
        { mode: '6-stem', description: 'All instruments' }
    ];
    
    for (const testMode of testModes) {
        console.log(`\n🎵 Testing ${testMode.mode}: ${testMode.description}`);
        
        try {
            const formData = new FormData();
            const fileBuffer = fs.readFileSync(testFile);
            const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
            
            formData.append('file', blob, path.basename(testFile));
            formData.append('mode', testMode.mode);
            formData.append('enable_diarization', 'false');
            
            const startTime = Date.now();
            console.log(`⏱️ Starting ${testMode.mode} processing...`);
            
            const response = await fetch(`${API_URL}/separate`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Origin': 'https://stemuc-ai-live.vercel.app'
                }
            });
            
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${testMode.mode} completed in ${duration.toFixed(2)}s`);
                console.log(`📊 Stems generated: ${result.stems ? result.stems.length : 0}`);
                
                // Calculate performance metrics
                const mbPerSecond = (parseFloat(fileSizeMB) / duration).toFixed(2);
                console.log(`🚀 Processing speed: ${mbPerSecond} MB/s`);
                
                if (duration < 30) {
                    console.log(`🟢 Performance: EXCELLENT (< 30s)`);
                } else if (duration < 60) {
                    console.log(`🟡 Performance: GOOD (30-60s)`);
                } else {
                    console.log(`🔴 Performance: SLOW (> 60s)`);
                }
                
            } else {
                console.log(`❌ ${testMode.mode} failed: ${response.status}`);
                const errorText = await response.text();
                console.log(`Error: ${errorText}`);
            }
            
        } catch (error) {
            console.error(`❌ ${testMode.mode} error:`, error.message);
        }
        
        // Wait between tests to avoid overwhelming
        if (testMode !== testModes[testModes.length - 1]) {
            console.log('⏳ Waiting 10s before next test...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
    
    // Test 3: GPU Memory monitoring
    console.log('\n📊 Test 3: Final GPU Status');
    try {
        const response = await fetch(`${API_URL}/health`);
        const health = await response.json();
        
        if (health.gpu_info) {
            console.log(`💾 GPU Memory Final: ${(health.gpu_info.memory_allocated / 1024**3).toFixed(2)}GB`);
            console.log(`🗑️ GPU Memory Cached: ${(health.gpu_info.memory_cached / 1024**3).toFixed(2)}GB`);
        }
        
    } catch (error) {
        console.error('❌ Final health check failed:', error.message);
    }
}

// Performance recommendations
function showPerformanceRecommendations() {
    console.log('\n🔧 GPU Performance Recommendations:');
    console.log('=====================================');
    console.log('✅ Use ThreadPool for non-blocking processing');
    console.log('✅ Enable mixed precision (FP16) for faster inference');
    console.log('✅ Clear GPU cache between operations');
    console.log('✅ Use non_blocking=True for GPU transfers');
    console.log('✅ Optimize batch processing for multiple files');
    console.log('✅ Monitor GPU memory usage');
    console.log('✅ Use TensorFloat-32 on RTX GPUs');
    
    console.log('\n📊 Expected Performance Targets:');
    console.log('• 2-stem: < 15 seconds');
    console.log('• 4-stem: < 30 seconds');
    console.log('• 6-stem: < 45 seconds');
    console.log('• Processing speed: > 1 MB/s');
}

// Run performance tests
async function runAllTests() {
    try {
        await testGPUPerformance();
        showPerformanceRecommendations();
        
        console.log('\n🎉 GPU performance tests completed!');
        
    } catch (error) {
        console.error('❌ GPU performance tests failed:', error);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testGPUPerformance };
} else {
    // Browser environment - run tests
    runAllTests().catch(console.error);
} 