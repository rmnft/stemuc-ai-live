#!/bin/bash

# =========================================
# TESTE DOCKER LOCAL - STEMUC AUDIO FORGE
# =========================================

echo "🐳 Testando configuração Docker localmente..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado"
    exit 1
fi

echo "✅ Docker encontrado"

# Verificar se está no diretório correto
if [ ! -f "backend/Dockerfile" ]; then
    echo "❌ Execute este script na raiz do projeto"
    exit 1
fi

echo "✅ Dockerfile encontrado"

# Build da imagem
echo "🔨 Fazendo build da imagem Docker..."
docker build -t stemuc-audio-forge ./backend

if [ $? -ne 0 ]; then
    echo "❌ Erro no build da imagem"
    exit 1
fi

echo "✅ Imagem criada com sucesso"

# Testar se a imagem funciona
echo "🧪 Testando a imagem..."
docker run --rm -p 8080:8080 -e HUGGINGFACE_TOKEN=test stemuc-audio-forge &

# Aguardar alguns segundos
sleep 10

# Testar endpoint de health
echo "🔍 Testando endpoint de health..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)

if [ "$response" = "200" ]; then
    echo "✅ Endpoint de health funcionando"
else
    echo "❌ Endpoint de health não respondeu (código: $response)"
fi

# Parar container
docker stop $(docker ps -q --filter ancestor=stemuc-audio-forge)

echo "🎉 Teste concluído!"
echo ""
echo "Para usar em produção:"
echo "1. Configure as variáveis de ambiente no Railway"
echo "2. Faça push para GitHub"
echo "3. Deploy no Railway usando Dockerfile" 