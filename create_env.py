#!/usr/bin/env python3
"""Script para criar arquivo .env com encoding correto"""

env_content = """# Configurações do Stemuc Audio Forge

# Token do Hugging Face (obrigatório para modelos pyannote locais)
HUGGINGFACE_TOKEN=your_token_here 

# API Key da pyannoteAI (para serviço premium)
PYANNOTE_API_KEY=sk_644fc53fb65e4b17a56123395ccb88e4

# Configurações de diretórios
UPLOAD_DIR=uploads
OUTPUT_DIR=separated

# Configurações de processamento
MAX_FILE_SIZE=157286400
USE_GPU=auto

# Configurações de logging
LOG_LEVEL=INFO
LOG_FILE=app.log
"""

with open('.env', 'w', encoding='utf-8') as f:
    f.write(env_content)

print("Arquivo .env criado com sucesso!") 