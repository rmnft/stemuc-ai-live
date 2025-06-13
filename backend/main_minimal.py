from fastapi import FastAPI
import logging
import os

# Configurações
try:
    from config import config
    logger = logging.getLogger(__name__)
    logger.info("Config carregado com sucesso!")
    logger.info(f"pyannote_api_configured: {config.has_pyannote_api}")
    logger.info(f"huggingface_token_configured: {config.has_huggingface_token}")
except Exception as e:
    print(f"Erro ao carregar config: {e}")
    config = None

app = FastAPI(title="Stemuc Audio Forge - Minimal Test")

@app.get("/health")
async def health_check():
    """Endpoint de verificação de saúde do sistema."""
    if config:
        return {
            "status": "healthy",
            "diarization_available": True,  # Simplificado para teste
            "pyannote_api_configured": config.has_pyannote_api,
            "huggingface_token_configured": config.has_huggingface_token,
            "device": "cpu"
        }
    else:
        return {
            "status": "config_error",
            "diarization_available": False,
            "pyannote_api_configured": False,
            "huggingface_token_configured": False,
            "device": "unknown"
        } 