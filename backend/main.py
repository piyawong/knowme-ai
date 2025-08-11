"""
FastAPI main application for the resume Q&A chatbot.

This module sets up the FastAPI application with CORS middleware,
routing, and global exception handling.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import uvicorn

from .config import get_settings
from .api.chat import router as chat_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.

    Args:
        app: FastAPI application instance.
    """
    # Startup
    logger.info("Starting Resume Chatbot Backend...")
    settings = get_settings()

    # Validate required environment variables
    if not settings.openai_api_key:
        logger.error("OPENAI_API_KEY environment variable is required")
        raise ValueError("OPENAI_API_KEY environment variable is required")

    # Initialize agent (this will validate the setup)
    try:
        from .agents.resume_agent import get_resume_agent

        get_resume_agent()  # Initialize but don't store unused variable
        logger.info("Resume agent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize resume agent: {e}")
        raise

    logger.info("Backend startup complete")

    yield

    # Shutdown
    logger.info("Shutting down Resume Chatbot Backend...")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        FastAPI: Configured application instance.
    """
    settings = get_settings()

    # Create FastAPI app with metadata
    app = FastAPI(
        title="Resume Q&A Chatbot API",
        description="Backend API for interactive resume chatbot using LangChain agents",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Session-ID"],
    )

    # Include routers
    app.include_router(chat_router)

    # Validation error handler
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """
        Handle Pydantic validation errors.
        
        Args:
            request: FastAPI request object.
            exc: Validation exception that occurred.
        
        Returns:
            JSONResponse: Error response with validation details.
        """
        logger.error(f"Validation error: {exc.errors()}")
        
        # Extract the first error for a simpler message
        first_error = exc.errors()[0] if exc.errors() else {}
        field = '.'.join(str(loc) for loc in first_error.get('loc', ['unknown']))
        msg = first_error.get('msg', 'Validation error')
        
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation Error",
                "message": f"'{field}'. {msg}",
                "details": exc.errors() if settings.debug else None,
            },
        )
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """
        Global exception handler for unhandled errors.

        Args:
            request: FastAPI request object.
            exc: Exception that occurred.

        Returns:
            JSONResponse: Error response.
        """
        logger.error(f"Unhandled exception: {exc}", exc_info=True)

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": (
                    str(exc) if settings.debug else "An unexpected error occurred"
                ),
                "type": type(exc).__name__,
            },
        )

    # Root endpoint
    @app.get("/")
    async def root():
        """
        Root endpoint with API information.

        Returns:
            dict: API information and available endpoints.
        """
        return {
            "message": "Resume Q&A Chatbot API",
            "version": "1.0.0",
            "docs": (
                "/docs" if settings.debug else "Documentation disabled in production"
            ),
            "endpoints": {
                "chat": "/api/chat",
                "stream_chat": "/api/chat/stream",
                "health": "/api/health",
            },
        }

    return app


# Create the app instance
app = create_app()


if __name__ == "__main__":
    """
    Run the application with uvicorn when executed directly.
    """
    settings = get_settings()

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.backend_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
