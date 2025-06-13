# wav_extractor.py
# Extrai stems do dataset MUSDB18 (pastas train/ e test/) em arquivos WAV.

import os
import stempeg
import soundfile as sf

# Nomes das streams no MUSDB18 multitrack .mp4
STEM_NAMES = ["mixture", "drums", "bass", "other", "vocals"]
# Subconjuntos a processar
SUBSETS = ["train", "test"]


def extract_all(root_dir: str):
    """
    Percorre as pastas 'train' e 'test' dentro de root_dir, encontra os arquivos .mp4
    do MUSDB18 e extrai cada um dos 5 stems para WAV em uma subpasta com o nome da faixa.
    """
    for subset in SUBSETS:
        subset_dir = os.path.join(root_dir, subset)
        if not os.path.isdir(subset_dir):
            print(f"Pasta não encontrada: {subset_dir}, pulando.")
            continue
        # Lista todos os arquivos .mp4 no subset
        for fname in os.listdir(subset_dir):
            if not fname.lower().endswith('.mp4'):
                continue
            track_name = os.path.splitext(fname)[0]
            in_path = os.path.join(subset_dir, fname)
            out_dir = os.path.join(subset_dir, track_name)
            os.makedirs(out_dir, exist_ok=True)
            print(f"Extraindo stems de '{in_path}' para '{out_dir}'...")

            # Leitura de todas as streams: retorna ndarray [5, n_samples, 2] e sample rate
            try:
                tracks, rate = stempeg.read_stems(in_path, stem_id=None)
            except Exception as e:
                print(f"Erro ao ler {in_path}: {e}")
                continue

            # Salva cada stem em WAV
            for idx, name in enumerate(STEM_NAMES):
                wav = tracks[idx]  # shape (n_samples, 2)
                out_path = os.path.join(out_dir, f"{name}.wav")
                try:
                    sf.write(out_path, wav, rate)
                    print(f"  - {name}.wav salvo ({rate} Hz)")
                except Exception as e:
                    print(f"  Erro ao salvar {out_path}: {e}")
        print(f"Concluído subset '{subset}'.\n")


if __name__ == "__main__":
    # Assume que este script está sendo executado a partir da raiz do projeto
    project_root = os.getcwd()
    print(f"Iniciando extração de stems em '{project_root}'")
    extract_all(project_root)
    print("Extração concluída para todos os subsets.")
