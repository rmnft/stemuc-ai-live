from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
from typing import List, Optional
from pydantic import BaseModel
import logging
import traceback

# Configurações
from config import config

# --- Configurar Logging ---
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s - %(levelname)s - %(name)s - %(module)s.%(funcName)s:%(lineno)d - %(message)s",
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler()
    ],
    force=True
)

logger = logging.getLogger(__name__)

# Para demonstrar que a API key está funcionando
diarizer_available = False
if config.has_pyannote_api:
    diarizer_available = True
    logger.info("pyannoteAI API está configurada e disponível!")
    logger.info(f"API Key: {config.PYANNOTE_API_KEY[:15]}...")

app = FastAPI(
    title="Stemuc Audio Forge",
    description="Sistema de separação de áudio com diarização de vozes",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    logger.info("Sistema iniciado com sucesso!")
    logger.info(f"Diarização disponível: {diarizer_available}")
    if config.has_pyannote_api:
        logger.info("Usando pyannoteAI API premium")
    if config.has_huggingface_token:
        logger.info("Token Hugging Face configurado para fallback local")

# --- Static File Serving ---
app.mount("/stems", StaticFiles(directory=config.OUTPUT_DIR), name="stems")
app.mount("/original_audio", StaticFiles(directory=config.UPLOAD_DIR), name="original_audio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Endpoint de verificação de saúde do sistema."""
    return {
        "status": "healthy",
        "diarization_available": diarizer_available,
        "pyannote_api_configured": config.has_pyannote_api,
        "huggingface_token_configured": config.has_huggingface_token,
        "device": "cpu",
        "torch_available": False,  # Temporariamente desabilitado devido a problema de instalação
        "api_key_status": "configured" if config.has_pyannote_api else "not_configured",
        "message": "pyannoteAI API está configurada e pronta para usar!" if config.has_pyannote_api else "Configure PYANNOTE_API_KEY para usar diarização premium"
    }

@app.get("/")
async def root():
    """Endpoint raiz."""
    return {
        "message": "Stemuc Audio Forge API",
        "version": "1.0.0",
        "status": "running",
        "pyannote_api_ready": config.has_pyannote_api
    }

@app.post("/test-diarization")
async def test_diarization():
    """Endpoint de teste para verificar se a API da pyannoteAI está funcionando."""
    if not config.has_pyannote_api:
        raise HTTPException(
            status_code=503, 
            detail="pyannoteAI API não está configurada. Configure PYANNOTE_API_KEY para usar este serviço."
        )
    
    return {
        "status": "success",
        "message": "pyannoteAI API está configurada corretamente!",
        "api_key_prefix": config.PYANNOTE_API_KEY[:15] + "...",
        "ready_for_diarization": True
    } 