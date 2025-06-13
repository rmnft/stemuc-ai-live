# Configuração do Stemuc Audio Forge

## Variáveis de Ambiente

### Tokens de Autenticação

#### HUGGINGFACE_TOKEN (Obrigatório para diarização local)
- **Descrição**: Token de acesso ao Hugging Face para baixar modelos pyannote
- **Como obter**: 
  1. Acesse https://huggingface.co/settings/tokens
  2. Crie um novo token com permissões de leitura
  3. Aceite os termos dos modelos:
     - https://huggingface.co/pyannote/segmentation-3.0
     - https://huggingface.co/pyannote/speaker-diarization-3.1
- **Exemplo**: `HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### PYANNOTE_API_KEY (Opcional, para serviço premium)
- **Descrição**: Chave da API da pyannoteAI para usar o serviço premium
- **Como obter**: 
  1. Acesse https://dashboard.pyannote.ai
  2. Crie uma conta
  3. Gere uma API key
- **Vantagens**: Mais rápido, mais preciso, sem necessidade de GPU local
- **Exemplo**: `PYANNOTE_API_KEY=your_api_key_here`

### Configurações de Sistema

#### Diretórios
- `UPLOAD_DIR=uploads` - Diretório para arquivos enviados
- `OUTPUT_DIR=separated` - Diretório para arquivos processados

#### Processamento
- `MAX_FILE_SIZE=157286400` - Tamanho máximo de arquivo em bytes (150MB)
- `USE_GPU=auto` - Uso de GPU: `auto`, `true`, `false`

#### Logging
- `LOG_LEVEL=INFO` - Nível de log: `DEBUG`, `INFO`, `WARNING`, `ERROR`
- `LOG_FILE=app.log` - Arquivo de log

## Configuração Recomendada

### Para Desenvolvimento Local
```bash
# Apenas diarização local
HUGGINGFACE_TOKEN=seu_token_hf
LOG_LEVEL=DEBUG
```

### Para Produção
```bash
# API premium + fallback local
HUGGINGFACE_TOKEN=seu_token_hf
PYANNOTE_API_KEY=sua_api_key
LOG_LEVEL=INFO
MAX_FILE_SIZE=209715200  # 200MB
```

## Passos para Configuração Completa

1. **Aceitar termos dos modelos Hugging Face**:
   - Acesse: https://huggingface.co/pyannote/segmentation-3.0
   - Clique em "Accept" para aceitar os termos
   - Acesse: https://huggingface.co/pyannote/speaker-diarization-3.1  
   - Clique em "Accept" para aceitar os termos

2. **Criar token Hugging Face**:
   - Acesse: https://huggingface.co/settings/tokens
   - Clique em "New token"
   - Escolha "Read" como tipo
   - Copie o token gerado

3. **Configurar variáveis de ambiente**:
   ```bash
   export HUGGINGFACE_TOKEN=seu_token_aqui
   ```

4. **Opcional - Configurar pyannoteAI**:
   - Acesse: https://dashboard.pyannote.ai
   - Crie conta e obtenha API key
   - Configure: `export PYANNOTE_API_KEY=sua_api_key`

## Verificação da Configuração

Use o endpoint `/health` para verificar se tudo está configurado:

```bash
curl http://localhost:8080/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "diarization_available": true,
  "pyannote_api_configured": true,
  "huggingface_token_configured": true,
  "device": "cuda"
}
``` 