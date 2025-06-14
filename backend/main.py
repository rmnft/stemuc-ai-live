from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import shutil
from typing import List, Optional
from pydantic import BaseModel
import logging
import traceback
import torch
from demucs import pretrained
from datetime import datetime

# Import security configurations
try:
    from security import limiter, validate_audio_file, setup_security_headers, setup_rate_limiting
    SECURITY_AVAILABLE = True
    logging.info("✅ Módulo de segurança carregado")
except ImportError as e:
    SECURITY_AVAILABLE = False
    logging.warning(f"⚠️ Módulo de segurança não disponível: {e}")

# Configurações
from config import config

# Configurar device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Ativar cudnn.benchmark para otimizações na GPU
if torch.cuda.is_available():
    torch.backends.cudnn.benchmark = True
    
from process import separate_audio
from diarization import create_diarizer

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

logger.info(f"🚀 Sistema iniciando com PyTorch {torch.__version__}")
logger.info(f"🎮 Device: {device}")
if torch.cuda.is_available():
    logger.info(f"🔥 GPU: {torch.cuda.get_device_name(0)}")
    logger.info(f"⚡ CUDNN Benchmark: {torch.backends.cudnn.benchmark}")

# Variáveis globais para os modelos pré-carregados
models_store = {}
diarizer = None

app = FastAPI(
    title="Stemuc Audio Forge API",
    description="Sistema de separação de áudio com diarização de vozes - FUNCIONAL!",
    version="1.0.1",
    docs_url="/docs" if os.getenv("NODE_ENV") != "production" else None,
    redoc_url="/redoc" if os.getenv("NODE_ENV") != "production" else None
)

# Setup security configurations
if SECURITY_AVAILABLE:
    setup_security_headers(app)
    setup_rate_limiting(app)
    logger.info("🔒 Configurações de segurança aplicadas")

# Trusted host middleware for production
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if os.getenv("NODE_ENV") != "production" else [
        "*.railway.app", 
        "*.vercel.app", 
        "localhost", 
        "127.0.0.1"
    ]
)

@app.on_event("startup")
def load_models():
    global diarizer
    
    logger.info("🔄 Iniciando carregamento dos modelos...")
    
    try:
        # Carregar o BEST_MODEL (htdemucs_ft) para 4 stems
        logger.info("📥 Carregando htdemucs_ft...")
        models_store["htdemucs_ft"] = pretrained.get_model("htdemucs_ft").to(device).eval()
        logger.info(f"✅ Modelo htdemucs_ft carregado em {device}")
        
        # Carregar o EXTRA_MODEL (htdemucs_6s) para 6 stems / custom
        logger.info("📥 Carregando htdemucs_6s...")
        models_store["htdemucs_6s"] = pretrained.get_model("htdemucs_6s").to(device).eval()
        logger.info(f"✅ Modelo htdemucs_6s carregado em {device}")

    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelos Demucs: {e}", exc_info=True)
    
    # Inicializar diarizador
    try:
        logger.info("🎤 Inicializando diarizador de vozes...")
        diarizer = create_diarizer(
            huggingface_token=config.HUGGINGFACE_TOKEN,
            pyannote_api_key=config.PYANNOTE_API_KEY
        )
        
        if diarizer and diarizer.is_available():
            logger.info("✅ Diarizador carregado com sucesso!")
            if config.has_pyannote_api:
                logger.info("🌟 Usando pyannoteAI API premium")
            else:
                logger.info("🏠 Usando pyannote.audio local")
        else:
            logger.warning("⚠️ Diarizador não disponível")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar diarizador: {e}", exc_info=True)
    
    logger.info("🎉 Sistema totalmente carregado e pronto!")

# --- Static File Serving ---
app.mount("/stems", StaticFiles(directory=config.OUTPUT_DIR), name="stems")
app.mount("/original_audio", StaticFiles(directory=config.UPLOAD_DIR), name="original_audio")

# CORS configuration for production
ALLOWED_ORIGINS = [
    "https://stemuc-ai-live.vercel.app",  # Vercel production
    "https://*.vercel.app",               # Vercel preview deployments
    "http://localhost:5173",              # Vite development
    "http://localhost:3000",              # Alternative dev port
    "http://localhost:8082",              # Legacy dev port
    "https://*.railway.app",              # Railway deployment
]

# Add environment-specific origins
if os.getenv("FRONTEND_URL"):
    ALLOWED_ORIGINS.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if os.getenv("NODE_ENV") == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class SeparationRequest(BaseModel):
    mode: str
    selectedStems: Optional[List[str]] = None
    enable_diarization: bool = False

