from typing import Optional, List
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "SlideSearch"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"

    VALKEY_HOST: str = "localhost"
    VALKEY_PORT: int = 6379
    VALKEY_DB: int = 0
    VALKEY_PASSWORD: Optional[str] = None

    MEILISEARCH_HOST: str = "localhost"
    MEILISEARCH_PORT: int = 7700
    MEILISEARCH_API_KEY: Optional[str] = None

    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000
    SERVER_DEBUG: bool = False
    SERVER_RELOAD: bool = True
    CORS_ORIGINS: List[str] = ["*"]

    DATA_DIR: Path = Path("pdfs")

    def get_valkey_url(self) -> str:
        auth_part = f":{self.VALKEY_PASSWORD}@" if self.VALKEY_PASSWORD else "@"
        return (
            f"redis://{auth_part}{self.VALKEY_HOST}:{self.VALKEY_PORT}/{self.VALKEY_DB}"
        )

    def get_meilisearch_url(self) -> str:
        return f"http://{self.MEILISEARCH_HOST}:{self.MEILISEARCH_PORT}"


config = Settings()
config.DATA_DIR.mkdir(exist_ok=True)
