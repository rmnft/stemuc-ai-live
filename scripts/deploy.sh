#!/bin/bash

# =========================================
# STEMUC AUDIO FORGE - DEPLOY SCRIPT
# =========================================

set -e

echo "🚀 Iniciando deploy do Stemuc Audio Forge..."

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Verificar se as variáveis de ambiente estão configuradas
echo "🔍 Verificando configurações..."

# Verificar se existe .env com os tokens necessários
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Crie um arquivo .env baseado no env.example"
    exit 1
fi

# Verificar se HUGGINGFACE_TOKEN está configurado
if ! grep -q "HUGGINGFACE_TOKEN=" .env; then
    echo "❌ HUGGINGFACE_TOKEN não configurado no .env"
    exit 1
fi

echo "✅ Configurações verificadas"

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
npm install

# Build do frontend
echo "🔨 Fazendo build do frontend..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Erro no build do frontend"
    exit 1
fi

echo "✅ Frontend pronto para deploy"

# Verificar dependências do backend
echo "🐍 Verificando dependências do backend..."
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt não encontrado"
    exit 1
fi

echo "✅ Backend pronto para deploy"

# Git status
echo "📋 Status do Git:"
git status --porcelain

# Adicionar arquivos se necessário
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Arquivos modificados detectados"
    read -p "Deseja adicionar as mudanças ao Git? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Mensagem do commit: " commit_message
        git commit -m "$commit_message"
        echo "✅ Commit realizado"
    fi
fi

echo "🎉 Projeto pronto para deploy!"
echo ""
echo "📋 Próximos passos:"
echo "1. Push para GitHub: git push origin main"
echo "2. Deploy no Vercel: https://vercel.com/new"
echo "3. Deploy no Railway: https://railway.app/new"
echo "4. Configurar variáveis de ambiente nos serviços"
echo ""
echo "📖 Consulte o DEPLOY_GUIDE.md para instruções detalhadas" 