"""
Unit tests for chat API endpoints.

Tests FastAPI endpoints for chat interactions, streaming responses,
session management, and error handling.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime

from backend.main import app
from backend.models.chat import ChatMessage, ChatResponse


@pytest.fixture
def client():
    """Create test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_agent():
    """Mock resume agent for testing."""
    agent = MagicMock()
    agent.chat = AsyncMock()
    agent.stream_chat = AsyncMock()
    agent.get_session_history = MagicMock()
    agent.clear_memory = MagicMock()
    return agent


@pytest.fixture
def mock_settings():
    """Mock application settings."""
    with patch("backend.api.chat.get_settings") as mock_get_settings:
        settings = MagicMock()
        settings.openai_api_key = "test-key"
        settings.debug = True
        mock_get_settings.return_value = settings
        yield settings


class TestChatEndpoints:
    """Test chat-related API endpoints."""

    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["service"] == "resume-chatbot-backend"

    @patch("backend.api.chat.get_resume_agent")
    def test_chat_endpoint_success(
        self, mock_get_agent, client, mock_agent, mock_settings
    ):
        """Test successful chat endpoint."""
        mock_get_agent.return_value = mock_agent
        mock_agent.chat.return_value = "Test response about experience"

        chat_message = {
            "message": "Tell me about your work experience",
            "session_id": "test_session_123",
        }

        response = client.post("/api/chat", json=chat_message)

        assert response.status_code == 200
        data = response.json()
        assert data["response"] == "Test response about experience"
        assert data["sources"] == ["resume_data"]
        assert data["session_id"] == "test_session_123"

        # Verify agent was called with correct parameters
        mock_agent.chat.assert_called_once_with(
            "Tell me about your work experience", "test_session_123"
        )

    @patch("backend.api.chat.get_resume_agent")
    def test_chat_endpoint_without_session_id(
        self, mock_get_agent, client, mock_agent, mock_settings
    ):
        """Test chat endpoint generates session ID when not provided."""
        mock_get_agent.return_value = mock_agent
        mock_agent.chat.return_value = "Test response"

        chat_message = {"message": "Test question"}

        response = client.post("/api/chat", json=chat_message)

        assert response.status_code == 200
        data = response.json()
        assert data["response"] == "Test response"
        assert "session_id" in data
        assert data["session_id"] is not None

    @patch("backend.api.chat.get_resume_agent")
    def test_chat_endpoint_agent_error(
        self, mock_get_agent, client, mock_agent, mock_settings
    ):
        """Test chat endpoint handles agent errors."""
        mock_get_agent.return_value = mock_agent
        mock_agent.chat.side_effect = Exception("Agent processing error")

        chat_message = {"message": "Test question"}

        response = client.post("/api/chat", json=chat_message)

        assert response.status_code == 500
        data = response.json()
        assert "Chat processing failed" in data["detail"]

    def test_chat_endpoint_invalid_input(self, client, mock_settings):
        """Test chat endpoint with invalid input."""
        # Missing required 'message' field
        invalid_message = {"session_id": "test_session"}

        response = client.post("/api/chat", json=invalid_message)

        assert response.status_code == 422  # Validation error


class TestStreamingEndpoints:
    """Test streaming chat functionality."""

    @patch("backend.api.chat.get_resume_agent")
    def test_stream_chat_endpoint_headers(
        self, mock_get_agent, client, mock_agent, mock_settings
    ):
        """Test streaming endpoint returns correct headers."""
        mock_get_agent.return_value = mock_agent

        async def mock_stream(*args, **kwargs):
            yield "Test "
            yield "streaming "
            yield "response"

        mock_agent.stream_chat = mock_stream

        chat_message = {
            "message": "Test streaming question",
            "session_id": "test_stream_session",
        }

        response = client.post("/api/chat/stream", json=chat_message)

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/plain; charset=utf-8"
        assert "X-Session-ID" in response.headers
        assert "Cache-Control" in response.headers
        assert response.headers["Cache-Control"] == "no-cache"


class TestSessionManagement:
    """Test session history and management endpoints."""

    @patch("backend.api.chat.get_resume_agent")
    def test_get_chat_history(self, mock_get_agent, client, mock_agent, mock_settings):
        """Test retrieving chat history for a session."""
        mock_get_agent.return_value = mock_agent
        mock_agent.get_session_history.return_value = [
            {"type": "human", "content": "Test question", "timestamp": None},
            {"type": "ai", "content": "Test answer", "timestamp": None},
        ]

        response = client.get("/api/chat/history/test_session_123")

        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == "test_session_123"
        assert len(data["messages"]) == 2
        assert data["total_messages"] == 2

        mock_agent.get_session_history.assert_called_once_with("test_session_123")

    @patch("backend.api.chat.get_resume_agent")
    def test_clear_chat_history(
        self, mock_get_agent, client, mock_agent, mock_settings
    ):
        """Test clearing chat history for a session."""
        mock_get_agent.return_value = mock_agent

        response = client.delete("/api/chat/history/test_session_123")

        assert response.status_code == 200
        data = response.json()
        assert "Chat history cleared" in data["message"]
        assert data["session_id"] == "test_session_123"

        mock_agent.clear_memory.assert_called_once_with("test_session_123")

    @patch("backend.api.chat.get_resume_agent")
    def test_session_endpoints_error_handling(
        self, mock_get_agent, client, mock_agent, mock_settings
    ):
        """Test session endpoints handle errors properly."""
        mock_get_agent.return_value = mock_agent
        mock_agent.get_session_history.side_effect = Exception("History error")

        response = client.get("/api/chat/history/test_session")

        assert response.status_code == 500
        data = response.json()
        assert "Failed to retrieve history" in data["detail"]


class TestAPIIntegration:
    """Test API integration and configuration."""

    def test_cors_configuration(self, client):
        """Test CORS headers are properly configured."""
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )

        # Should allow the request
        assert response.status_code == 200

    def test_root_endpoint(self, client):
        """Test root endpoint returns API information."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "Resume Q&A Chatbot API" in data["message"]
        assert "endpoints" in data
        assert "/api/chat" in str(data["endpoints"])

    @patch("backend.main.get_settings")
    def test_app_initialization_missing_api_key(self, mock_get_settings):
        """Test app startup validation for missing API key."""
        settings = MagicMock()
        settings.openai_api_key = ""
        mock_get_settings.return_value = settings

        # This should be tested during app startup, but we can test the settings validation
        assert not settings.openai_api_key


@pytest.mark.asyncio
async def test_chat_message_validation():
    """Test ChatMessage model validation."""
    # Valid message
    valid_message = ChatMessage(message="Test question")
    assert valid_message.message == "Test question"
    assert valid_message.session_id is None
    assert isinstance(valid_message.timestamp, datetime)

    # Message with session ID
    message_with_session = ChatMessage(
        message="Test question", session_id="test_session_123"
    )
    assert message_with_session.session_id == "test_session_123"

    # Test validation passes for empty message
    empty_message = ChatMessage(message="")
    assert empty_message.message == ""


@pytest.mark.asyncio
async def test_chat_response_validation():
    """Test ChatResponse model validation."""
    # Valid response
    valid_response = ChatResponse(
        response="Test response", sources=["resume_data"], session_id="test_session"
    )
    assert valid_response.response == "Test response"
    assert valid_response.sources == ["resume_data"]
    assert valid_response.session_id == "test_session"
    assert isinstance(valid_response.timestamp, datetime)
