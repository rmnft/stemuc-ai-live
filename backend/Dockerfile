# Imagem base com Python
FROM python:3.10-slim-bullseye

# Variáveis de ambiente para otimização
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Audio processing
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    # Build tools (necessário para algumas libs Python)
    build-essential \
    gcc \
    g++ \
    # Git (para baixar modelos)
    git \
    # Curl para health checks
    curl \
    # Limpeza
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root por segurança
RUN useradd -m -u 1000 appuser

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivo de requirements
COPY requirements.txt ./

# Instalar PyTorch com CPU (Railway não tem GPU gratuita)
RUN pip install --upgrade pip setuptools wheel && \
    pip install torch==2.0.1 torchaudio==2.0.2 --index-url https://download.pytorch.org/whl/cpu && \
    pip install -r requirements.txt

# Criar diretórios necessários com permissões corretas
RUN mkdir -p /app/uploads /app/separated /app/models /app/logs && \
    chown -R appuser:appuser /app

# Copiar código da aplicação
COPY --chown=appuser:appuser . .

# Download dos modelos Demucs durante build (evita download em runtime)
RUN python -c "from demucs import pretrained; pretrained.get_model('htdemucs_ft')" || true && \
    python -c "from demucs import pretrained; pretrained.get_model('htdemucs_6s')" || true

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Comando de inicialização
CMD ["sh", "-c", "python startup.py && uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1"] 