def has_vocals(mode: str, selected_stems: Optional[List[str]]) -> bool:
    """Verifica se a configuração inclui separação de vocais."""
    if mode in ["2-stem", "4-stem", "6-stem"]:
        return True  # Todos esses modos incluem vocais
    elif mode == "custom" and selected_stems:
        return "vocals" in selected_stems
    return False

@app.get("/health")
async def health_check():
    """Endpoint de verificação de saúde do sistema."""
    import shutil
    
    gpu_info = None
    if torch.cuda.is_available():
        gpu_info = {
            "name": torch.cuda.get_device_name(0),
            "memory_total": torch.cuda.get_device_properties(0).total_memory,
            "memory_allocated": torch.cuda.memory_allocated(0),
            "memory_cached": torch.cuda.memory_reserved(0)
        }
    
    # Verificar espaço em disco
    disk_usage = shutil.disk_usage("/tmp")
    disk_free_gb = round(disk_usage.free / (1024**3), 2)
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "message": "🎉 Sistema funcionando 100%!",
        "diarization_available": diarizer.is_available() if diarizer else False,
        "pyannote_api_configured": config.has_pyannote_api,
        "huggingface_token_configured": config.has_huggingface_token,
        "device": str(device),
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "gpu_info": gpu_info,
        "models_loaded": list(models_store.keys()),
        "demucs_ready": len(models_store) > 0,
        "disk_free_gb": disk_free_gb,
        "security_enabled": SECURITY_AVAILABLE,
        "full_system_status": "🟢 FULLY OPERATIONAL"
    }

@app.get("/status")
async def system_status():
    """Endpoint detalhado de status do sistema."""
    try:
        from cache import model_cache
        cache_info = model_cache.get_cache_info()
    except ImportError:
        cache_info = {"cache": "not_available"}
    
    return {
        "system": {
            "uptime": "running",
            "environment": os.getenv("NODE_ENV", "development"),
            "security_enabled": SECURITY_AVAILABLE
        },
        "models": {
            "loaded": list(models_store.keys()),
            "cache_info": cache_info
        },
        "services": {
            "diarization": diarizer.is_available() if diarizer else False,
            "pyannote_api": config.has_pyannote_api,
            "huggingface": config.has_huggingface_token
        },
        "hardware": {
            "device": str(device),
            "cuda_available": torch.cuda.is_available(),
            "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
        }
    }

@app.get("/")
async def root():
    """Endpoint raiz da API."""
    return {
        "message": "Stemuc Audio Forge API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "status": "/status",
            "separate": "/separate",
            "docs": "/docs" if os.getenv("NODE_ENV") != "production" else "disabled"
        }
    }

