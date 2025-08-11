"""
Resume data retrieval tools for LangChain agent.

This module provides custom tools that allow the agent to access
specific sections of resume data to answer user questions.
"""

import json
import os
from typing import Dict, Optional
from langchain_core.tools import tool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def load_resume_data() -> Dict:
    """
    Load resume data from JSON file.

    Returns:
        Dict: Parsed resume data.
    """
    resume_path = os.getenv("RESUME_DATA_PATH", "./backend/data/resume.json")

    # Handle relative path from current working directory
    if not os.path.isabs(resume_path):
        current_dir = os.getcwd()
        resume_path = os.path.join(current_dir, resume_path)

    try:
        with open(resume_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        raise FileNotFoundError(f"Resume data file not found at {resume_path}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in resume data file: {e}")


@tool
async def get_personal_info(query: Optional[str] = None) -> str:
    """
    Get personal information from resume including name, contact details, and professional summary.

    Args:
        query: Optional filter for specific personal info (e.g., "contact", "summary")

    Returns:
        str: Formatted personal information.
    """
    resume_data = load_resume_data()
    personal_info = resume_data["personal_info"]
    summary = resume_data.get("summary", "")

    result = []

    # Include contact information
    result.append(f"Name: {personal_info['name']}")
    result.append(f"Location: {personal_info.get('location', 'Not specified')}")
    result.append(f"Email: {personal_info['email']}")

    if personal_info.get("phone"):
        result.append(f"Phone: {personal_info['phone']}")
    if personal_info.get("linkedin"):
        result.append(f"LinkedIn: {personal_info['linkedin']}")
    if personal_info.get("github"):
        result.append(f"GitHub: {personal_info['github']}")
    if personal_info.get("website"):
        result.append(f"Website: {personal_info['website']}")

    # Include professional summary
    if summary:
        result.append(f"\nProfessional Summary:\n{summary}")

    return "\n".join(result)


@tool
async def get_education(query: Optional[str] = None) -> str:
    """
    Get education history from resume including degrees, institutions, and achievements.

    Args:
        query: Optional filter for specific institutions, degrees, or fields

    Returns:
        str: Formatted education information.
    """
    resume_data = load_resume_data()
    education_list = resume_data["education"]

    # Filter by query if provided
    if query and query.strip():
        query_lower = query.lower()
        filtered_education = []
        for edu in education_list:
            if (
                query_lower in edu["institution"].lower()
                or query_lower in edu["degree"].lower()
                or query_lower in edu["field"].lower()
            ):
                filtered_education.append(edu)
        education_list = filtered_education if filtered_education else education_list

    result = []
    for edu in education_list:
        edu_info = [
            f"Institution: {edu['institution']}",
            f"Degree: {edu['degree']} in {edu['field']}",
            f"Graduation: {edu['graduation_date']}",
        ]

        if edu.get("gpa"):
            edu_info.append(f"GPA: {edu['gpa']}")

        if edu.get("achievements"):
            edu_info.append(f"Achievements: {', '.join(edu['achievements'])}")

        result.append("\n".join(edu_info))

    return "\n\n".join(result)


@tool
async def get_experience(query: Optional[str] = None) -> str:
    """
    Get work experience from resume including companies, positions, and accomplishments.

    Args:
        query: Optional filter for specific companies, positions, or technologies

    Returns:
        str: Formatted work experience information.
    """
    resume_data = load_resume_data()
    experience_list = resume_data["experience"]

    # Filter by query if provided
    if query and query.strip():
        query_lower = query.lower()
        filtered_experience = []
        for exp in experience_list:
            if (
                query_lower in exp["company"].lower()
                or query_lower in exp["position"].lower()
                or any(
                    query_lower in tech.lower() for tech in exp.get("technologies", [])
                )
            ):
                filtered_experience.append(exp)
        experience_list = (
            filtered_experience if filtered_experience else experience_list
        )

    result = []
    for exp in experience_list:
        exp_info = [
            f"Company: {exp['company']}",
            f"Position: {exp['position']}",
            f"Duration: {exp['start_date']} - {exp['end_date'] or 'Present'}",
        ]

        if exp.get("location"):
            exp_info.append(f"Location: {exp['location']}")

        exp_info.append("Key Accomplishments:")
        for desc in exp["description"]:
            exp_info.append(f"• {desc}")

        if exp.get("technologies"):
            exp_info.append(f"Technologies: {', '.join(exp['technologies'])}")

        result.append("\n".join(exp_info))

    return "\n\n".join(result)


@tool
async def get_skills(category: Optional[str] = None) -> str:
    """
    Get skills from resume organized by categories.

    Args:
        category: Optional filter for specific skill category (e.g., "programming", "web", "cloud")

    Returns:
        str: Formatted skills information.
    """
    resume_data = load_resume_data()
    skills_dict = resume_data["skills"]

    # Filter by category if provided
    if category and category.strip():
        category_lower = category.lower()
        filtered_skills = {}
        for skill_category, skills_list in skills_dict.items():
            if category_lower in skill_category.lower():
                filtered_skills[skill_category] = skills_list
        skills_dict = filtered_skills if filtered_skills else skills_dict

    result = []
    for skill_category, skills_list in skills_dict.items():
        result.append(f"{skill_category}: {', '.join(skills_list)}")

    return "\n".join(result)


@tool
async def get_projects(query: Optional[str] = None) -> str:
    """
    Get project portfolio from resume including descriptions, technologies, and links.

    Args:
        query: Optional filter for specific projects, technologies, or keywords

    Returns:
        str: Formatted projects information.
    """
    resume_data = load_resume_data()
    projects_list = resume_data["projects"]

    # Filter by query if provided
    if query and query.strip():
        query_lower = query.lower()
        filtered_projects = []
        for project in projects_list:
            if (
                query_lower in project["name"].lower()
                or query_lower in project["description"].lower()
                or any(query_lower in tech.lower() for tech in project["technologies"])
            ):
                filtered_projects.append(project)
        projects_list = filtered_projects if filtered_projects else projects_list

    result = []
    for project in projects_list:
        project_info = [
            f"Project: {project['name']}",
            f"Description: {project['description']}",
            f"Technologies: {', '.join(project['technologies'])}",
        ]

        if project.get("url"):
            project_info.append(f"Live Demo: {project['url']}")
        if project.get("github_url"):
            project_info.append(f"GitHub: {project['github_url']}")
        if project.get("start_date") and project.get("end_date"):
            project_info.append(
                f"Timeline: {project['start_date']} - {project['end_date']}"
            )

        result.append("\n".join(project_info))

    return "\n\n".join(result)


@tool
async def search_resume(keyword: str) -> str:
    """
    Search across all resume sections for a specific keyword or phrase.

    Args:
        keyword: Keyword or phrase to search for across resume data

    Returns:
        str: Relevant information from all resume sections containing the keyword.
    """
    if not keyword or not keyword.strip():
        return "Please provide a keyword to search for."

    resume_data = load_resume_data()
    keyword_lower = keyword.lower()
    results = []

    # Search in personal info and summary
    personal_info = resume_data["personal_info"]
    summary = resume_data.get("summary", "")
    if (
        any(keyword_lower in str(value).lower() for value in personal_info.values())
        or keyword_lower in summary.lower()
    ):
        results.append("PERSONAL INFO:")
        results.append(await get_personal_info.ainvoke({}))

    # Search in education
    for edu in resume_data["education"]:
        if any(
            keyword_lower in str(value).lower()
            for value in edu.values()
            if isinstance(value, (str, list))
        ):
            if "EDUCATION:" not in results:
                results.append("EDUCATION:")
                results.append(await get_education.ainvoke({}))
            break

    # Search in experience
    for exp in resume_data["experience"]:
        exp_text = " ".join(
            [str(value) for value in exp.values() if isinstance(value, (str, list))]
        )
        if keyword_lower in exp_text.lower():
            if "EXPERIENCE:" not in results:
                results.append("EXPERIENCE:")
                results.append(await get_experience.ainvoke({}))
            break

    # Search in skills
    for category, skills_list in resume_data["skills"].items():
        if keyword_lower in category.lower() or any(
            keyword_lower in skill.lower() for skill in skills_list
        ):
            if "SKILLS:" not in results:
                results.append("SKILLS:")
                results.append(await get_skills.ainvoke({}))
            break

    # Search in projects
    for project in resume_data["projects"]:
        project_text = " ".join(
            [str(value) for value in project.values() if isinstance(value, (str, list))]
        )
        if keyword_lower in project_text.lower():
            if "PROJECTS:" not in results:
                results.append("PROJECTS:")
                results.append(await get_projects.ainvoke({}))
            break

    if not results:
        return f"No information found related to '{keyword}' in the resume."

    return "\n\n".join(results)
