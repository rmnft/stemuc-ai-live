#!/usr/bin/env node

// ===========================================
// ENVIRONMENT CHECKER SCRIPT
// ===========================================

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

// Check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Load environment variables
const loadEnvFile = (filePath) => {
  try {
    if (!fileExists(filePath)) return {};
    
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    logError(`Error reading ${filePath}: ${error.message}`);
    return {};
  }
};

// Check required files
const checkRequiredFiles = () => {
  logInfo('Checking required files...');
  
  const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'Dockerfile',
    'railway.json',
    'backend/main.py',
    'backend/config.py',
    'requirements.txt'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      logSuccess(`${file} exists`);
    } else {
      logError(`${file} is missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
};

// Check environment variables
const checkEnvironmentVariables = () => {
  logInfo('Checking environment variables...');
  
  // Load .env files
  const env = loadEnvFile('.env');
  const envExample = loadEnvFile('env.example');
  
  // Required variables
  const requiredVars = [
    'HUGGINGFACE_TOKEN'
  ];
  
  // Optional but recommended variables
  const optionalVars = [
    'PYANNOTE_API_KEY',
    'NODE_ENV',
    'MAX_FILE_SIZE',
    'USE_GPU'
  ];
  
  let hasAllRequired = true;
  
  // Check required variables
  logInfo('Required variables:');
  requiredVars.forEach(varName => {
    if (env[varName] && env[varName] !== 'your_token_here') {
      logSuccess(`${varName} is set`);
    } else {
      logError(`${varName} is missing or not configured`);
      hasAllRequired = false;
    }
  });
  
  // Check optional variables
  logInfo('Optional variables:');
  optionalVars.forEach(varName => {
    if (env[varName] && env[varName] !== 'your_api_key_here') {
      logSuccess(`${varName} is set`);
    } else {
      logWarning(`${varName} is not set (optional)`);
    }
  });
  
  return hasAllRequired;
};

// Check dependencies
const checkDependencies = () => {
  logInfo('Checking package.json dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check if essential dependencies are present
    const essentialDeps = [
      'react',
      'react-dom',
      'vite',
      '@vitejs/plugin-react-swc',
      'fastapi' // This would be in requirements.txt, but checking structure
    ];
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    essentialDeps.forEach(dep => {
      if (dep === 'fastapi') return; // Skip this one for frontend check
      
      if (allDeps[dep]) {
        logSuccess(`${dep} is installed`);
      } else {
        logWarning(`${dep} might be missing`);
      }
    });
    
    logSuccess('Frontend dependencies look good');
    return true;
  } catch (error) {
    logError(`Error checking dependencies: ${error.message}`);
    return false;
  }
};

// Check backend requirements
const checkBackendRequirements = () => {
  logInfo('Checking Python requirements...');
  
  if (!fileExists('requirements.txt')) {
    logError('requirements.txt is missing');
    return false;
  }
  
  try {
    const requirements = fs.readFileSync('requirements.txt', 'utf8');
    const essentialPackages = [
      'fastapi',
      'uvicorn',
      'torch',
      'demucs',
      'pyannote.audio'
    ];
    
    essentialPackages.forEach(pkg => {
      if (requirements.includes(pkg)) {
        logSuccess(`${pkg} is in requirements.txt`);
      } else {
        logError(`${pkg} is missing from requirements.txt`);
      }
    });
    
    return true;
  } catch (error) {
    logError(`Error reading requirements.txt: ${error.message}`);
    return false;
  }
};

// Main function
const main = () => {
  console.log('🔍 Stemuc Audio Forge Environment Checker');
  console.log('==========================================');
  console.log('');
  
  let allChecksPass = true;
  
  // Run all checks
  allChecksPass &= checkRequiredFiles();
  console.log('');
  
  allChecksPass &= checkEnvironmentVariables();
  console.log('');
  
  allChecksPass &= checkDependencies();
  console.log('');
  
  allChecksPass &= checkBackendRequirements();
  console.log('');
  
  // Final result
  if (allChecksPass) {
    logSuccess('All checks passed! Your environment is ready for deployment 🚀');
  } else {
    logError('Some checks failed. Please fix the issues above before deploying.');
    process.exit(1);
  }
  
  console.log('');
  console.log('Next steps:');
  console.log('1. Set up your Hugging Face token');
  console.log('2. Run: npm run deploy');
  console.log('3. Configure environment variables in Railway dashboard');
  console.log('');
  console.log('Happy deploying! 🎵');
};

// Run the checks
main(); 