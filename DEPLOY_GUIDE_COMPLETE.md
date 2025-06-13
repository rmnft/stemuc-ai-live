# 🚀 Guia Completo de Deploy - Stemuc Audio Forge

## ✅ Status das Configurações

### Arquivos Criados/Atualizados:
- ✅ `requirements.txt` - Dependências completas incluindo Demucs críticas
- ✅ `railway.json` - Configuração Railway com startup script
- ✅ `Procfile` - Comando de inicialização Railway
- ✅ `vercel.json` - Configuração Vercel para frontend
- ✅ `backend/startup.py` - Script de inicialização com download de modelos
- ✅ `backend/security.py` - Rate limiting e validação de arquivos
- ✅ `backend/cache.py` - Cache inteligente de modelos
- ✅ `backend/main.py` - Atualizado com segurança e monitoramento
- ✅ `scripts/deploy.sh` - Script automatizado de deploy
- ✅ `scripts/check-env.js` - Verificador de configurações
- ✅ `railway.env.example` - Variáveis de ambiente Railway
- ✅ `env.production.example` - Variáveis frontend produção

## 📋 Pré-requisitos

### 1. Contas Necessárias
- [x] GitHub - Para hospedar o código
- [x] Vercel - Para o frontend (gratuito)
- [x] Railway - Para o backend ($5 créditos grátis)
- [x] Hugging Face - Para API tokens
- [ ] pyannoteAI - Para diarização premium (opcional)

### 2. Tokens e APIs
```env
# Obrigatórios
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxx  # https://huggingface.co/settings/tokens

# Opcionais
PYANNOTE_API_KEY=pya_xxxxxxxxxxxxx  # https://pyannote.ai
```

## 🎨 PARTE 1: Deploy do Frontend no Vercel

### Passo 1: Verificar Configurações
```bash
# Verificar se tudo está configurado
npm run check:env

# Fazer build de teste
npm run build
```

### Passo 2: Deploy no Vercel
1. **Push para GitHub:**
```bash
git add .
git commit -m "Preparar para deploy"
git push origin main
```

2. **No Vercel Dashboard:**
   - Clique em "New Project"
   - Importe o repositório do GitHub
   - Configure:
     - Framework Preset: **Vite**
     - Root Directory: **.**
     - Build Command: **npm run build**
     - Output Directory: **dist**
     - Install Command: **npm install**

3. **Variáveis de Ambiente (deixe vazio por enquanto):**
   - `VITE_BACKEND_URL`: (será preenchido após Railway)

4. **Deploy:** Clique em "Deploy"

## 🔧 PARTE 2: Deploy do Backend no Railway

### Passo 1: Preparar Projeto
```bash
# Executar script de deploy
npm run deploy
```

### Passo 2: Configurar Railway
1. **Criar novo projeto:**
   - Vá para https://railway.app
   - Clique em "New Project"
   - Escolha "Deploy from GitHub repo"

2. **Configurar variáveis de ambiente:**
```env
# OBRIGATÓRIAS
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=8080
NODE_ENV=production

# CONFIGURAÇÕES DE ARQUIVO
MAX_FILE_SIZE_MB=150
UPLOAD_DIR=/tmp/uploads
MODELS_DIR=/tmp/models
STEMS_DIR=/tmp/stems
OUTPUT_DIR=/tmp/outputs

# OPCIONAIS
PYANNOTE_API_KEY=pya_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://your-app.vercel.app

# CONFIGURAÇÕES DE PERFORMANCE
USE_GPU=false
TORCH_HOME=/tmp/models
DEMUCS_MODEL_PATH=/tmp/models/demucs
HF_HOME=/tmp/huggingface
LOG_LEVEL=INFO
```

3. **Configurar recursos:**
   - Railway → Settings → Resources
   - **Recomendado:** 2GB RAM mínimo
   - **CPU:** 2 vCPUs

### Passo 3: Deploy
1. Railway fará deploy automaticamente
2. Aguardar download dos modelos (pode levar 5-10 minutos)
3. Verificar logs: Railway → Deployments → View Logs

