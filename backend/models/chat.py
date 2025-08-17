"""
Chat interaction models for the resume Q&A system.

This module defines Pydantic models for chat messages, responses,
and conversation management.
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Incoming chat message model."""

    message: str = Field(..., description="User's message/question")
    session_id: Optional[str] = Field(
        None, description="Session identifier for conversation context"
    )
    origin: Optional[str] = Field(
        None, description="Origin domain for CORS logging"
    )
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Message timestamp"
    )


class ChatResponse(BaseModel):
    """Chat response model."""

    response: str = Field(..., description="Agent's response")
    sources: List[str] = Field(
        default=[], description="Resume sections used to generate response"
    )
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Response timestamp"
    )
    session_id: Optional[str] = Field(None, description="Session identifier")


class ChatStreamChunk(BaseModel):
    """Streaming response chunk model."""

    content: str = Field(..., description="Partial response content")
    is_complete: bool = Field(False, description="Whether this is the final chunk")
    sources: Optional[List[str]] = Field(None, description="Sources if final chunk")


class ConversationContext(BaseModel):
    """Conversation context for memory management."""

    session_id: str = Field(..., description="Unique session identifier")
    messages: List[dict] = Field(default=[], description="Message history")
    created_at: datetime = Field(
        default_factory=datetime.now, description="Session creation time"
    )
    last_activity: datetime = Field(
        default_factory=datetime.now, description="Last activity timestamp"
    )
