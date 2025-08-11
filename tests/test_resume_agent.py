"""
Unit tests for the resume agent functionality.

Tests the LangChain agent behavior, conversation memory,
and response generation capabilities.
"""

import pytest
from unittest.mock import patch, MagicMock

from backend.agents.resume_agent import ResumeAgent, get_resume_agent


class TestResumeAgent:
    """Test the ResumeAgent class functionality."""

    @pytest.fixture
    def mock_openai_key(self):
        """Mock OpenAI API key environment variable."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key-123"}):
            yield

    @pytest.fixture
    def agent(self, mock_openai_key):
        """Create a test agent instance."""
        with patch("backend.agents.resume_agent.ChatOpenAI") as mock_llm:
            mock_llm.return_value = MagicMock()
            agent = ResumeAgent()
            yield agent

    def test_agent_initialization(self, mock_openai_key):
        """Test agent initializes properly with required dependencies."""
        with patch("backend.agents.resume_agent.ChatOpenAI") as mock_llm:
            with patch("backend.agents.resume_agent.create_openai_functions_agent"):
                with patch("backend.agents.resume_agent.AgentExecutor"):
                    agent = ResumeAgent()

                    # Verify LLM was created with correct parameters
                    mock_llm.assert_called_once()
                    assert agent.llm is not None
                    assert len(agent.tools) == 6  # Should have 6 resume tools
                    assert agent.agent_executor is not None

    def test_agent_initialization_no_api_key(self):
        """Test agent initialization fails without API key."""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(
                ValueError, match="OPENAI_API_KEY environment variable is required"
            ):
                ResumeAgent()

    def test_get_tools(self, agent):
        """Test that all required tools are available."""
        tools = agent._get_tools()

        assert len(tools) == 6
        tool_names = [tool.name for tool in tools]
        expected_tools = [
            "get_personal_info",
            "get_education",
            "get_experience",
            "get_skills",
            "get_projects",
            "search_resume",
        ]

        for expected_tool in expected_tools:
            assert expected_tool in tool_names

    def test_memory_management(self, agent):
        """Test conversation memory creation and management."""
        session_id = "test_session_123"

        # Get memory for new session
        memory1 = agent._get_or_create_memory(session_id)
        assert memory1 is not None
        assert session_id in agent.memory_store

        # Get same memory instance for same session
        memory2 = agent._get_or_create_memory(session_id)
        assert memory1 is memory2

        # Clear memory
        agent.clear_memory(session_id)
        assert session_id not in agent.memory_store

    @pytest.mark.asyncio
    async def test_chat_basic_functionality(self, agent):
        """Test basic chat functionality."""
        mock_result = {"output": "Test response about resume"}

        with patch.object(
            agent.agent_executor, "ainvoke", return_value=mock_result
        ) as mock_invoke:
            response = await agent.chat("Tell me about your experience", "test_session")

            assert response == "Test response about resume"
            mock_invoke.assert_called_once()

            # Check that memory was updated
            history = agent.get_session_history("test_session")
            assert len(history) == 2  # User message + AI response
            assert history[0]["type"] == "human"
            assert history[1]["type"] == "ai"

    @pytest.mark.asyncio
    async def test_chat_error_handling(self, agent):
        """Test chat error handling."""
        with patch.object(
            agent.agent_executor, "ainvoke", side_effect=Exception("Test error")
        ):
            response = await agent.chat("Test message", "test_session")

            assert "I apologize, but I encountered an error" in response
            assert "Test error" in response

            # Check that error was saved to memory
            history = agent.get_session_history("test_session")
            assert len(history) == 2
            assert "error" in history[1]["content"].lower()

    @pytest.mark.asyncio
    async def test_stream_chat_functionality(self, agent):
        """Test streaming chat functionality."""
        mock_chunks = [
            {"output": "Hello "},
            {"output": "there! "},
            {"output": "This is a test response."},
        ]

        async def mock_astream(*args, **kwargs):
            for chunk in mock_chunks:
                yield chunk

        with patch.object(agent.agent_executor, "astream", side_effect=mock_astream):
            chunks = []
            async for chunk in agent.stream_chat("Test message", "test_session"):
                chunks.append(chunk)

            assert len(chunks) == 3
            assert "".join(chunks) == "Hello there! This is a test response."

    @pytest.mark.asyncio
    async def test_stream_chat_error_handling(self, agent):
        """Test streaming chat error handling."""

        async def mock_astream_error(*args, **kwargs):
            raise Exception("Stream error")
            yield  # unreachable, but needed for generator

        with patch.object(
            agent.agent_executor, "astream", side_effect=mock_astream_error
        ):
            chunks = []
            async for chunk in agent.stream_chat("Test message", "test_session"):
                chunks.append(chunk)

            assert len(chunks) == 1
            assert "I encountered an error" in chunks[0]

    def test_get_session_history_empty(self, agent):
        """Test getting history for non-existent session."""
        history = agent.get_session_history("nonexistent_session")
        assert history == []

    def test_get_session_history_with_messages(self, agent):
        """Test getting history with existing messages."""
        session_id = "test_session"
        memory = agent._get_or_create_memory(session_id)

        # Add some messages to memory
        memory.chat_memory.add_user_message("Test question")
        memory.chat_memory.add_ai_message("Test answer")

        history = agent.get_session_history(session_id)
        assert len(history) == 2
        assert history[0]["type"] == "human"
        assert history[0]["content"] == "Test question"
        assert history[1]["type"] == "ai"
        assert history[1]["content"] == "Test answer"


class TestGlobalAgentInstance:
    """Test the global agent instance functionality."""

    def test_get_resume_agent_singleton(self, mock_openai_key):
        """Test that get_resume_agent returns singleton instance."""
        with patch("backend.agents.resume_agent.ResumeAgent") as mock_agent_class:
            mock_instance = MagicMock()
            mock_agent_class.return_value = mock_instance

            # First call should create instance
            agent1 = get_resume_agent()
            assert agent1 is mock_instance
            mock_agent_class.assert_called_once()

            # Second call should return same instance
            agent2 = get_resume_agent()
            assert agent2 is mock_instance
            assert agent1 is agent2
            # Agent class should still only be called once
            assert mock_agent_class.call_count == 1

    @pytest.mark.asyncio
    async def test_create_resume_agent_factory(self, mock_openai_key):
        """Test the async agent factory function."""
        from backend.agents.resume_agent import create_resume_agent

        with patch("backend.agents.resume_agent.ResumeAgent") as mock_agent_class:
            mock_instance = MagicMock()
            mock_agent_class.return_value = mock_instance

            agent = await create_resume_agent()
            assert agent is mock_instance
            mock_agent_class.assert_called_once()
