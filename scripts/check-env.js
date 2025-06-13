#!/usr/bin/env node

// ==========================================
// STEMUC AUDIO FORGE - ENVIRONMENT CHECKER
// ==========================================

import fs from 'fs';
import path from 'path';

console.log('🔍 Verificando configurações de ambiente...\n');

// Cores para output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, required = true) {
    const exists = fs.existsSync(filePath);
    if (exists) {
        log(`✅ ${filePath} encontrado`, 'green');
        return true;
    } else {
        log(`${required ? '❌' : '⚠️'} ${filePath} ${required ? 'não encontrado' : 'opcional - não encontrado'}`, required ? 'red' : 'yellow');
        return false;
    }
}

function checkEnvVar(envContent, varName, required = true) {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (match && match[1] && match[1].trim() !== '') {
        log(`✅ ${varName} configurado`, 'green');
        return true;
    } else {
        log(`${required ? '❌' : '⚠️'} ${varName} ${required ? 'não configurado' : 'opcional - não configurado'}`, required ? 'red' : 'yellow');
        return false;
    }
}

function main() {
    let hasErrors = false;
    let hasWarnings = false;

    // Verificar arquivos essenciais
    log('📋 Verificando arquivos essenciais:', 'blue');
    
    const essentialFiles = [
        'package.json',
        'requirements.txt',
        'backend/main.py',
        'backend/config.py',
        'src/config/environment.ts',
        'railway.json',
        'vercel.json'
    ];

    essentialFiles.forEach(file => {
        if (!checkFileExists(file)) {
            hasErrors = true;
        }
    });

    // Verificar arquivos opcionais
    log('\n📋 Verificando arquivos opcionais:', 'blue');
    
    const optionalFiles = [
        'Dockerfile',
        'Procfile',
        'backend/startup.py',
        'backend/security.py',
        'scripts/deploy.sh'
    ];

    optionalFiles.forEach(file => {
        if (!checkFileExists(file, false)) {
            hasWarnings = true;
        }
    });

    // Verificar arquivo .env
    log('\n🔧 Verificando variáveis de ambiente:', 'blue');
    
    if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        
        // Variáveis obrigatórias
        const requiredVars = ['HUGGINGFACE_TOKEN'];
        
        requiredVars.forEach(varName => {
            if (!checkEnvVar(envContent, varName)) {
                hasErrors = true;
            }
        });

        // Variáveis opcionais
        const optionalVars = ['PYANNOTE_API_KEY', 'NODE_ENV', 'VITE_BACKEND_URL'];
        
        optionalVars.forEach(varName => {
            if (!checkEnvVar(envContent, varName, false)) {
                hasWarnings = true;
            }
        });
    } else {
        log('❌ Arquivo .env não encontrado', 'red');
        log('📝 Crie um arquivo .env baseado no env.example', 'yellow');
        hasErrors = true;
    }

    // Verificar diretórios necessários
    log('\n📁 Verificando diretórios:', 'blue');
    
    const directories = [
        'backend',
        'src',
        'scripts'
    ];

    directories.forEach(dir => {
        if (!checkFileExists(dir)) {
            hasErrors = true;
        }
    });

    // Verificar se está no diretório correto
    if (!fs.existsSync('package.json')) {
        log('❌ Execute este script na raiz do projeto', 'red');
        hasErrors = true;
    }

    // Resumo final
    log('\n📊 Resumo da verificação:', 'blue');
    
    if (hasErrors) {
        log('❌ Foram encontrados erros críticos que precisam ser corrigidos', 'red');
        log('💡 Consulte o DEPLOY_GUIDE.md para instruções detalhadas', 'yellow');
    } else if (hasWarnings) {
        log('⚠️ Configuração básica OK, mas há itens opcionais em falta', 'yellow');
        log('✅ Projeto pronto para deploy básico', 'green');
    } else {
        log('🎉 Todas as configurações estão corretas!', 'green');
        log('✅ Projeto totalmente pronto para deploy', 'green');
    }

    // Próximos passos
    log('\n🚀 Próximos passos:', 'blue');
    log('1. npm run build - Fazer build do frontend');
    log('2. npm run deploy - Executar script de deploy');
    log('3. Configurar URLs nos serviços de deploy');
    
    process.exit(hasErrors ? 1 : 0);
}

main(); 