#!/usr/bin/env python3

import os
import sys
from pathlib import Path

print("=== Debug Configuração ===")
print(f"Diretório atual: {os.getcwd()}")
print(f"Python path: {sys.path}")

# Verificar arquivos .env
env_current = Path('.env')
env_parent = Path('../.env')
env_absolute = Path(__file__).parent.parent / '.env'

print(f"\nArquivos .env:")
print(f"./env existe: {env_current.exists()}")
print(f"../.env existe: {env_parent.exists()}")
print(f"Caminho absoluto .env existe: {env_absolute.exists()}")

if env_absolute.exists():
    print(f"\nConteúdo do .env:")
    with open(env_absolute, 'r', encoding='utf-8') as f:
        content = f.read()
        print(content)

# Verificar variáveis de ambiente
print(f"\nVariáveis de ambiente OS:")
print(f"PYANNOTE_API_KEY: {os.getenv('PYANNOTE_API_KEY')}")
print(f"HUGGINGFACE_TOKEN: {os.getenv('HUGGINGFACE_TOKEN')}")

# Carregar com dotenv
from dotenv import load_dotenv
load_dotenv(dotenv_path=env_absolute)

print(f"\nApós load_dotenv:")
print(f"PYANNOTE_API_KEY: {os.getenv('PYANNOTE_API_KEY')}")
print(f"HUGGINGFACE_TOKEN: {os.getenv('HUGGINGFACE_TOKEN')}")

# Tentar importar config
try:
    from config import config
    print(f"\nConfig importado:")
    print(f"config.PYANNOTE_API_KEY: {config.PYANNOTE_API_KEY}")
    print(f"config.has_pyannote_api: {config.has_pyannote_api}")
except Exception as e:
    print(f"Erro ao importar config: {e}")

print("=== Fim Debug ===") 