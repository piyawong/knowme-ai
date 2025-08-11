"""
Integration tests for the complete resume chatbot system.

Tests end-to-end functionality including agent tool usage,
API integration, and full conversation flows.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from backend.agents.resume_agent import ResumeAgent
from backend.tools.resume_tools import load_resume_data


class TestEndToEndIntegration:
    """Test complete system integration."""

    @pytest.fixture
    def mock_openai_key(self):
        """Mock OpenAI API key for testing."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key-123"}):
            yield

    @pytest.fixture
    def mock_resume_data(self):
        """Mock resume data loading."""
        sample_data = {
            "personal_info": {"name": "Alex Johnson", "email": "alex@example.com"},
            "summary": "Experienced software engineer",
            "education": [
                {
                    "institution": "Stanford University",
                    "degree": "Master of Science",
                    "field": "Computer Science",
                    "graduation_date": "2019-06",
                }
            ],
            "experience": [
                {
                    "company": "TechCorp Inc.",
                    "position": "Senior Software Engineer",
                    "start_date": "2021-03",
                    "end_date": None,
                    "description": ["Built scalable systems"],
                    "technologies": ["Python", "FastAPI"],
                }
            ],
            "skills": {
                "Programming Languages": ["Python", "JavaScript", "TypeScript"],
                "Web Frameworks": ["FastAPI", "React", "Next.js"],
            },
            "projects": [
                {
                    "name": "AI Code Review Assistant",
                    "description": "AI-powered code review tool",
                    "technologies": ["Python", "FastAPI", "OpenAI API"],
                }
            ],
        }

        with patch(
            "backend.tools.resume_tools.load_resume_data", return_value=sample_data
        ):
            yield sample_data

    def test_resume_data_loading_integration(self, mock_resume_data):
        """Test that resume data loads properly across the system."""
        data = load_resume_data()

        # Verify all required sections are present
        assert "personal_info" in data
        assert "education" in data
        assert "experience" in data
        assert "skills" in data
        assert "projects" in data

        # Verify data structure matches expected format
        assert data["personal_info"]["name"] == "Alex Johnson"
        assert len(data["education"]) > 0
        assert len(data["experience"]) > 0
        assert len(data["skills"]) > 0
        assert len(data["projects"]) > 0

    @pytest.mark.asyncio
    async def test_agent_tool_integration(self, mock_openai_key, mock_resume_data):
        """Test that agent can properly use resume tools."""
        from backend.tools.resume_tools import get_experience, get_skills, search_resume

        # Test individual tools work
        experience_result = await get_experience.ainvoke({})
        assert "TechCorp Inc." in experience_result
        assert "Senior Software Engineer" in experience_result
        assert "Python" in experience_result

        skills_result = await get_skills.ainvoke({})
        assert "Programming Languages" in skills_result
        assert "Python" in skills_result

        search_result = await search_resume.ainvoke({"keyword": "Python"})
        assert "Python" in search_result

    @pytest.mark.asyncio
    async def test_full_chat_flow_programming_question(
        self, mock_openai_key, mock_resume_data
    ):
        """Test complete question -> agent -> response flow for programming skills."""
        with patch("backend.agents.resume_agent.ChatOpenAI"):
            with patch("backend.agents.resume_agent.create_openai_functions_agent"):
                with patch("backend.agents.resume_agent.AgentExecutor") as mock_executor:

                    # Mock agent response
                    mock_agent_instance = MagicMock()
                    mock_agent_instance.ainvoke = AsyncMock(
                        return_value={
                            "output": "Alex knows Python, JavaScript, and TypeScript. He uses Python extensively for backend development with FastAPI and has experience with web frameworks like React and Next.js."
                        }
                    )
                    mock_executor.return_value = mock_agent_instance

                    # Create agent and test
                    agent = ResumeAgent()
                    response = await agent.chat(
                        "What programming languages do you know?", "test_session"
                    )

                    assert "Python" in response
                    assert "JavaScript" in response or "TypeScript" in response

    @pytest.mark.asyncio
    async def test_full_chat_flow_experience_question(
        self, mock_openai_key, mock_resume_data
    ):
        """Test complete question -> agent -> response flow for work experience."""
        with patch("backend.agents.resume_agent.ChatOpenAI"):
            with patch("backend.agents.resume_agent.create_openai_functions_agent"):
                with patch("backend.agents.resume_agent.AgentExecutor") as mock_executor:

                    # Mock agent response
                    mock_agent_instance = MagicMock()
                    mock_agent_instance.ainvoke = AsyncMock(
                        return_value={
                            "output": "Alex is currently a Senior Software Engineer at TechCorp Inc. since March 2021, where he builds scalable systems using Python and FastAPI."
                        }
                    )
                    mock_executor.return_value = mock_agent_instance

                    # Create agent and test
                    agent = ResumeAgent()
                    response = await agent.chat(
                        "Tell me about your current job", "test_session"
                    )

                    assert "TechCorp Inc." in response
                    assert "Senior Software Engineer" in response

    @pytest.mark.asyncio
    async def test_conversation_memory_persistence(
        self, mock_openai_key, mock_resume_data
    ):
        """Test that conversation memory persists across multiple exchanges."""
        with patch("backend.agents.resume_agent.ChatOpenAI"):
            with patch("backend.agents.resume_agent.create_openai_functions_agent"):
                with patch("backend.agents.resume_agent.AgentExecutor") as mock_executor:

                    # Mock agent responses
                    mock_agent_instance = MagicMock()
                    responses = [
                        {
                            "output": "I have experience with Python, JavaScript, and TypeScript."
                        },
                        {
                            "output": "Among those languages, I use Python the most for backend development."
                        },
                    ]
                    mock_agent_instance.ainvoke = AsyncMock(side_effect=responses)
                    mock_executor.return_value = mock_agent_instance

                    # Create agent and have a conversation
                    agent = ResumeAgent()
                    session_id = "memory_test_session"

                    # First question
                    response1 = await agent.chat(
                        "What programming languages do you know?", session_id
                    )
                    assert "Python" in response1

                    # Follow-up question (should have context)
                    response2 = await agent.chat(
                        "Which one do you use the most?", session_id
                    )
                    assert "Python" in response2

                    # Verify memory contains both exchanges
                    history = agent.get_session_history(session_id)
                    assert len(history) == 4  # 2 questions + 2 responses
                    assert history[0]["type"] == "human"
                    assert history[1]["type"] == "ai"
                    assert history[2]["type"] == "human"
                    assert history[3]["type"] == "ai"


