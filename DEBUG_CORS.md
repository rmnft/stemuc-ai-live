# 🔧 Debug CORS e Endpoints - Guia Completo

## 🌐 Teste no Navegador (Console)

Abra o console do navegador (F12) e execute os seguintes comandos:

### 1. Teste Health Check
```javascript
fetch('https://stemuc-ai-live-production.up.railway.app/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Health:', data);
    console.log('📊 Status:', data.status);
    console.log('🤖 Models:', data.models_loaded);
    console.log('🎤 Diarization:', data.diarization_available);
  })
  .catch(err => console.error('❌ Health failed:', err));
```

### 2. Teste Root Endpoint
```javascript
fetch('https://stemuc-ai-live-production.up.railway.app/')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Root:', data);
    console.log('📋 Endpoints:', data.endpoints);
  })
  .catch(err => console.error('❌ Root failed:', err));
```

### 3. Teste CORS com Origin
```javascript
fetch('https://stemuc-ai-live-production.up.railway.app/health', {
  method: 'GET',
  headers: {
    'Origin': 'https://stemuc-ai-live.vercel.app',
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ CORS Response Status:', response.status);
  console.log('🌐 CORS Headers:', [...response.headers.entries()]);
  return response.json();
})
.then(data => console.log('✅ CORS Data:', data))
.catch(err => console.error('❌ CORS failed:', err));
```

### 4. Teste Upload Simulado (FormData)
```javascript
// Criar FormData simulado
const formData = new FormData();
formData.append('mode', '4-stem');
formData.append('enable_diarization', 'false');

// Teste OPTIONS (preflight)
fetch('https://stemuc-ai-live-production.up.railway.app/separate', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://stemuc-ai-live.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
})
.then(response => {
  console.log('✅ OPTIONS Status:', response.status);
  console.log('🌐 CORS Headers:', [...response.headers.entries()]);
})
.catch(err => console.error('❌ OPTIONS failed:', err));
```

## 🔍 Verificar Status do Railway

### 1. Verificar se Deploy foi Aplicado
```javascript
fetch('https://stemuc-ai-live-production.up.railway.app/health')
  .then(r => r.json())
  .then(data => {
    console.log('🕐 Timestamp:', data.timestamp);
    console.log('📊 Full Status:', data.full_system_status);
  });
```

### 2. Verificar Logs do Railway
1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Vá para seu projeto
3. Clique em **Deployments**
4. Verifique se o último deploy foi bem-sucedido
5. Clique em **View Logs** para ver os logs

## 🚨 Possíveis Problemas e Soluções

### Problema 1: CORS ainda não atualizado
**Sintoma:** CORS test failed
**Solução:**
```bash
# Verificar se Railway fez redeploy
# Aguardar 2-3 minutos após push
# Forçar redeploy se necessário
```

### Problema 2: Wildcard CORS não funciona
**Sintoma:** `https://*.vercel.app` não aceito
**Solução:** Adicionar domínio específico no backend:
```python
ALLOWED_ORIGINS = [
    "https://stemuc-ai-live.vercel.app",  # Específico
    "https://your-app-name.vercel.app",   # Seu app específico
    # ... outros
]
```

### Problema 3: Headers CORS ausentes
**Sintoma:** Headers não aparecem no response
**Solução:** Verificar se `expose_headers=["*"]` está funcionando

## 🔧 Comandos de Debug

### Testar CORS via cURL
```bash
# Teste básico
curl -H "Origin: https://stemuc-ai-live.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://stemuc-ai-live-production.up.railway.app/separate

# Teste GET
curl -H "Origin: https://stemuc-ai-live.vercel.app" \
     https://stemuc-ai-live-production.up.railway.app/health
```

### Verificar Headers de Resposta
```javascript
fetch('https://stemuc-ai-live-production.up.railway.app/health')
  .then(response => {
    console.log('📋 Response Headers:');
    for (let [key, value] of response.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    return response.json();
  })
  .then(console.log);
```

## ✅ Checklist de Verificação

- [ ] Railway fez redeploy após push
- [ ] Backend responde em `/health`
- [ ] CORS headers presentes na resposta
- [ ] Domínio Vercel incluído em ALLOWED_ORIGINS
- [ ] `expose_headers=["*"]` configurado
- [ ] Teste no console do navegador funciona
- [ ] Teste de upload simulado funciona

## 🎯 Próximos Passos

1. **Se CORS funcionar:** Prosseguir com deploy no Vercel
2. **Se CORS falhar:** Ajustar configuração no backend
3. **Testar upload real:** Usar arquivo de áudio pequeno
4. **Verificar logs:** Monitorar Railway logs durante testes

---

**💡 Dica:** Execute os testes no console do navegador a partir da página do Vercel para simular o ambiente real de produção. 