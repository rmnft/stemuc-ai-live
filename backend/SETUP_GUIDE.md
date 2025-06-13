# Guia Completo de Configuração - Stemuc Audio Forge

## Status Atual ✅

O sistema foi atualizado com sucesso para suportar:
- **pyannoteAI API** (serviço premium em nuvem) 
- **pyannote.audio local** (fallback gratuito)
- **Sistema híbrido** (tenta API primeiro, fallback para local)

## Verificação do Sistema

### ✅ Servidor Backend
```bash
curl http://localhost:8080/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "diarization_available": true,
  "pyannote_api_configured": false,
  "huggingface_token_configured": true,
  "device": "cpu"
}
```

### ✅ Servidor Frontend  
```bash
curl http://localhost:8082
```

## Configuração de Tokens

### 1. Token Hugging Face (OBRIGATÓRIO para diarização local)

#### Passo 1: Aceitar os termos dos modelos
Você **DEVE** aceitar os termos destes modelos antes de usar:

1. **pyannote/segmentation-3.0**
   - Acesse: https://huggingface.co/pyannote/segmentation-3.0
   - Clique em **"Accept"** após ler os termos

2. **pyannote/speaker-diarization-3.1**
   - Acesse: https://huggingface.co/pyannote/speaker-diarization-3.1  
   - Clique em **"Accept"** após ler os termos

#### Passo 2: Criar token de acesso
1. Acesse: https://huggingface.co/settings/tokens
2. Clique em **"New token"**
3. Escolha **"Read"** como tipo
4. Dê um nome ao token (ex: "stemuc-diarization")
5. Copie o token gerado

#### Passo 3: Configurar o token
```bash
# Windows
set HUGGINGFACE_TOKEN=seu_token_aqui

# Linux/Mac
export HUGGINGFACE_TOKEN=seu_token_aqui
```

### 2. API Key pyannoteAI (OPCIONAL - Serviço Premium)

#### Vantagens da API Premium:
- ⚡ **2x mais rápido** que o modelo local
- 🎯 **+20% de precisão** comparado ao modelo local  
- 💰 **-50% custo computacional** (processa na nuvem)
- 🌍 **Funciona sem GPU** local
- 🔄 **Sem necessidade de downloads** de modelos

#### Como obter:
1. Acesse: https://dashboard.pyannote.ai
2. Crie uma conta
3. Gere uma API key
4. Configure:
```bash
# Windows  
set PYANNOTE_API_KEY=sua_api_key_aqui

# Linux/Mac
export PYANNOTE_API_KEY=sua_api_key_aqui
```

## Estratégias de Configuração

### 📈 **Produção Recomendada** (API + Fallback)
```bash
HUGGINGFACE_TOKEN=seu_token_hf
PYANNOTE_API_KEY=sua_api_key  # API como principal
LOG_LEVEL=INFO
MAX_FILE_SIZE=209715200  # 200MB
```

**Comportamento:**
1. Tenta pyannoteAI API primeiro (rápido, preciso)
2. Se API falhar → fallback automático para local
3. Melhor confiabilidade e performance

### 🔧 **Desenvolvimento Local** (Apenas Local)
```bash
HUGGINGFACE_TOKEN=seu_token_hf
LOG_LEVEL=DEBUG
```

**Comportamento:**
- Usa apenas diarização local
- Gratuito mas mais lento
- Requer GPU para performance ideal

### ☁️ **Somente API** (Sem Fallback)
```bash
PYANNOTE_API_KEY=sua_api_key
# Não definir HUGGINGFACE_TOKEN
```

**Comportamento:**
- Usa apenas API da pyannoteAI
- Falha se API indisponível
- Ideal para produção cloud-first

## Teste da Configuração

### 1. Verificar configuração geral:
```bash
curl http://localhost:8080/health
```

### 2. Testar diarização:
```bash
# Faça upload de um arquivo com múltiplos cantores
# Ative a opção "Voice Diarization" na interface
# Verifique os logs do servidor
```

### 3. Verificar logs:
```bash
tail -f app.log
```

## Resolução de Problemas

### ❌ `diarization_available: false`

**Causa:** Tokens não configurados corretamente

**Solução:**
1. Verifique se aceitou os termos dos modelos
2. Confirme que o token HF está válido  
3. Reinicie o servidor após configurar tokens

### ❌ Pipeline retorna `None`

**Causa:** Termos dos modelos não aceitos

**Solução:**
1. Acesse os links dos modelos mencionados acima
2. Faça login no Hugging Face
3. Aceite os termos clicando em "Accept"
4. Reinicie o servidor

### ❌ Erro 503 "Voice diarization currently unavailable"

**Causa:** Sistema de diarização não inicializou

**Solução:**
1. Verifique logs: `tail -f app.log`
2. Confirme configuração dos tokens
3. Reinicie completamente o sistema

### ❌ API Key inválida

**Causa:** API key da pyannoteAI incorreta

**Solução:**
1. Verifique a API key no dashboard
2. Gere uma nova se necessário
3. Sistema fará fallback para local automaticamente

## Monitoramento

### Verificar qual método está sendo usado:
```bash
# Nos logs, procure por:
# "Diarização concluída... usando método: api"     → API
# "Diarização concluída... usando método: local"  → Local  
tail -f app.log | grep "método:"
```

### Status dos serviços:
```bash
# Backend
curl http://localhost:8080/health

# Frontend  
curl http://localhost:8082
```

## Arquivos de Configuração

### `backend/config.py`
- Gerencia todas as variáveis de ambiente
- Valida configurações na inicialização
- Cria diretórios necessários

### `backend/diarization.py`  
- Implementa sistema híbrido API + local
- Fallback automático entre métodos
- Processamento e segmentação de áudio

### `backend/main.py`
- Endpoint `/health` para diagnóstico
- Integração com sistema de diarização
- Tratamento de erros e logging

## Próximos Passos

1. ✅ Configure os tokens conforme este guia
2. ✅ Teste a funcionalidade com arquivos de áudio
3. ✅ Monitore logs para otimização
4. ✅ Configure API premium se necessário
5. ✅ Deploy em produção com configuração híbrida

---

**Configuração atual funcionando:**
- ✅ Backend: http://localhost:8080  
- ✅ Frontend: http://localhost:8082
- ✅ Diarização: Disponível (local)
- ⚠️ API Premium: Não configurada (opcional) 