class TestToolIntegration:
    """Test integration between tools and data models."""

    @pytest.mark.asyncio
    async def test_tools_return_valid_data_format(self, mock_resume_data):
        """Test that all tools return properly formatted data."""
        from backend.tools.resume_tools import (
            get_personal_info,
            get_education,
            get_experience,
            get_skills,
            get_projects,
        )

        # Test each tool returns string data
        personal_result = await get_personal_info.ainvoke({})
        assert isinstance(personal_result, str)
        assert len(personal_result) > 0

        education_result = await get_education.ainvoke({})
        assert isinstance(education_result, str)
        assert "Stanford University" in education_result

        experience_result = await get_experience.ainvoke({})
        assert isinstance(experience_result, str)
        assert "TechCorp Inc." in experience_result

        skills_result = await get_skills.ainvoke({})
        assert isinstance(skills_result, str)
        assert "Python" in skills_result

        projects_result = await get_projects.ainvoke({})
        assert isinstance(projects_result, str)
        assert "AI Code Review Assistant" in projects_result

    @pytest.mark.asyncio
    async def test_tools_with_filters(self, mock_resume_data):
        """Test that tools properly handle query filters."""
        from backend.tools.resume_tools import get_experience, get_skills, get_projects

        # Test experience filtering
        exp_result = await get_experience.ainvoke({"query": "TechCorp"})
        assert "TechCorp Inc." in exp_result

        # Test skills filtering
        skills_result = await get_skills.ainvoke({"category": "Programming"})
        assert "Programming Languages" in skills_result

        # Test projects filtering
        projects_result = await get_projects.ainvoke({"query": "AI"})
        assert "AI Code Review Assistant" in projects_result

    def test_resume_data_model_compatibility(self, mock_resume_data):
        """Test that resume data is compatible with Pydantic models."""
        from backend.models.resume import ResumeData

        # This should not raise validation errors
        resume_model = ResumeData(**mock_resume_data)

        assert resume_model.personal_info.name == "Alex Johnson"
        assert len(resume_model.education) == 1
        assert len(resume_model.experience) == 1
        assert len(resume_model.skills) >= 2
        assert len(resume_model.projects) == 1


class TestErrorHandling:
    """Test system-wide error handling and resilience."""

    @pytest.mark.asyncio
    async def test_tool_error_handling(self):
        """Test that tools handle missing data gracefully."""
        with patch(
            "backend.tools.resume_tools.load_resume_data",
            side_effect=FileNotFoundError("File not found"),
        ):
            from backend.tools.resume_tools import get_experience

            with pytest.raises(FileNotFoundError):
                await get_experience.ainvoke({})

    @pytest.mark.asyncio
    async def test_agent_error_recovery(self, mock_openai_key):
        """Test that agent handles tool errors gracefully."""
        with patch("backend.agents.resume_agent.ChatOpenAI"):
            with patch("backend.agents.resume_agent.create_openai_functions_agent"):
                with patch("backend.agents.resume_agent.AgentExecutor") as mock_executor:

                    # Mock agent that raises an error
                    mock_agent_instance = MagicMock()
                    mock_agent_instance.ainvoke = AsyncMock(
                        side_effect=Exception("Tool error")
                    )
                    mock_executor.return_value = mock_agent_instance

                    # Create agent and test error handling
                    agent = ResumeAgent()
                    response = await agent.chat("Test question", "test_session")

                    # Should return error message, not raise exception
                    assert "I apologize, but I encountered an error" in response
                    assert "Tool error" in response
