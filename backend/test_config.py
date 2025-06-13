#!/usr/bin/env python3

import os
from dotenv import load_dotenv

print("=== Teste de Configuração ===")

# Carregar .env
load_dotenv()

print(f"Arquivo .env existe: {os.path.exists('../.env')}")
print(f"PYANNOTE_API_KEY da variável de ambiente: {os.getenv('PYANNOTE_API_KEY')}")
print(f"HUGGINGFACE_TOKEN da variável de ambiente: {os.getenv('HUGGINGFACE_TOKEN')}")

# Importar config
from config import config

print(f"config.PYANNOTE_API_KEY: {config.PYANNOTE_API_KEY}")
print(f"config.has_pyannote_api: {config.has_pyannote_api}")
print(f"config.HUGGINGFACE_TOKEN: {config.HUGGINGFACE_TOKEN}")
print(f"config.has_huggingface_token: {config.has_huggingface_token}")

print("=== Fim do Teste ===") 