## 🔗 PARTE 3: Conectar Frontend e Backend

### 1. Obter URL do Railway
Após deploy: `https://seu-projeto.up.railway.app`

### 2. Atualizar Vercel
1. Vercel Dashboard → Settings → Environment Variables
2. `VITE_BACKEND_URL`: `https://seu-projeto.up.railway.app`
3. Redeploy o frontend

### 3. Testar Conexão
```bash
# Testar backend
curl https://seu-projeto.up.railway.app/health

# Testar frontend
curl https://seu-app.vercel.app
```

## 🔒 PARTE 4: Configurações de Segurança

### Rate Limiting Configurado:
- ✅ 5 uploads por minuto por IP
- ✅ Validação de tipos de arquivo
- ✅ Limite de tamanho (150MB)
- ✅ Headers de segurança

### CORS Configurado:
- ✅ Vercel domains
- ✅ Railway domains
- ✅ Localhost para desenvolvimento

## 📊 PARTE 5: Monitoramento

### Endpoints de Saúde:
- `/health` - Status básico do sistema
- `/status` - Status detalhado com cache e hardware

### Railway Logs:
```bash
# Filtrar logs importantes
Railway Dashboard → Deployments → View Logs
Filtrar por: ERROR, WARNING, INFO
```

### Métricas Importantes:
- ✅ Modelos carregados
- ✅ Uso de memória GPU/CPU
- ✅ Espaço em disco
- ✅ Cache de modelos
- ✅ Rate limiting

## 🚨 PARTE 6: Troubleshooting

### Problema 1: "Out of Memory"
**Solução:**
- Aumentar recursos no Railway (plano pago)
- Cache inteligente já implementado
- Limpeza automática de arquivos temporários

### Problema 2: "Model not found"
**Solução:**
- Verificar HUGGINGFACE_TOKEN
- Aguardar download inicial (5-10 min)
- Verificar logs do startup.py

### Problema 3: CORS Errors
**Solução:**
- Verificar VITE_BACKEND_URL no Vercel
- Confirmar URLs exatas (com/sem trailing slash)
- Verificar FRONTEND_URL no Railway

### Problema 4: Rate Limiting
**Solução:**
- Aguardar 1 minuto entre uploads
- Implementado: 5 uploads/minuto por IP

## 🎯 PARTE 7: Otimizações Implementadas

### Cache de Modelos:
- ✅ LRU cache para modelos Demucs
- ✅ Máximo 2 modelos em memória
- ✅ Limpeza automática de GPU

### Limpeza Automática:
- ✅ Arquivos temporários removidos após 2h
- ✅ Thread de limpeza em background
- ✅ Monitoramento de uso de memória

### Segurança:
- ✅ Rate limiting por IP
- ✅ Validação de arquivos
- ✅ Headers de segurança
- ✅ Trusted hosts

## ✅ Checklist Final de Deploy

- [ ] Frontend acessível em: `https://seu-app.vercel.app`
- [ ] Backend respondendo em: `https://seu-backend.railway.app/health`
- [ ] Upload de arquivo funcionando
- [ ] Processamento de áudio testado
- [ ] Variáveis de ambiente configuradas
- [ ] CORS funcionando corretamente
- [ ] Logs monitorados
- [ ] Rate limiting testado
- [ ] HTTPS em ambos os serviços
- [ ] Tokens de API válidos

## 🚀 Comandos Úteis

```bash
# Verificar configurações
npm run check:env

# Build local
npm run build

# Deploy completo
npm run deploy

# Verificar backend local
npm run check:backend

# Logs Railway (se CLI instalado)
railway logs

# Logs Vercel (se CLI instalado)
vercel logs
```

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs no Railway/Vercel
2. Testar endpoints `/health` e `/status`
3. Verificar variáveis de ambiente
4. Consultar este guia

**Status:** ✅ **CONFIGURAÇÃO COMPLETA - PRONTO PARA DEPLOY!** 