from pydantic_settings import BaseSettings, SettingsConfigDict

from pathlib import Path

# Get the directory where this config.py file is located
CONFIG_DIR = Path(__file__).parent

class __Settings(BaseSettings):
    # Environment Configuration
    LOG_LEVEL: str = 'INFO'
    LOG_FORMAT: str = 'json'  # 'json' or 'text'
    HOST: str = '0.0.0.0'
    PORT: int = 8000

    # Model Serving Configuration
    TF_MODEL_SERVING_URL: str = 'http://localhost:8501'

    # Known Models (comma-separated)
    KNOWN_MODELS: str = 'handnumbers'
    
    # Image Saving Configuration
    SAVE_IMAGES: bool = False
    SAVE_IMAGES_PATH: str = './images'

    model_config = SettingsConfigDict(
        env_file=CONFIG_DIR / '.env',
        env_file_encoding='utf-8',
        env_prefix='MLZOO_'
    )

config = __Settings()
