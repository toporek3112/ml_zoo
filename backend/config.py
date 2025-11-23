from pydantic_settings import BaseSettings, SettingsConfigDict

class __Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8',env_prefix='MLZOO')

    # Environment Configuration
    LOG_LEVEL: str = 'INFO'
    HOST: str = '0.0.0.0'
    PORT: int = 8000

    # Model Serving Configuration
    TF_MODEL_SERVING_URL: str = 'http://localhost:8501'

    # Known Models (comma-separated)
    KNOWN_MODELS: str = 'handnumbers'

config = __Settings()
