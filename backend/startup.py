import os
import logging
from pathlib import Path
import subprocess
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_directories():
    """Criar diretórios necessários para a aplicação."""
    dirs = [
        os.getenv('UPLOAD_DIR', '/tmp/uploads'),
        os.getenv('MODELS_DIR', '/tmp/models'),
        os.getenv('STEMS_DIR', '/tmp/stems'),
        os.getenv('OUTPUT_DIR', '/tmp/outputs')
    ]
    
    for dir_path in dirs:
        try:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
            logger.info(f"📁 Diretório criado/verificado: {dir_path}")
        except Exception as e:
            logger.error(f"❌ Erro ao criar diretório {dir_path}: {e}")
            raise

def check_system_dependencies():
    """Verificar dependências do sistema."""
    try:
        # Verificar ffmpeg
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        logger.info("✅ FFmpeg disponível")
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.warning("⚠️ FFmpeg não encontrado - alguns recursos podem não funcionar")
    
    try:
        # Verificar git (necessário para alguns downloads)
        subprocess.run(['git', '--version'], capture_output=True, check=True)
        logger.info("✅ Git disponível")
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.warning("⚠️ Git não encontrado")

def check_system_resources():
    """Verificar recursos do sistema."""
    try:
        import psutil
        
        # Memória
        memory = psutil.virtual_memory()
        logger.info(f"💾 Memória: {memory.total / (1024**3):.1f}GB total, "
                   f"{memory.available / (1024**3):.1f}GB disponível")
        
        # Disco
        disk = psutil.disk_usage('/')
        logger.info(f"💿 Disco: {disk.total / (1024**3):.1f}GB total, "
                   f"{disk.free / (1024**3):.1f}GB livre")
        
        # CPU
        logger.info(f"🖥️ CPUs: {psutil.cpu_count()} cores")
        
        # Verificar se há memória suficiente (mínimo 1GB)
        if memory.available < 1024**3:
            logger.warning("⚠️ Pouca memória disponível - pode afetar performance")
            
    except ImportError:
        logger.warning("⚠️ psutil não instalado - não foi possível verificar recursos")
    except Exception as e:
        logger.error(f"❌ Erro ao verificar recursos: {e}")

def setup_environment_variables():
    """Configurar variáveis de ambiente necessárias."""
    # Torch home para modelos
    if not os.getenv('TORCH_HOME'):
        os.environ['TORCH_HOME'] = '/tmp/models'
    
    # Demucs model path
    if not os.getenv('DEMUCS_MODEL_PATH'):
        os.environ['DEMUCS_MODEL_PATH'] = '/tmp/models/demucs'
    
    # Hugging Face cache
    if not os.getenv('HF_HOME'):
        os.environ['HF_HOME'] = '/tmp/huggingface'
    
    logger.info("🔧 Variáveis de ambiente configuradas")

def verify_tokens():
    """Verificar se os tokens necessários estão configurados."""
    hf_token = os.getenv('HUGGINGFACE_TOKEN')
    if not hf_token:
        logger.error("❌ HUGGINGFACE_TOKEN não configurado!")
        sys.exit(1)
    else:
        logger.info("✅ Hugging Face token configurado")
    
    pyannote_key = os.getenv('PYANNOTE_API_KEY')
    if pyannote_key:
        logger.info("✅ PyAnnote API key configurado")
    else:
        logger.info("⚠️ PyAnnote API key não configurado - usando apenas modo local")

def download_critical_models():
    """Fazer download dos modelos críticos na inicialização."""
    try:
        logger.info("🔄 Iniciando download de modelos críticos...")
        
        # Importar dentro da função para evitar problemas de importação
        import torch
        from demucs.pretrained import get_model
        
        # Modelos essenciais do Demucs
        critical_models = ['htdemucs_ft', 'htdemucs_6s']
        
        for model_name in critical_models:
            try:
                logger.info(f"📥 Baixando modelo {model_name}...")
                model = get_model(model_name)
                logger.info(f"✅ Modelo {model_name} carregado com sucesso")
                
                # Liberar memória
                del model
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    
            except Exception as e:
                logger.error(f"❌ Erro ao carregar modelo {model_name}: {e}")
                # Não falhar se um modelo específico não carregar
                continue
                
        logger.info("🎉 Download de modelos concluído!")
        
    except Exception as e:
        logger.error(f"❌ Erro crítico no download de modelos: {e}")
        # Em produção, podemos continuar sem alguns modelos
        logger.warning("⚠️ Continuando sem alguns modelos - funcionalidade pode ser limitada")

def main():
    """Função principal de inicialização."""
    logger.info("🚀 Iniciando configuração do Stemuc Audio Forge...")
    
    try:
        # 1. Configurar variáveis de ambiente
        setup_environment_variables()
        
        # 2. Criar diretórios
        setup_directories()
        
        # 3. Verificar dependências do sistema
        check_system_dependencies()
        
        # 4. Verificar recursos do sistema
        check_system_resources()
        
        # 5. Verificar tokens
        verify_tokens()
        
        # 6. Download de modelos críticos
        download_critical_models()
        
        logger.info("✅ Inicialização concluída com sucesso!")
        
    except Exception as e:
        logger.error(f"❌ Erro na inicialização: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 