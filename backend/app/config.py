from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:password@localhost:5432/vmg"
    cors_origins: str = "http://localhost:3000"
    fred_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
