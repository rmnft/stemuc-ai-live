// Setup Production Environment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = 'https://stemuc-ai-live-production.up.railway.app';

console.log('🔧 Setting up production environment...');

const envContent = `# ===========================================
# STEMUC AUDIO FORGE - PRODUCTION VARIABLES
# ===========================================

# Backend URL - Railway Production
VITE_API_URL=${BACKEND_URL}
VITE_BACKEND_URL=${BACKEND_URL}
VITE_RAILWAY_URL=${BACKEND_URL}

# Environment
NODE_ENV=production
`;

const envPath = path.join(__dirname, '..', '.env.production');

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.production created successfully!');
    console.log(`🎯 Backend URL: ${BACKEND_URL}`);
    
    // Also create .env.local for development testing
    const envLocalContent = `# Development with production backend
VITE_API_URL=${BACKEND_URL}
VITE_BACKEND_URL=${BACKEND_URL}
`;
    
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    fs.writeFileSync(envLocalPath, envLocalContent);
    console.log('✅ .env.local created for development testing!');
    
} catch (error) {
    console.error('❌ Error creating environment files:', error);
} 