"""
Resume data models for structured data validation.

This module defines Pydantic models for resume data including
education, experience, skills, and projects.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class PersonalInfo(BaseModel):
    """Personal information model."""

    name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    location: Optional[str] = Field(None, description="Location/City")
    linkedin: Optional[str] = Field(None, description="LinkedIn URL")
    github: Optional[str] = Field(None, description="GitHub URL")
    website: Optional[str] = Field(None, description="Personal website URL")


class Education(BaseModel):
    """Education history model."""

    institution: str = Field(..., description="School/University name")
    degree: str = Field(..., description="Degree type")
    field: str = Field(..., description="Field of study")
    graduation_date: str = Field(..., description="Graduation date")
    gpa: Optional[float] = Field(None, description="GPA if applicable")
    achievements: Optional[List[str]] = Field(
        default=[], description="Academic achievements"
    )


class Experience(BaseModel):
    """Work experience model."""

    company: str = Field(..., description="Company name")
    position: str = Field(..., description="Job title/position")
    start_date: str = Field(..., description="Start date")
    end_date: Optional[str] = Field(None, description="End date, None if current")
    description: List[str] = Field(
        ..., description="Job responsibilities and achievements"
    )
    technologies: List[str] = Field(default=[], description="Technologies used")
    location: Optional[str] = Field(None, description="Work location")


class Project(BaseModel):
    """Project model."""

    name: str = Field(..., description="Project name")
    description: str = Field(..., description="Project description")
    technologies: List[str] = Field(..., description="Technologies used")
    url: Optional[str] = Field(None, description="Project URL or demo link")
    github_url: Optional[str] = Field(None, description="GitHub repository URL")
    start_date: Optional[str] = Field(None, description="Project start date")
    end_date: Optional[str] = Field(None, description="Project completion date")


class ResumeData(BaseModel):
    """Complete resume data model."""

    personal_info: PersonalInfo = Field(..., description="Personal information")
    education: List[Education] = Field(..., description="Education history")
    experience: List[Experience] = Field(..., description="Work experience")
    skills: Dict[str, List[str]] = Field(..., description="Skills by category")
    projects: List[Project] = Field(..., description="Projects portfolio")
    summary: Optional[str] = Field(None, description="Professional summary")