@app.post("/separate")
async def separate(
    request: Request,
    file: UploadFile = File(...),
    mode: str = Form(...), 
    selectedStems: Optional[List[str]] = Form(None), 
    enable_diarization: bool = Form(False)
):
    # Apply rate limiting if available
    if SECURITY_AVAILABLE:
        try:
            await limiter.check(request, "5/minute")
        except Exception as e:
            logger.warning(f"⚠️ Rate limit aplicado: {e}")
            raise HTTPException(status_code=429, detail="Muitas requisições. Tente novamente em 1 minuto.")
    
    try:
        logger.info(f"🎵 Nova requisição: {file.filename}, modo: {mode}, diarização: {enable_diarization}")
        
        # --- Input Validation ---
        # Use security validation if available
        if SECURITY_AVAILABLE:
            validate_audio_file(file)
        if file.content_type not in ["audio/mpeg", "audio/wav", "audio/mp3"]:
            logger.warning(f"❌ Tipo de arquivo inválido: {file.content_type}")
            raise HTTPException(
                status_code=400, detail=f"Tipo de arquivo inválido: {file.content_type}. Use MP3 ou WAV."
            )

        if file.size > config.MAX_FILE_SIZE:
            logger.warning(f"❌ Arquivo muito grande: {file.size} bytes")
            raise HTTPException(
                status_code=413,
                detail=f"Arquivo muito grande ({file.size / 1024 / 1024:.2f} MB). Máximo: {config.MAX_FILE_SIZE / 1024 / 1024} MB."
            )

        valid_modes = ["2-stem", "4-stem", "6-stem", "custom"]
        if mode not in valid_modes:
            logger.warning(f"❌ Modo inválido: {mode}")
            raise HTTPException(
                status_code=400, detail=f"Modo inválido: '{mode}'. Modos válidos: {valid_modes}"
            )

        if mode == "custom" and not selectedStems:
            logger.warning("❌ Modo custom sem stems especificados")
            raise HTTPException(
                status_code=400, detail="Para modo 'custom', 'selectedStems' deve ser fornecido."
            )

        # Validar diarização
        if enable_diarization:
            if not has_vocals(mode, selectedStems):
                logger.warning("❌ Diarização solicitada mas vocais não selecionados")
                raise HTTPException(
                    status_code=400, detail="Diarização requer que vocais sejam incluídos na separação."
                )
            
            if not diarizer or not diarizer.is_available():
                logger.warning("❌ Diarização solicitada mas não disponível")
                raise HTTPException(
                    status_code=503, detail="Diarização temporariamente indisponível."
                )

        # --- File Handling ---
        safe_filename = os.path.basename(file.filename or "uploaded_audio")
        input_path = os.path.join(config.UPLOAD_DIR, safe_filename)

        try:
            with open(input_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info(f"💾 Arquivo salvo: {input_path}")
        except IOError as e:
             logger.error(f"❌ Falha ao salvar arquivo: {e}")
             raise HTTPException(status_code=500, detail=f"Falha ao salvar arquivo: {str(e)}")
        finally:
            await file.close()

        # --- Separation Logic ---
        logger.info(f"🔄 Iniciando separação com {device}")
        output_paths = separate_audio(
            input_path=input_path, 
            mode=mode, 
            output_dir_base=config.OUTPUT_DIR,
            requested_stems=selectedStems,
            device=device,
            models_store=models_store
        )
        
        if not output_paths:
            if os.path.exists(input_path):
                original_relative_path = os.path.relpath(input_path, config.UPLOAD_DIR).replace("\\", "/")
                logger.info("📁 Retornando áudio original")
                return {"original_audio_path": original_relative_path, "stems": []}
            raise HTTPException(status_code=500, detail="Separação falhou - nenhum stem encontrado.")

        # --- Diarização (se solicitada) ---
        diarization_result = None
        artist_paths = []
        
        if enable_diarization and diarizer and diarizer.is_available():
            # Encontrar o arquivo vocal
            vocal_path = None
            for path in output_paths:
                if "vocals.wav" in os.path.basename(path):
                    vocal_path = path
                    break
            
            if vocal_path and os.path.exists(vocal_path):
                logger.info(f"🎤 Iniciando diarização: {vocal_path}")
                
                try:
                    # Aplicar diarização
                    diarization_data = diarizer.diarize_vocals(vocal_path)
                    
                    if diarization_data and diarization_data.get('num_speakers', 0) > 1:
                        # Múltiplos cantores detectados
                        base_name = os.path.splitext(os.path.basename(input_path))[0]
                        artists_output_dir = os.path.join(config.OUTPUT_DIR, "artists", base_name)
                        
                        artist_paths = diarizer.segment_vocals(
                            vocal_path, 
                            diarization_data, 
                            artists_output_dir
                        )
                        
                        diarization_result = {
                            "enabled": True,
                            "method": diarization_data.get('method', 'unknown'),
                            "num_artists": diarization_data['num_speakers'],
                            "artists": {
                                f"artist_{i+1}": os.path.relpath(path, config.OUTPUT_DIR).replace("\\", "/")
                                for i, path in enumerate(artist_paths)
                            }
                        }
                        
                        logger.info(f"✅ Diarização concluída: {len(artist_paths)} artistas - método: {diarization_data.get('method')}")
                    else:
                        # Apenas um cantor
                        diarization_result = {
                            "enabled": True,
                            "method": diarization_data.get('method', 'unknown') if diarization_data else 'unknown',
                            "num_artists": 1,
                            "artists": {},
                            "message": "Apenas um cantor detectado"
                        }
                        logger.info("✅ Diarização: apenas um cantor detectado")
                        
                except Exception as e:
                    logger.error(f"❌ Erro na diarização: {e}", exc_info=True)
                    diarization_result = {
                        "enabled": False,
                        "error": "Falha na diarização. Stems normais mantidos."
                    }
            else:
                logger.warning("❌ Arquivo vocal não encontrado para diarização")
                diarization_result = {
                    "enabled": False,
                    "error": "Arquivo vocal não encontrado."
                }

        # --- Response ---
        relative_output_paths = [os.path.relpath(p, config.OUTPUT_DIR).replace("\\", "/") for p in output_paths]
        original_relative_path = os.path.relpath(input_path, config.UPLOAD_DIR).replace("\\", "/")
        
        response = {
            "original_audio_path": original_relative_path, 
            "stems": relative_output_paths
        }
        
        if diarization_result:
            response["diarization"] = diarization_result
        
        logger.info(f"✅ Separação concluída! Stems: {len(relative_output_paths)}")
        return response

    except HTTPException as http_exc:
        logger.warning(f"⚠️ HTTPException: {http_exc.status_code} - {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"❌ Erro interno: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment (Railway sets this)
    port = int(os.getenv("PORT", 8080))
    
    # Production configuration
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port,
        workers=1,  # Single worker for GPU models
        timeout_keep_alive=300,  # 5 minutes for long audio processing
        limit_request_size=200 * 1024 * 1024  # 200MB limit
    )
