# Security and rate limiting configurations
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Rate limiter configuration - More permissive for production
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute", "1000/hour"]  # More generous limits
)

# File validation settings
ALLOWED_EXTENSIONS = {'.mp3', '.wav', '.flac', '.m4a'}
MAX_FILE_SIZE = 200 * 1024 * 1024  # 200MB

def validate_audio_file(file, max_size: int = MAX_FILE_SIZE):
    """Validate uploaded audio file."""
    # Check file extension
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Formato não suportado: {ext}. Use: {', '.join(ALLOWED_EXTENSIONS)}"
            )
    
    # Check file size
    if hasattr(file, 'size') and file.size and file.size > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande ({file.size / 1024 / 1024:.2f} MB). Máximo: {max_size / 1024 / 1024} MB"
        )
    
    return True

def setup_security_headers(app):
    """Add security headers middleware."""
    
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        return response

def get_rate_limit_for_endpoint(endpoint: str, is_production: bool = False):
    """Get appropriate rate limit for specific endpoint."""
    if is_production:
        # More generous limits for production
        limits = {
            "separate": "50/minute",      # Audio processing
            "health": "200/minute",       # Health checks
            "status": "100/minute",       # Status checks
            "default": "100/minute"       # Default for other endpoints
        }
    else:
        # Stricter limits for development/testing
        limits = {
            "separate": "10/minute",
            "health": "60/minute", 
            "status": "30/minute",
            "default": "20/minute"
        }
    
    return limits.get(endpoint, limits["default"])

def setup_rate_limiting(app):
    """Setup rate limiting for the app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler) 