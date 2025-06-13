import os
import logging
import tempfile
import time
import torch
import requests
import librosa
import soundfile as sf
from typing import List, Dict, Any, Optional
from pydub import AudioSegment

logger = logging.getLogger(__name__)

# Importações condicionais para pyannote
try:
    from pyannote.audio import Pipeline
    from pyannote.audio.pipelines.utils import PipelineModel
    PYANNOTE_AVAILABLE = True
    logger.info("✅ pyannote.audio está disponível")
except ImportError as e:
    PYANNOTE_AVAILABLE = False
    logger.warning(f"⚠️ pyannote.audio não disponível: {e}")

class VocalDiarizer:
    """
    Classe responsável pela diarização (separação de diferentes cantores) em faixas vocais.
    Suporta tanto API da pyannoteAI quanto pyannote.audio local.
    """
    
    def __init__(self, huggingface_token: str, pyannote_api_key: Optional[str] = None):
        """
        Inicializa o diarizador com tokens necessários.
        
        Args:
            huggingface_token: Token de autenticação do Hugging Face (para modelos locais)
            pyannote_api_key: API key da pyannoteAI (para serviço premium)
        """
        self.huggingface_token = huggingface_token
        self.pyannote_api_key = pyannote_api_key
        self.pipeline = None
        self.use_api = bool(pyannote_api_key)
        
        logger.info(f"🎤 Inicializando VocalDiarizer - API: {self.use_api}, Local: {PYANNOTE_AVAILABLE}")
        
        # Inicializar pipeline local se disponível
        if PYANNOTE_AVAILABLE:
            self._initialize_local_pipeline()
    
    def _compress_audio_for_api(self, audio_path: str, max_size_mb: int = 20) -> str:
        """
        Comprime áudio para ficar abaixo do limite da API.
        
        Args:
            audio_path: Caminho para o arquivo original
            max_size_mb: Tamanho máximo em MB
            
        Returns:
            Caminho para arquivo comprimido temporário
        """
        try:
            # Verificar tamanho atual
            current_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
            
            if current_size_mb <= max_size_mb:
                logger.info(f"Arquivo já é pequeno o suficiente: {current_size_mb:.1f}MB")
                return audio_path
            
            logger.info(f"Comprimindo áudio de {current_size_mb:.1f}MB para menos de {max_size_mb}MB...")
            
            # Criar arquivo temporário
            temp_fd, temp_path = tempfile.mkstemp(suffix='.wav', prefix='compressed_')
            os.close(temp_fd)
            
            # Carregar áudio com librosa
            y, sr = librosa.load(audio_path, sr=16000, mono=True)
            
            # Salvar com qualidade reduzida
            sf.write(temp_path, y, sr, subtype='PCM_16')
            
            new_size_mb = os.path.getsize(temp_path) / (1024 * 1024)
            logger.info(f"Áudio comprimido: {new_size_mb:.1f}MB (economia: {current_size_mb - new_size_mb:.1f}MB)")
            
            return temp_path
            
        except Exception as e:
            logger.error(f"Erro ao comprimir áudio: {e}")
            return audio_path
    
    def _initialize_local_pipeline(self):
        """Inicializa o pipeline local de diarização."""
        if not PYANNOTE_AVAILABLE:
            logger.error("pyannote.audio não disponível. Instale com: pip install pyannote.audio")
            return
        
        try:
            logger.info("Carregando modelo local pyannote/speaker-diarization-3.1...")
            
            # Aceitar termos automaticamente via login
            os.environ["HF_TOKEN"] = self.huggingface_token
            
            # Tentar carregar o pipeline com configurações melhoradas
            self.pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=self.huggingface_token
            )
            
            # Configurar parâmetros para melhor detecção de múltiplos speakers
            if hasattr(self.pipeline, 'clustering'):
                # Reduzir threshold para ser mais sensível a diferentes speakers
                if hasattr(self.pipeline.clustering, 'threshold'):
                    self.pipeline.clustering.threshold = 0.5  # Mais sensível
                    logger.info("🎯 Threshold ajustado para 0.5 (mais sensível)")
            
            logger.info(f"Pipeline local carregado com sucesso: {type(self.pipeline)}")
            
            # Mover para GPU se disponível
            if torch.cuda.is_available():
                try:
                    self.pipeline = self.pipeline.to("cuda")
                    logger.info("🔥 Pipeline local carregado em GPU")
                except Exception as e:
                    logger.warning(f"Erro ao mover pipeline para GPU: {e}")
                    logger.info("📱 Pipeline local carregado em CPU")
            else:
                logger.info("📱 Pipeline local carregado em CPU")
                
        except Exception as e:
            logger.error(f"Erro ao carregar pipeline local: {e}", exc_info=True)
            self.pipeline = None
    
    def _diarize_with_api(self, audio_path: str) -> Optional[Dict[str, Any]]:
        """
        Usa a API da pyannoteAI para diarização.
        
        Args:
            audio_path: Caminho para o arquivo de áudio
            
        Returns:
            Resultado da diarização via API
        """
        if not self.pyannote_api_key:
            logger.error("API key da pyannoteAI não configurada")
            return None
        
        compressed_path = None
        try:
            logger.info("Iniciando diarização via pyannoteAI API...")
            
            # Comprimir áudio se necessário
            compressed_path = self._compress_audio_for_api(audio_path, max_size_mb=15)
            
            # Upload do arquivo
            with open(compressed_path, 'rb') as f:
                files = {'file': f}
                headers = {'Authorization': f'Bearer {self.pyannote_api_key}'}
                
                # Iniciar job de diarização
                response = requests.post(
                    'https://api.pyannote.ai/v1/jobs',
                    files=files,
                    headers=headers,
                    data={'type': 'diarization'}
                )
                
                if response.status_code != 201:
                    logger.error(f"Erro ao iniciar job da API: {response.status_code} - {response.text}")
                    return None
                
                job_data = response.json()
                job_id = job_data['id']
                logger.info(f"Job de diarização iniciado: {job_id}")
                
                # Aguardar conclusão do job
                max_wait = 300  # 5 minutos
                wait_time = 0
                
                while wait_time < max_wait:
                    status_response = requests.get(
                        f'https://api.pyannote.ai/v1/jobs/{job_id}',
                        headers=headers
                    )
                    
                    if status_response.status_code != 200:
                        logger.error(f"Erro ao verificar status: {status_response.status_code}")
                        return None
                    
                    status_data = status_response.json()
                    status = status_data['status']
                    
                    if status == 'completed':
                        logger.info("Diarização via API concluída com sucesso")
                        return self._parse_api_result(status_data['result'])
                    elif status == 'failed':
                        logger.error(f"Job de diarização falhou: {status_data.get('error', 'Erro desconhecido')}")
                        return None
                    
                    # Aguardar antes de verificar novamente
                    time.sleep(5)
                    wait_time += 5
                    
                logger.error("Timeout aguardando conclusão da diarização via API")
                return None
                
        except Exception as e:
            logger.error(f"Erro na diarização via API: {e}", exc_info=True)
            return None
        finally:
            # Limpar arquivo temporário se foi criado
            if compressed_path and compressed_path != audio_path:
                try:
                    os.unlink(compressed_path)
                    logger.debug("Arquivo temporário comprimido removido")
                except Exception as e:
                    logger.warning(f"Erro ao remover arquivo temporário: {e}")
    
    def _parse_api_result(self, api_result: Dict) -> Dict[str, Any]:
        """
        Converte resultado da API para formato interno.
        
        Args:
            api_result: Resultado bruto da API
            
        Returns:
            Resultado formatado
        """
        try:
            speakers = {}
            
            # A API retorna segmentos com speaker, start, end
            for segment in api_result.get('segments', []):
                speaker_id = f"artist_{segment['speaker']}"
                if speaker_id not in speakers:
                    speakers[speaker_id] = []
                
                speakers[speaker_id].append({
                    'start': segment['start'],
                    'end': segment['end'],
                    'duration': segment['end'] - segment['start']
                })
            
            num_speakers = len(speakers)
            total_duration = max([seg['end'] for segments in speakers.values() 
                                for seg in segments]) if speakers else 0
            
            logger.info(f"🎤 API detectou {num_speakers} speakers em {total_duration:.1f}s")
            
            return {
                'num_speakers': num_speakers,
                'speakers': speakers,
                'total_duration': total_duration,
                'method': 'api'
            }
            
        except Exception as e:
            logger.error(f"Erro ao processar resultado da API: {e}")
            return None
    
    def _diarize_with_local(self, audio_path: str) -> Optional[Dict[str, Any]]:
        """
        Usa pipeline local para diarização.
        
        Args:
            audio_path: Caminho para o arquivo de áudio
            
        Returns:
            Resultado da diarização local
        """
        if not self.pipeline:
            logger.error("Pipeline local não disponível")
            return None
        
        try:
            logger.info(f"Iniciando diarização local do arquivo: {audio_path}")
            
            # Preparar áudio para processamento local (reduzir para melhor performance)
            temp_path = None
            try:
                # Comprimir para 16kHz mono para melhor processamento
                y, sr = librosa.load(audio_path, sr=16000, mono=True)
                
                # Criar arquivo temporário se necessário
                if sr != 16000 or len(y.shape) > 1:
                    temp_fd, temp_path = tempfile.mkstemp(suffix='.wav', prefix='diarize_')
                    os.close(temp_fd)
                    sf.write(temp_path, y, 16000)
                    process_path = temp_path
                else:
                    process_path = audio_path
                
                # Aplicar diarização com parâmetros ajustados
                logger.info("🔄 Processando diarização...")
                diarization = self.pipeline(process_path, min_speakers=1, max_speakers=8)
                
                # Processar resultados
                speakers = {}
                for turn, _, speaker in diarization.itertracks(yield_label=True):
                    speaker_id = f"artist_{speaker}"
                    if speaker_id not in speakers:
                        speakers[speaker_id] = []
                    speakers[speaker_id].append({
                        'start': turn.start,
                        'end': turn.end,
                        'duration': turn.end - turn.start
                    })
                
                num_speakers = len(speakers)
                total_duration = max([segment['end'] for segments in speakers.values() 
                                    for segment in segments]) if speakers else 0
                
                logger.info(f"🎤 Local detectou {num_speakers} speakers em {total_duration:.1f}s")
                
                return {
                    'num_speakers': num_speakers,
                    'speakers': speakers,
                    'total_duration': total_duration,
                    'diarization_object': diarization,
                    'method': 'local'
                }
                
            finally:
                # Limpar arquivo temporário
                if temp_path:
                    try:
                        os.unlink(temp_path)
                    except Exception as e:
                        logger.warning(f"Erro ao remover arquivo temporário: {e}")
            
        except Exception as e:
            logger.error(f"Erro na diarização local: {e}", exc_info=True)
            return None
    
    def is_available(self) -> bool:
        """Verifica se algum método de diarização está disponível."""
        return (self.pyannote_api_key is not None) or (PYANNOTE_AVAILABLE and self.pipeline is not None)
    
    def diarize_vocals(self, vocal_path: str) -> Optional[Dict[str, Any]]:
        """
        Aplica diarização na faixa vocal para identificar diferentes cantores.
        Tenta API primeiro, depois fallback local.
        
        Args:
            vocal_path: Caminho para o arquivo vocal separado
            
        Returns:
            Dict contendo informações de diarização ou None se falhar
        """
        if not self.is_available():
            logger.error("Nenhum método de diarização disponível")
            return None
        
        # Tentar API primeiro se disponível
        if self.use_api and self.pyannote_api_key:
            logger.info("🌐 Tentando diarização via API...")
            result = self._diarize_with_api(vocal_path)
            if result:
                return result
            else:
                logger.warning("⚠️ Diarização via API falhou, tentando método local...")
        
        # Fallback para método local
        if PYANNOTE_AVAILABLE and self.pipeline:
            logger.info("🏠 Tentando diarização local...")
            return self._diarize_with_local(vocal_path)
        
        logger.error("❌ Todos os métodos de diarização falharam")
        return None
    
    def segment_vocals(self, vocal_path: str, diarization_result: Dict[str, Any], output_dir: str) -> List[str]:
        """
        Segmenta o áudio vocal em faixas individuais por artista.
        
        Args:
            vocal_path: Caminho para o arquivo vocal original
            diarization_result: Resultado da diarização
            output_dir: Diretório de saída para os arquivos segmentados
            
        Returns:
            Lista de caminhos para os arquivos de cada artista
        """
        if not diarization_result or 'speakers' not in diarization_result:
            logger.error("Resultado de diarização inválido")
            return []
        
        try:
            logger.info(f"Iniciando segmentação vocal em {output_dir}")
            
            # Criar diretório de saída
            os.makedirs(output_dir, exist_ok=True)
            
            # Carregar áudio original
            audio = AudioSegment.from_wav(vocal_path)
            output_paths = []
            
            # Processar cada cantor
            speakers = diarization_result['speakers']
            for speaker_id, segments in speakers.items():
                logger.info(f"Processando {speaker_id} com {len(segments)} segmentos")
                
                # Criar áudio vazio para este cantor
                artist_audio = AudioSegment.silent(duration=len(audio))
                
                # Adicionar todos os segmentos deste cantor
                for segment in segments:
                    start_ms = int(segment['start'] * 1000)
                    end_ms = int(segment['end'] * 1000)
                    
                    # Verificar limites
                    if start_ms < len(audio) and end_ms <= len(audio):
                        # Extrair segmento e sobrepor no áudio do artista
                        segment_audio = audio[start_ms:end_ms]
                        artist_audio = artist_audio.overlay(segment_audio, position=start_ms)
                
                # Salvar arquivo do artista
                output_path = os.path.join(output_dir, f"{speaker_id}.wav")
                artist_audio.export(output_path, format="wav")
                output_paths.append(output_path)
                
                logger.info(f"Arquivo salvo: {output_path}")
            
            logger.info(f"Segmentação concluída. {len(output_paths)} arquivos gerados")
            return output_paths
            
        except Exception as e:
            logger.error(f"Erro na segmentação: {e}", exc_info=True)
            return []

def create_diarizer(huggingface_token: str, pyannote_api_key: Optional[str] = None) -> Optional[VocalDiarizer]:
    """
    Factory function para criar uma instância do diarizador.
    
    Args:
        huggingface_token: Token do Hugging Face
        pyannote_api_key: API key da pyannoteAI (opcional)
        
    Returns:
        Instância do VocalDiarizer ou None se falhar
    """
    try:
        return VocalDiarizer(huggingface_token, pyannote_api_key)
    except Exception as e:
        logger.error(f"Erro ao criar diarizador: {e}")
        return None 