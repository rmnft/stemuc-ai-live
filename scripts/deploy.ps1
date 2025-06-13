# STEMUC AUDIO FORGE - DEPLOY SCRIPT (PowerShell)

Write-Host "Iniciando deploy do Stemuc Audio Forge..." -ForegroundColor Green

# Verificar se esta no diretorio correto
if (!(Test-Path "package.json")) {
    Write-Host "Erro: Execute este script na raiz do projeto" -ForegroundColor Red
    return
}

Write-Host "Verificando configuracoes..." -ForegroundColor Blue

# Verificar se existe .env
if (!(Test-Path ".env")) {
    Write-Host "Arquivo .env nao encontrado!" -ForegroundColor Red
    Write-Host "Crie um arquivo .env baseado no env.example" -ForegroundColor Yellow
    return
}

# Verificar HUGGINGFACE_TOKEN
$envContent = Get-Content ".env" -Raw
if (!($envContent -match "HUGGINGFACE_TOKEN=")) {
    Write-Host "HUGGINGFACE_TOKEN nao configurado no .env" -ForegroundColor Red
    return
}

Write-Host "Configuracoes verificadas" -ForegroundColor Green

# Instalar dependencias
Write-Host "Instalando dependencias do frontend..." -ForegroundColor Blue
npm install

# Build do frontend
Write-Host "Fazendo build do frontend..." -ForegroundColor Blue
npm run build

# Verificar se build foi bem-sucedido
if (!(Test-Path "dist")) {
    Write-Host "Erro no build do frontend" -ForegroundColor Red
    return
}

Write-Host "Frontend pronto para deploy" -ForegroundColor Green

# Verificar backend
Write-Host "Verificando dependencias do backend..." -ForegroundColor Blue
if (!(Test-Path "requirements.txt")) {
    Write-Host "requirements.txt nao encontrado" -ForegroundColor Red
    return
}

Write-Host "Backend pronto para deploy" -ForegroundColor Green

# Git status
Write-Host "Status do Git:" -ForegroundColor Blue
git status --porcelain

Write-Host ""
Write-Host "Projeto pronto para deploy!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Blue
Write-Host "1. Push para GitHub: git push origin main"
Write-Host "2. Deploy no Vercel: https://vercel.com/new"
Write-Host "3. Deploy no Railway: https://railway.app/new"
Write-Host "4. Configurar variaveis de ambiente nos servicos"
Write-Host ""
Write-Host "Consulte o DEPLOY_GUIDE_COMPLETE.md para instrucoes detalhadas" -ForegroundColor Cyan 