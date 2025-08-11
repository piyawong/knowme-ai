"""
Unit tests for resume data tools.

Tests all custom LangChain tools for retrieving resume information
including education, experience, skills, projects, and search functionality.
"""

import pytest
import json
from unittest.mock import patch, mock_open

from backend.tools.resume_tools import (
    load_resume_data,
    get_personal_info,
    get_education,
    get_experience,
    get_skills,
    get_projects,
    search_resume,
)


# Sample test data
SAMPLE_RESUME_DATA = {
    "personal_info": {
        "name": "Test User",
        "email": "test@example.com",
        "location": "Test City",
    },
    "summary": "Test professional summary",
    "education": [
        {
            "institution": "Test University",
            "degree": "Bachelor of Science",
            "field": "Computer Science",
            "graduation_date": "2020-05",
            "gpa": 3.8,
        }
    ],
    "experience": [
        {
            "company": "Test Corp",
            "position": "Software Engineer",
            "start_date": "2020-06",
            "end_date": None,
            "description": ["Built test applications", "Led team projects"],
            "technologies": ["Python", "JavaScript"],
        }
    ],
    "skills": {
        "Programming Languages": ["Python", "JavaScript"],
        "Frameworks": ["FastAPI", "React"],
    },
    "projects": [
        {
            "name": "Test Project",
            "description": "A test project for demonstration",
            "technologies": ["Python", "FastAPI"],
            "url": "https://test-project.com",
        }
    ],
}


@pytest.fixture
def mock_resume_data():
    """Mock resume data for testing."""
    with patch(
        "backend.tools.resume_tools.load_resume_data", return_value=SAMPLE_RESUME_DATA
    ):
        yield SAMPLE_RESUME_DATA


class TestLoadResumeData:
    """Test resume data loading functionality."""

    def test_load_resume_data_success(self):
        """Test successful resume data loading."""
        mock_data = json.dumps(SAMPLE_RESUME_DATA)

        with patch("builtins.open", mock_open(read_data=mock_data)):
            with patch("os.path.isabs", return_value=True):
                with patch("os.path.exists", return_value=True):
                    result = load_resume_data()
                    assert result == SAMPLE_RESUME_DATA

    def test_load_resume_data_file_not_found(self):
        """Test file not found error handling."""
        with patch("builtins.open", side_effect=FileNotFoundError):
            with pytest.raises(FileNotFoundError, match="Resume data file not found"):
                load_resume_data()

    def test_load_resume_data_invalid_json(self):
        """Test invalid JSON error handling."""
        with patch("builtins.open", mock_open(read_data="invalid json")):
            with patch("os.path.isabs", return_value=True):
                with pytest.raises(ValueError, match="Invalid JSON"):
                    load_resume_data()


class TestPersonalInfoTool:
    """Test personal information tool."""

    @pytest.mark.asyncio
    async def test_get_personal_info_basic(self, mock_resume_data):
        """Test basic personal info retrieval."""
        result = await get_personal_info.ainvoke({})

        assert "Test User" in result
        assert "test@example.com" in result
        assert "Test City" in result
        assert "Test professional summary" in result

    @pytest.mark.asyncio
    async def test_get_personal_info_with_query(self, mock_resume_data):
        """Test personal info with query parameter."""
        result = await get_personal_info.ainvoke({"query": "contact"})

        assert "Test User" in result
        assert "test@example.com" in result


class TestEducationTool:
    """Test education tool functionality."""

    @pytest.mark.asyncio
    async def test_get_education_basic(self, mock_resume_data):
        """Test basic education retrieval."""
        result = await get_education.ainvoke({})

        assert "Test University" in result
        assert "Bachelor of Science" in result
        assert "Computer Science" in result
        assert "2020-05" in result
        assert "3.8" in result

    @pytest.mark.asyncio
    async def test_get_education_with_filter(self, mock_resume_data):
        """Test education filtering by query."""
        result = await get_education.ainvoke({"query": "Test University"})

        assert "Test University" in result
        assert "Computer Science" in result

    @pytest.mark.asyncio
    async def test_get_education_no_matches(self, mock_resume_data):
        """Test education with no matching results."""
        result = await get_education.ainvoke({"query": "Nonexistent University"})

        # Should return all education when no matches found
        assert "Test University" in result


