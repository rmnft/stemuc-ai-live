# 🚀 **GUIA COMPLETO DE DEPLOY - VERCEL + RAILWAY**

## 📋 **PRÉ-REQUISITOS**

### 1. **Contas Necessárias**
- ✅ [Conta GitHub](https://github.com) (para código)
- ✅ [Conta Vercel](https://vercel.com) (para frontend)
- ✅ [Conta Railway](https://railway.app) (para backend)
- ✅ [Conta Hugging Face](https://huggingface.co) (para modelos IA)

### 2. **Ferramentas Locais**
```bash
# Node.js 16+
node --version

# npm ou yarn
npm --version

# Git
git --version
```

---

## 🔑 **PASSO 1: CONFIGURAR TOKENS**

### **A) Token Hugging Face (OBRIGATÓRIO)**

1. **Aceitar termos dos modelos:**
   - Acesse: https://huggingface.co/pyannote/segmentation-3.0
   - Clique em **"Accept"**
   - Acesse: https://huggingface.co/pyannote/speaker-diarization-3.1
   - Clique em **"Accept"**

2. **Criar token:**
   - Acesse: https://huggingface.co/settings/tokens
   - Clique em **"New token"**
   - Tipo: **"Read"**
   - Nome: `stemuc-diarization`
   - Copie o token gerado

### **B) API pyannoteAI (OPCIONAL - Mais Rápido)**

1. Acesse: https://dashboard.pyannote.ai
2. Crie conta e gere API key
3. Guarde a API key

---

## ⚙️ **PASSO 2: PREPARAR PROJETO**

### **1. Clonar e Instalar**
```bash
# Se ainda não tem o projeto localmente
git clone https://github.com/seu-usuario/stemuc-ai-meres.git
cd stemuc-ai-meres

# Instalar dependências
npm install
```

### **2. Configurar Variáveis de Ambiente**
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar .env com seus tokens
nano .env
```

**Exemplo do .env:**
```env
# OBRIGATÓRIO
HUGGINGFACE_TOKEN=hf_seu_token_aqui

# OPCIONAL (mas recomendado)
PYANNOTE_API_KEY=sua_api_key_aqui

# PRODUÇÃO
NODE_ENV=production
MAX_FILE_SIZE=209715200
USE_GPU=false
LOG_LEVEL=INFO
```

### **3. Verificar Configuração**
```bash
# Rodar verificador automático
npm run check:env
```

---

## 🌐 **PASSO 3: DEPLOY DO FRONTEND (VERCEL)**

### **Opção A: Deploy Automático via GitHub**

1. **Push para GitHub:**
   ```bash
   git add .
   git commit -m "feat: prepare for production deploy"
   git push origin main
   ```

2. **Conectar no Vercel:**
   - Acesse: https://vercel.com/new
   - Conecte sua conta GitHub
   - Selecione o repositório `stemuc-ai-meres`
   - Clique **"Deploy"**

3. **Configurar Variáveis (no Vercel Dashboard):**
   - Vá em **Settings > Environment Variables**
   - Adicione:
     ```
     VITE_BACKEND_URL = https://seu-backend.railway.app
     ```

### **Opção B: Deploy Manual via CLI**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
npm run deploy:frontend
```

**✅ Resultado:** Seu frontend estará em `https://seu-app.vercel.app`

---

## 🚂 **PASSO 4: DEPLOY DO BACKEND (RAILWAY)**

### **1. Instalar Railway CLI**
```bash
npm install -g @railway/cli
```

### **2. Fazer Login**
```bash
railway login
```

### **3. Inicializar Projeto**
```bash
# Na raiz do projeto
railway init
```

### **4. Configurar Variáveis no Railway**
```bash
# Via CLI
railway variables set HUGGINGFACE_TOKEN=hf_seu_token_aqui
railway variables set NODE_ENV=production
railway variables set MAX_FILE_SIZE=209715200
railway variables set USE_GPU=false

# OPCIONAL
railway variables set PYANNOTE_API_KEY=sua_api_key_aqui
```

### **5. Deploy**
```bash
npm run deploy:backend
```

**✅ Resultado:** Seu backend estará em `https://seu-backend.railway.app`

---

## 🔗 **PASSO 5: CONECTAR FRONTEND E BACKEND**

### **1. Obter URL do Railway**
```bash
# Ver URL do backend
railway status
```

### **2. Atualizar Frontend**
- No Vercel Dashboard:
  - **Settings > Environment Variables**
  - Adicionar/Atualizar:
    ```
    VITE_BACKEND_URL = https://seu-backend.railway.app
    ```

### **3. Redeploy Frontend**
```bash
# Triggar novo deploy no Vercel
vercel --prod
```

---

## ✅ **PASSO 6: VERIFICAR DEPLOY**

### **1. Testar Backend**
```bash
curl https://seu-backend.railway.app/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "diarization_available": true,
  "huggingface_token_configured": true,
  "device": "cpu"
}
```

### **2. Testar Frontend**
- Acesse: `https://seu-app.vercel.app`
- Faça upload de um arquivo de áudio
- Teste a separação de stems

---

## 🛠️ **COMANDOS ÚTEIS**

```bash
# Deploy completo automatizado
npm run deploy

# Verificar ambiente antes do deploy
npm run check:env

# Deploy apenas frontend
npm run deploy:frontend

# Deploy apenas backend
npm run deploy:backend

# Verificar status do backend local
npm run check:backend

# Ver logs do Railway
railway logs

# Ver status do Railway
railway status
```

---

## 🔧 **CONFIGURAÇÕES AVANÇADAS**

### **A) Configurar Domínio Personalizado**

**Vercel:**
1. **Settings > Domains**
2. Adicionar seu domínio
3. Configurar DNS

**Railway:**
1. **Settings > Domains**
2. Adicionar domínio customizado

### **B) Configurar CORS para Domínio Personalizado**
No Railway, adicionar variável:
```bash
railway variables set FRONTEND_URL=https://seu-dominio.com
```

### **C) Monitoramento**
```bash
# Ver logs em tempo real
railway logs --follow

# Ver métricas
railway status
```

---

## 🚨 **TROUBLESHOOTING**

### **Problema: Backend não responde**
```bash
# Verificar logs
railway logs

# Verificar variáveis
railway variables

# Redeploy
railway up --detach
```

### **Problema: CORS Error**
1. Verificar `FRONTEND_URL` no Railway
2. Verificar `VITE_BACKEND_URL` no Vercel
3. Redeploy ambos os serviços

### **Problema: Modelos não carregam**
1. Verificar `HUGGINGFACE_TOKEN`
2. Confirmar que aceitou termos dos modelos
3. Ver logs: `railway logs`

### **Problema: Upload falha**
1. Verificar `MAX_FILE_SIZE`
2. Arquivo menor que 200MB?
3. Formato suportado (MP3, WAV)?

---

## 📊 **CUSTOS ESTIMADOS**

| Serviço | Plano | Custo/Mês |
|---------|-------|-----------|
| **Vercel** | Free | $0 |
| **Railway** | Hobby | $5-20 |
| **Total** | | **$5-20** |

---

## 🎉 **DEPLOY FINALIZADO!**

### **URLs Importantes:**
- 🌐 **Frontend:** `https://seu-app.vercel.app`
- 🔧 **Backend:** `https://seu-backend.railway.app`
- 📊 **Health Check:** `https://seu-backend.railway.app/health`

### **Próximos Passos:**
1. ✅ Compartilhar com usuários
2. ✅ Monitorar logs e performance
3. ✅ Configurar alertas (opcional)
4. ✅ Implementar analytics (opcional)

---

## 📞 **SUPORTE**

**Problemas com o deploy?**
1. Verificar este guia novamente
2. Rodar `npm run check:env`
3. Verificar logs: `railway logs`
4. Consultar documentação oficial

**Happy audio processing! 🎵✨** 