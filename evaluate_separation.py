import logging
import os

import numpy as np
import soundfile as sf
import torch
import museval

# Tentar importar PESQ como classe; fallback para função funcional
try:
    from torchmetrics.audio.pesq import PerceptualEvaluationSpeechQuality
    PESQ_CLASS = True
except ImportError:
    from torchmetrics.functional.audio.pesq import perceptual_evaluation_speech_quality
    PESQ_CLASS = False

# Configura logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("evaluation")


def load_wav(path):
    """
    Carrega um arquivo WAV e retorna (data, sample_rate).
    """
    try:
        data, sr = sf.read(path)
        return data, sr
    except Exception as e:
        logger.error(f"Erro ao carregar WAV: {path} -> {e}")
        return None, None


def compute_mse(ref, est):
    """
    Mean Squared Error entre ref e est.
    """
    ref = np.asarray(ref)
    est = np.asarray(est)
    L = min(len(ref), len(est))
    if L == 0:
        return float("inf")
    return np.mean((ref[:L] - est[:L]) ** 2)


def compute_snr(ref, est):
    """
    Signal-to-Noise Ratio em dB.
    """
    ref = np.asarray(ref)
    est = np.asarray(est)
    L = min(len(ref), len(est))
    if L == 0:
        return float("-inf")
    noise = ref[:L] - est[:L]
    p_noise = np.sum(noise ** 2)
    p_ref = np.sum(ref[:L] ** 2)
    if p_noise == 0:
        return float("inf")
    if p_ref == 0:
        return float("-inf")
    return 10 * np.log10(p_ref / p_noise)


def evaluate_track(ref_paths: dict, est_paths: dict):
    """
    Calcula métricas de qualidade entre stems originais e estimados.
    """
    logger.info("=== Iniciando avaliação da faixa ===")
    signals_ref, signals_est = {}, {}
    stems, srs = [], set()

    # Carrega stems disponíveis
    for name, rpath in ref_paths.items():
        epath = est_paths.get(name)
        if not epath or not os.path.exists(rpath) or not os.path.exists(epath):
            logger.warning(f"Pulando stem '{name}' (não encontrado)")
            continue
        r, sr_r = load_wav(rpath)
        e, sr_e = load_wav(epath)
        if r is None or e is None:
            continue
        if sr_r != sr_e:
            logger.warning(f"SR mismatch em '{name}': {sr_r} vs {sr_e}, usando {sr_r}")
        srs.add(sr_r)
        signals_ref[name] = r
        signals_est[name] = e
        stems.append(name)

    if not stems:
        logger.error("Nenhum stem válido para avaliação.")
        return

    sr = srs.pop() if srs else None
    logger.info(f"Usando sample rate: {sr} Hz")

    # 1) MSE e SNR
    logger.info("--- MSE e SNR por stem ---")
    for name in stems:
        r = signals_ref[name]
        e = signals_est[name]
        if r.ndim > 1:
            r = r.mean(axis=1)
        if e.ndim > 1:
            e = e.mean(axis=1)
        mse = compute_mse(r, e)
        snr = compute_snr(r, e)
        logger.info(f"{name:<10} | MSE: {mse:.6f} | SNR: {snr:.2f} dB")

    # 2) PESQ (vocals)
    if "vocals" in stems and sr:
        rv = signals_ref["vocals"]
        ev = signals_est["vocals"]
        if rv.ndim > 1:
            rv = rv.mean(axis=1)
        if ev.ndim > 1:
            ev = ev.mean(axis=1)
        L = min(len(rv), len(ev))
        rt = torch.from_numpy(rv[:L]).unsqueeze(0)
        et = torch.from_numpy(ev[:L]).unsqueeze(0)
        
        # Tenta usar a classe; se faltarem dependências, usa a função
        try:
            metric = PerceptualEvaluationSpeechQuality(fs=sr, mode="wb")
            score = metric(rt, et).item()
        except Exception:
            score = perceptual_evaluation_speech_quality(rt, et, fs=sr, mode="wb").item()
        
        logger.info(f"PESQ (vocals): {score:.3f}")

    # 3) BSS Eval (SDR, SIR, SAR)
    logger.info("--- BSS Eval (SDR, SIR, SAR) ---")
    L = min(len(signals_ref[n]) for n in stems)
    refs = [signals_ref[n][:L] for n in stems]
    ests = [signals_est[n][:L] for n in stems]
    scores = museval.eval_mus_track(refs, ests, sr)
    for name, sc in zip(stems, scores):
        logger.info(
            f"{name:<10} | SDR: {sc['SDR']:.2f} | SIR: {sc['SIR']:.2f} | SAR: {sc['SAR']:.2f}"
        )

    logger.info("=== Avaliação desta faixa concluída ===\n")


if __name__ == "__main__":
    logger.info("=== Avaliando tracks processadas pelo Stemuc ===")
    base_sep = "separated"

    # Obtém listas de faixas em train/ e test/ (case-insensitive)
    gt_train = os.listdir("train") if os.path.isdir("train") else []
    gt_test = os.listdir("test") if os.path.isdir("test") else []
    map_train = {t.lower(): t for t in gt_train}
    map_test  = {t.lower(): t for t in gt_test}

    # Para cada modelo dentro de separated/
    for model_name in os.listdir(base_sep):
        model_dir = os.path.join(base_sep, model_name)
        if not os.path.isdir(model_dir):
            continue
        logger.info(f"### Modelo: {model_name} ###")

        # Para cada faixa (pasta) processada
        for track in os.listdir(model_dir):
            track_dir = os.path.join(model_dir, track)
            if not os.path.isdir(track_dir):
                continue

            # Detecta subpasta única (ex: 'mixture')
            subs = [d for d in os.listdir(track_dir)
                    if os.path.isdir(os.path.join(track_dir, d))]
            if len(subs) == 1:
                est_dir = os.path.join(track_dir, subs[0])
            else:
                est_dir = track_dir

            # Identifica se está em train ou test via map case-insensitive
            tl = track.lower()
            if tl in map_train:
                subset = "train"
                gt_track = map_train[tl]
            elif tl in map_test:
                subset = "test"
                gt_track = map_test[tl]
            else:
                logger.warning(f"Faixa '{track}' não encontrada em train/ nem test/, pulando.")
                continue

            gt_dir = os.path.join(subset, gt_track)
            stems = ("vocals", "drums", "bass", "other")
            gt_paths = {s: os.path.join(gt_dir, f"{s}.wav")  for s in stems}
            es_paths = {s: os.path.join(est_dir, f"{s}.wav") for s in stems}

            logger.info(f"--- Avaliando '{track}' ({subset}) ---")
            evaluate_track(gt_paths, es_paths)

    logger.info("=== Avaliação completa ===")
