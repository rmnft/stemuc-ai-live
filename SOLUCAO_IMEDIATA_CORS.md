# 🚨 Solução Imediata - CORS e Deploy Railway

## 🎯 Problema Identificado

O Railway **NÃO** está fazendo redeploy automático. Precisamos forçar manualmente.

## 🔧 Solução Imediata (5 minutos)

### Passo 1: Acesse o Railway Dashboard
1. Vá para [Railway Dashboard](https://railway.app/dashboard)
2. Clique no seu projeto "stemuc-ai-live"
3. Vá para a aba **"Deployments"**

### Passo 2: Verificar Branch Configurada
1. Clique em **"Settings"** (engrenagem)
2. Vá para **"Source"**
3. Verifique se está monitorando a branch **"main"**
4. Se não estiver, mude para **"main"**

### Passo 3: Forçar Redeploy
**Opção A - Redeploy Manual:**
1. Na aba "Deployments"
2. Clique nos 3 pontinhos (...) do último deploy
3. Clique em **"Redeploy"**

**Opção B - Trigger via Commit:**
1. Faça uma mudança mínima no código
2. Commit e push para main

### Passo 4: Monitorar Deploy
1. Aguarde o build completar (2-3 minutos)
2. Verifique os logs em tempo real
3. Aguarde status "Success"

## 🧪 Teste Rápido (Console do Navegador)

Após o deploy, teste no console:

```javascript
// 1. Teste básico
fetch('https://stemuc-ai-live-production.up.railway.app/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Health:', data.status);
    console.log('🔢 Version:', data.version); // Deve ser 1.0.1
  });

// 2. Teste CORS
fetch('https://stemuc-ai-live-production.up.railway.app/health', {
  headers: {'Origin': 'https://stemuc-ai-live.vercel.app'}
})
.then(r => {
  console.log('🌐 CORS:', r.headers.get('access-control-allow-origin'));
  return r.json();
})
.then(console.log);

// 3. Teste /separate
fetch('https://stemuc-ai-live-production.up.railway.app/separate', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://stemuc-ai-live.vercel.app',
    'Access-Control-Request-Method': 'POST'
  }
})
.then(r => console.log('🎯 /separate Status:', r.status));
```

## ✅ Sinais de Sucesso

Quando funcionar, você verá:
- ✅ Version: "1.0.1" (não mais "1.0.0")
- ✅ CORS: "https://stemuc-ai-live.vercel.app" ou "*"
- ✅ /separate Status: 200 ou 405 (não mais 404)

## 🚀 Próximo Passo - Deploy Vercel

Quando o Railway estiver funcionando:

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Configurar variável de ambiente
vercel env add VITE_API_URL production
# Valor: https://stemuc-ai-live-production.up.railway.app
```

## 🔄 Se Ainda Não Funcionar

### Opção 1: Verificar Logs Railway
1. Railway Dashboard > Deployments
2. Clique no último deploy
3. Vá para "Logs"
4. Procure por erros

### Opção 2: Verificar Dockerfile
Se o Railway não conseguir fazer build:
1. Verifique se `backend/Dockerfile` existe
2. Verifique se `railway.json` aponta para o Dockerfile correto

### Opção 3: Configuração Manual CORS
Se precisar de uma solução temporária, adicione no `backend/main.py`:

```python
# CORS temporário - APENAS PARA TESTE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TEMPORÁRIO!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📞 Comandos de Debug

```bash
# Testar endpoints localmente
npm run test:endpoints

# Testar endpoint específico
node scripts/test-specific-endpoint.js

# Monitorar deploy
node scripts/monitor-deploy.js
```

---

## 🎯 Resumo da Ação

1. **Acesse Railway Dashboard**
2. **Force Redeploy manualmente**
3. **Aguarde 2-3 minutos**
4. **Teste no console do navegador**
5. **Se funcionar → Deploy no Vercel**

**⏰ Tempo estimado: 5-10 minutos** 