# Cache module for model optimization
import os
import logging
import time
from functools import lru_cache
from typing import Dict, Any, Optional
import torch
from demucs.pretrained import get_model

logger = logging.getLogger(__name__)

class ModelCache:
    """Cache inteligente para modelos Demucs."""
    
    def __init__(self, max_models: int = 2):
        self.max_models = max_models
        self.models: Dict[str, Any] = {}
        self.access_times: Dict[str, float] = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    def get_model(self, model_name: str):
        """Obter modelo do cache ou carregar se necessário."""
        if model_name in self.models:
            self.access_times[model_name] = time.time()
            logger.info(f"📦 Modelo {model_name} carregado do cache")
            return self.models[model_name]
        
        # Se cache está cheio, remover modelo menos usado
        if len(self.models) >= self.max_models:
            self._evict_least_used()
        
        # Carregar novo modelo
        logger.info(f"📥 Carregando modelo {model_name}...")
        model = get_model(model_name).to(self.device).eval()
        
        self.models[model_name] = model
        self.access_times[model_name] = time.time()
        
        logger.info(f"✅ Modelo {model_name} carregado em cache")
        return model
    
    def _evict_least_used(self):
        """Remover modelo menos usado do cache."""
        if not self.access_times:
            return
            
        least_used = min(self.access_times.items(), key=lambda x: x[1])
        model_name = least_used[0]
        
        logger.info(f"🗑️ Removendo modelo {model_name} do cache")
        
        # Liberar memória
        del self.models[model_name]
        del self.access_times[model_name]
        
        # Limpar cache GPU se disponível
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    def clear_cache(self):
        """Limpar todo o cache."""
        logger.info("🧹 Limpando cache de modelos")
        self.models.clear()
        self.access_times.clear()
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    def get_cache_info(self) -> Dict[str, Any]:
        """Obter informações do cache."""
        return {
            "cached_models": list(self.models.keys()),
            "cache_size": len(self.models),
            "max_models": self.max_models,
            "memory_usage": self._get_memory_usage()
        }
    
    def _get_memory_usage(self) -> Dict[str, Any]:
        """Obter uso de memória."""
        if torch.cuda.is_available():
            return {
                "gpu_allocated": torch.cuda.memory_allocated(0),
                "gpu_cached": torch.cuda.memory_reserved(0),
                "gpu_total": torch.cuda.get_device_properties(0).total_memory
            }
        return {"gpu": "not_available"}

# Cache global de modelos
model_cache = ModelCache()

@lru_cache(maxsize=32)
def get_audio_info(file_path: str) -> Dict[str, Any]:
    """Cache para informações de áudio."""
    try:
        import librosa
        duration = librosa.get_duration(filename=file_path)
        return {
            "duration": duration,
            "cached_at": time.time()
        }
    except Exception as e:
        logger.error(f"Erro ao obter info do áudio: {e}")
        return {}

def cleanup_temp_files(temp_dir: str, max_age_hours: int = 2):
    """Limpar arquivos temporários antigos."""
    if not os.path.exists(temp_dir):
        return
    
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    for filename in os.listdir(temp_dir):
        file_path = os.path.join(temp_dir, filename)
        
        try:
            file_age = current_time - os.path.getmtime(file_path)
            if file_age > max_age_seconds:
                os.remove(file_path)
                logger.info(f"🗑️ Arquivo temporário removido: {filename}")
        except Exception as e:
            logger.warning(f"Erro ao remover arquivo {filename}: {e}")

def setup_periodic_cleanup():
    """Configurar limpeza periódica (para usar com background tasks)."""
    import threading
    import time
    
    def cleanup_worker():
        while True:
            try:
                # Limpar arquivos temporários a cada hora
                cleanup_temp_files("/tmp/uploads", max_age_hours=1)
                cleanup_temp_files("/tmp/stems", max_age_hours=2)
                cleanup_temp_files("/tmp/outputs", max_age_hours=2)
                
                # Limpar cache GPU se necessário
                if torch.cuda.is_available():
                    memory_usage = torch.cuda.memory_allocated(0) / torch.cuda.get_device_properties(0).total_memory
                    if memory_usage > 0.8:  # Se uso > 80%
                        torch.cuda.empty_cache()
                        logger.info("🧹 Cache GPU limpo por uso alto de memória")
                
                time.sleep(3600)  # Aguardar 1 hora
                
            except Exception as e:
                logger.error(f"Erro na limpeza periódica: {e}")
                time.sleep(300)  # Aguardar 5 minutos em caso de erro
    
    # Iniciar thread de limpeza
    cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
    cleanup_thread.start()
    logger.info("🧹 Limpeza periódica iniciada") 