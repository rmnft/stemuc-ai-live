import os
from typing import Optional
import logging
from dotenv import load_dotenv
from pathlib import Path

# Carregar variáveis do arquivo .env do diretório pai
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

class Config:
    """Configurações do sistema."""
    
    def __init__(self):
        # Tokens de autenticação
        self.HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "REMOVED_HUGGINGFACE_TOKEN ")
        self.PYANNOTE_API_KEY = os.getenv("PYANNOTE_API_KEY")
        
        # Configurações de diretórios
        self.UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
        self.OUTPUT_DIR = os.getenv("OUTPUT_DIR", "separated")
        
        # Configurações de processamento
        self.MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 150 * 1024 * 1024))  # 150MB
        self.USE_GPU = os.getenv("USE_GPU", "auto").lower()
        
        # Logging
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
        self.LOG_FILE = os.getenv("LOG_FILE", "app.log")
        
        # Debug das variáveis carregadas
        logger.info(f"Arquivo .env encontrado: {env_path.exists()}")
        logger.info(f"HUGGINGFACE_TOKEN carregado: {'Sim' if self.HUGGINGFACE_TOKEN else 'Não'}")
        logger.info(f"PYANNOTE_API_KEY carregado: {'Sim' if self.PYANNOTE_API_KEY else 'Não'}")
        if self.PYANNOTE_API_KEY:
            logger.info(f"API Key início: {self.PYANNOTE_API_KEY[:10]}...")
        
        # Validar configurações
        self._validate_config()
    
    def _validate_config(self):
        """Valida as configurações."""
        if not self.HUGGINGFACE_TOKEN:
            logger.warning("HUGGINGFACE_TOKEN não configurado. Diarização local pode não funcionar.")
        
        if not self.PYANNOTE_API_KEY:
            logger.info("PYANNOTE_API_KEY não configurado. Usando apenas diarização local.")
        else:
            logger.info("pyannoteAI API configurada com sucesso.")
        
        # Criar diretórios se não existirem
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.OUTPUT_DIR, exist_ok=True)
    
    @property
    def has_pyannote_api(self) -> bool:
        """Verifica se a API da pyannoteAI está configurada."""
        return bool(self.PYANNOTE_API_KEY and self.PYANNOTE_API_KEY.strip())
    
    @property
    def has_huggingface_token(self) -> bool:
        """Verifica se o token do Hugging Face está configurado."""
        return bool(self.HUGGINGFACE_TOKEN and self.HUGGINGFACE_TOKEN.strip())

# Instância global de configuração
config = Config() 