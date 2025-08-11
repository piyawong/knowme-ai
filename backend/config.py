"""
Configuration settings for the resume chatbot backend.

This module provides centralized configuration management using
pydantic-settings for environment variables and app settings.
"""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    # API Configuration
    openai_api_key: str = Field(..., description="OpenAI API key for LLM")
    backend_port: int = Field(default=8000, description="Backend server port")

    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:3000"], description="Allowed CORS origins"
    )

    # Resume Data
    resume_data_path: str = Field(
        default="./backend/data/resume.json",
        description="Path to resume JSON data file",
    )

    # Development & Logging
    debug: bool = Field(default=False, description="Enable debug mode")
    log_level: str = Field(default="info", description="Logging level")

    # Frontend Configuration
    frontend_url: str = Field(
        default="http://localhost:3000", description="Frontend application URL"
    )

    # Optional Production Settings
    database_url: Optional[str] = Field(
        default=None, description="Database URL for production persistence"
    )
    redis_url: Optional[str] = Field(
        default=None, description="Redis URL for session storage"
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }


def get_settings() -> Settings:
    """
    Get application settings instance.

    Returns:
        Settings: Configured settings instance.
    """
    return Settings()


# Global settings instance - only create when needed
settings = None


def get_global_settings() -> Settings:
    """Get global settings instance, creating if needed."""
    global settings
    if settings is None:
        settings = get_settings()
    return settings
