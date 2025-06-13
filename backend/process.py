import os
import glob
import time
import logging
from typing import List, Optional, Dict, Any

import torch
import torchaudio
from demucs.apply import apply_model

# Logger configurado para este módulo
logger = logging.getLogger(__name__)

# Nomes dos modelos
BEST_MODEL_NAME = "htdemucs_ft"
EXTRA_MODEL_NAME = "htdemucs_6s"


def separate_audio(
    input_path: str,
    mode: str,
    output_dir_base: str,
    device: torch.device,
    models_store: Dict[str, Any],
    requested_stems: Optional[List[str]] = None,
) -> List[str]:
    """
    Separa um arquivo de áudio usando Demucs (API Python) e salva os stems no disco.
    Retorna lista de caminhos dos stems gerados.
    """
    t_start = time.time()

    try:
        logger.info(f"Iniciando separação via API Python para: {input_path}, modo: {mode}")

        # Seleciona modelo e stems suportados
        if mode in ("6-stem", "custom"):
            model_name = EXTRA_MODEL_NAME
            supported = ["vocals", "drums", "bass", "guitar", "piano", "other"]
        else:
            model_name = BEST_MODEL_NAME
            supported = ["vocals", "drums", "bass", "other"]

        model = models_store.get(model_name)
        if model is None:
            msg = f"Modelo '{model_name}' não encontrado em models_store"
            logger.error(msg)
            raise RuntimeError(msg)

        # 1) Carrega e prepara o áudio
        t0 = time.time()
        wav, sr = torchaudio.load(input_path)  # shape: [C, T]
        # Ajuste de canais
        if wav.ndim == 1:
            wav = wav.unsqueeze(0)
        if wav.shape[0] != model.audio_channels:
            # mixdown para mono
            wav = wav.mean(dim=0, keepdim=True)
            if model.audio_channels == 2:
                wav = torch.cat([wav, wav], dim=0)
        # Resample se necessário
        if sr != model.samplerate:
            logger.info(f"Resampling de {sr}Hz para {model.samplerate}Hz")
            wav = torchaudio.transforms.Resample(sr, model.samplerate, device=device)(wav)
        # Adiciona batch
        wav = wav.unsqueeze(0).to(device)  # shape: [1, C, T]
        t1 = time.time()
        logger.info(f"Áudio preparado em {t1-t0:.2f}s (shape={tuple(wav.shape)})")

        # 2) Inferência com half-precision se GPU
        t2 = time.time()
        with torch.no_grad():
            with torch.cuda.amp.autocast(enabled=device.type == 'cuda'):
                separated = apply_model(
                    model,
                    wav,
                    device=device,
                    progress=False,
                )  # tensor possivelmente shape [B, S, C, T] ou [S, C, T]
        t3 = time.time()
        logger.info(f"Inferência concluída em {t3-t2:.2f}s")

        # Normaliza dimensões: se batch dimension existir, remove
        if separated.dim() == 4:
            # [batch, S, C, T] -> [S, C, T]
            separated = separated[0]
        elif separated.dim() == 3:
            # já [S, C, T]
            pass
        else:
            msg = f"Formato inesperado de saída do Demucs: {separated.shape}"
            logger.error(msg)
            raise RuntimeError(msg)

        # 3) Define quais stems salvar
        if mode == "2-stem":
            # vocals + no_vocals
            idx_v = model.sources.index("vocals")
            vocals = separated[idx_v]
            no_vocals = separated.sum(dim=0) - vocals
            stems_to_save = {"vocals": vocals, "no_vocals": no_vocals}
        elif mode == "custom" and requested_stems:
            stems_to_save = {
                name: separated[i]
                for i, name in enumerate(model.sources)
                if name in requested_stems
            }
        else:
            # 4-stem ou 6-stem
            stems_to_save = {name: separated[i] for i, name in enumerate(model.sources)}

        # 4) Salva stems
        t4 = time.time()
        base = os.path.splitext(os.path.basename(input_path))[0]
        out_dir = os.path.join(output_dir_base, model_name, base)
        os.makedirs(out_dir, exist_ok=True)
        output_paths: List[str] = []

        for name, tensor in stems_to_save.items():
            path = os.path.join(out_dir, f"{name}.wav")
            torchaudio.save(path, tensor.cpu(), sample_rate=model.samplerate)
            output_paths.append(path)
            logger.info(f"Stem salvo: {path}")
        t5 = time.time()

        # Log de performance
        logger.info(
            f"PERF load {(t1-t0):.2f}s | infer {(t3-t2):.2f}s | write {(t5-t4):.2f}s | total {(t5-t_start):.2f}s"
        )
        return output_paths

    except Exception as e:
        logger.error(f"Erro em separate_audio (API Python): {e}", exc_info=True)
        return []

