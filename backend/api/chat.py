"""
Chat API endpoints for the resume Q&A system.

This module provides FastAPI endpoints for chat interactions with
streaming responses and proper CORS configuration.
"""

import uuid
from typing import AsyncIterator
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer
from datetime import datetime

from ..models.chat import ChatMessage, ChatResponse, ChatStreamChunk
from ..agents.resume_agent import get_resume_agent, ResumeAgent
from ..config import Settings, get_settings

# Create router for chat endpoints
router = APIRouter(prefix="/api", tags=["chat"])

# Optional security for API keys (not required for this demo)
security = HTTPBearer(auto_error=False)


async def stream_chat_response(
    message: str, session_id: str, agent: ResumeAgent
) -> AsyncIterator[str]:
    """
    Generate streaming response from the resume agent.

    Args:
        message: User's message.
        session_id: Session identifier.
        agent: Resume agent instance.

    Yields:
        str: Server-Sent Events formatted response chunks.
    """
    try:
        response_parts = []

        # Stream response from agent
        async for chunk in agent.stream_chat(message, session_id):
            response_parts.append(chunk)

            # Create stream chunk
            stream_chunk = ChatStreamChunk(content=chunk, is_complete=False)

            # Format as Server-Sent Events
            yield f"data: {stream_chunk.model_dump_json()}\n\n"

        # Send final completion chunk
        final_chunk = ChatStreamChunk(
            content="",
            is_complete=True,
            sources=["resume_data"],  # Indicate data source
        )
        yield f"data: {final_chunk.model_dump_json()}\n\n"

    except Exception as e:
        # Send error chunk
        error_chunk = ChatStreamChunk(content=f"Error: {str(e)}", is_complete=True)
        yield f"data: {error_chunk.model_dump_json()}\n\n"


@router.post("/chat/stream")
async def stream_chat_endpoint(
    chat_message: ChatMessage, settings: Settings = Depends(get_settings)
) -> StreamingResponse:
    """
    Stream chat responses from the resume agent.

    Args:
        chat_message: Incoming chat message.
        settings: Application settings.

    Returns:
        StreamingResponse: Streaming response with Server-Sent Events.
    """
    try:
        # Validate message field
        if not chat_message.message:
            raise HTTPException(status_code=400, detail="Message field is required")
        
        # Log origin for CORS debugging
        if chat_message.origin:
            print(f"Widget request from origin: {chat_message.origin}")
        
        # Get or create session ID
        session_id = chat_message.session_id or str(uuid.uuid4())

        # Get agent instance
        agent = get_resume_agent()

        # Create streaming response
        return StreamingResponse(
            stream_chat_response(chat_message.message, session_id, agent),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Session-ID": session_id,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.post("/chat")
async def chat_endpoint(
    chat_message: ChatMessage, settings: Settings = Depends(get_settings)
) -> ChatResponse:
    """
    Non-streaming chat endpoint for simple interactions.

    Args:
        chat_message: Incoming chat message.
        settings: Application settings.

    Returns:
        ChatResponse: Complete chat response.
    """
    try:
        # Validate message field
        if not chat_message.message:
            raise HTTPException(status_code=400, detail="Message field is required")
        
        # Get or create session ID
        session_id = chat_message.session_id or str(uuid.uuid4())

        # Get agent instance
        agent = get_resume_agent()

        # Get response from agent
        response = await agent.chat(chat_message.message, session_id)

        return ChatResponse(
            response=response, sources=["resume_data"], session_id=session_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.get("/chat/history/{session_id}")
async def get_chat_history(
    session_id: str, settings: Settings = Depends(get_settings)
) -> dict:
    """
    Get conversation history for a specific session.

    Args:
        session_id: Session identifier.
        settings: Application settings.

    Returns:
        dict: Conversation history.
    """
    try:
        agent = get_resume_agent()
        history = agent.get_session_history(session_id)

        return {
            "session_id": session_id,
            "messages": history,
            "total_messages": len(history),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve history: {str(e)}"
        )


@router.delete("/chat/history/{session_id}")
async def clear_chat_history(
    session_id: str, settings: Settings = Depends(get_settings)
) -> dict:
    """
    Clear conversation history for a specific session.

    Args:
        session_id: Session identifier.
        settings: Application settings.

    Returns:
        dict: Confirmation message.
    """
    try:
        agent = get_resume_agent()
        agent.clear_memory(session_id)

        return {
            "message": f"Chat history cleared for session {session_id}",
            "session_id": session_id,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to clear history: {str(e)}"
        )


@router.get("/health")
async def health_check() -> dict:
    """
    Health check endpoint for monitoring.

    Returns:
        dict: Health status information.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "resume-chatbot-backend",
    }