class TestExperienceTool:
    """Test work experience tool functionality."""

    @pytest.mark.asyncio
    async def test_get_experience_basic(self, mock_resume_data):
        """Test basic experience retrieval."""
        result = await get_experience.ainvoke({})

        assert "Test Corp" in result
        assert "Software Engineer" in result
        assert "2020-06" in result
        assert "Present" in result
        assert "Built test applications" in result
        assert "Python" in result

    @pytest.mark.asyncio
    async def test_get_experience_with_company_filter(self, mock_resume_data):
        """Test experience filtering by company."""
        result = await get_experience.ainvoke({"query": "Test Corp"})

        assert "Test Corp" in result
        assert "Software Engineer" in result

    @pytest.mark.asyncio
    async def test_get_experience_with_technology_filter(self, mock_resume_data):
        """Test experience filtering by technology."""
        result = await get_experience.ainvoke({"query": "Python"})

        assert "Test Corp" in result
        assert "Python" in result


class TestSkillsTool:
    """Test skills tool functionality."""

    @pytest.mark.asyncio
    async def test_get_skills_all(self, mock_resume_data):
        """Test retrieving all skills."""
        result = await get_skills.ainvoke({})

        assert "Programming Languages: Python, JavaScript" in result
        assert "Frameworks: FastAPI, React" in result

    @pytest.mark.asyncio
    async def test_get_skills_with_category_filter(self, mock_resume_data):
        """Test skills filtering by category."""
        result = await get_skills.ainvoke({"category": "Programming"})

        assert "Programming Languages: Python, JavaScript" in result
        assert "Frameworks" not in result

    @pytest.mark.asyncio
    async def test_get_skills_no_matches(self, mock_resume_data):
        """Test skills with non-matching category."""
        result = await get_skills.ainvoke({"category": "Nonexistent Category"})

        # Should return all skills when no matches found
        assert "Programming Languages" in result
        assert "Frameworks" in result


class TestProjectsTool:
    """Test projects tool functionality."""

    @pytest.mark.asyncio
    async def test_get_projects_basic(self, mock_resume_data):
        """Test basic projects retrieval."""
        result = await get_projects.ainvoke({})

        assert "Test Project" in result
        assert "A test project for demonstration" in result
        assert "Python, FastAPI" in result
        assert "https://test-project.com" in result

    @pytest.mark.asyncio
    async def test_get_projects_with_technology_filter(self, mock_resume_data):
        """Test projects filtering by technology."""
        result = await get_projects.ainvoke({"query": "Python"})

        assert "Test Project" in result
        assert "Python" in result

    @pytest.mark.asyncio
    async def test_get_projects_with_name_filter(self, mock_resume_data):
        """Test projects filtering by name."""
        result = await get_projects.ainvoke({"query": "Test Project"})

        assert "Test Project" in result


class TestSearchTool:
    """Test search functionality across resume sections."""

    @pytest.mark.asyncio
    async def test_search_resume_basic(self, mock_resume_data):
        """Test basic resume search."""
        result = await search_resume.ainvoke({"keyword": "Python"})

        assert "EXPERIENCE:" in result or "SKILLS:" in result or "PROJECTS:" in result
        assert "Python" in result

    @pytest.mark.asyncio
    async def test_search_resume_empty_keyword(self, mock_resume_data):
        """Test search with empty keyword."""
        result = await search_resume.ainvoke({"keyword": ""})

        assert "Please provide a keyword to search for" in result

    @pytest.mark.asyncio
    async def test_search_resume_no_matches(self, mock_resume_data):
        """Test search with no matching results."""
        result = await search_resume.ainvoke({"keyword": "NonexistentKeyword"})

        assert "No information found" in result

    @pytest.mark.asyncio
    async def test_search_resume_multiple_sections(self, mock_resume_data):
        """Test search that matches multiple sections."""
        result = await search_resume.ainvoke({"keyword": "Test"})

        # Should find matches in multiple sections
        sections_found = sum(
            [
                "PERSONAL INFO:" in result,
                "EDUCATION:" in result,
                "EXPERIENCE:" in result,
                "PROJECTS:" in result,
            ]
        )
        assert sections_found >= 2
