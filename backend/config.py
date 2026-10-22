import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory or project root
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

load_dotenv(BASE_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "Identity Drift Detection Guard"
    VERSION: str = "1.0.0"
    
    # Groq API configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    JUDGE_MODEL: str = os.getenv("JUDGE_MODEL", "openai/gpt-oss-120b")
    
    # Server configuration
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Identity Drift Thresholds
    TIER1_DRIFT_THRESHOLD: float = float(os.getenv("TIER1_DRIFT_THRESHOLD", "0.52"))
    RISK_SCORE_HITL_THRESHOLD: int = int(os.getenv("RISK_SCORE_HITL_THRESHOLD", "75"))
    RISK_SCORE_CRITICAL_THRESHOLD: int = int(os.getenv("RISK_SCORE_CRITICAL_THRESHOLD", "90"))

settings = Settings()
