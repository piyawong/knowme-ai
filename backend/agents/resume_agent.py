"""
LangChain resume agent for handling Q&A about resume content.

This module creates and manages a conversational agent that can answer
questions about resume data using custom tools and maintain conversation context.
"""

import os
from typing import Dict, AsyncIterator
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv

from ..tools.resume_tools import (
    get_personal_info,
    get_education,
    get_experience,
    get_skills,
    get_projects,
    search_resume,
)
from .prompts import RESUME_AGENT_SYSTEM_PROMPT

# Load environment variables
load_dotenv()


class ResumeAgent:
    """
    Resume Q&A agent with conversation memory and custom tools.
    """

    def __init__(self):
        """Initialize the resume agent with tools and memory."""
        self.llm = self._create_llm()
        self.tools = self._get_tools()
        self.memory_store: Dict[str, ConversationBufferMemory] = {}
        self.agent_executor = self._create_agent()

    def _create_llm(self) -> ChatOpenAI:
        """
        Create ChatOpenAI instance with streaming support.

        Returns:
            ChatOpenAI: Configured LLM instance.
        """
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        return ChatOpenAI(
            model="gpt-4o-mini", api_key=api_key, streaming=True, temperature=0.7
        )

    def _get_tools(self) -> list:
        """
        Get list of available resume tools.

        Returns:
            list: List of LangChain tools.
        """
        return [
            get_personal_info,
            get_education,
            get_experience,
            get_skills,
            get_projects,
            search_resume,
        ]

    def _create_agent(self) -> AgentExecutor:
        """
        Create the LangChain agent with tools and prompts.

        Returns:
            AgentExecutor: Configured agent executor.
        """
        # Create prompt template with system message and conversation memory
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", RESUME_AGENT_SYSTEM_PROMPT),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )

        # Create agent
        agent = create_openai_functions_agent(
            llm=self.llm, tools=self.tools, prompt=prompt
        )

        # Create agent executor with error handling
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=3,
        )

    def _get_or_create_memory(self, session_id: str) -> ConversationBufferMemory:
        """
        Get or create conversation memory for a session.

        Args:
            session_id: Unique session identifier.

        Returns:
            ConversationBufferMemory: Memory instance for the session.
        """
        if session_id not in self.memory_store:
            self.memory_store[session_id] = ConversationBufferMemory(
                memory_key="chat_history", return_messages=True
            )
        return self.memory_store[session_id]

    async def chat(self, message: str, session_id: str = "default") -> str:
        """
        Process a chat message and return the agent's response.

        Args:
            message: User's message/question.
            session_id: Session identifier for conversation context.

        Returns:
            str: Agent's response.
        """
        # Get conversation memory for this session
        memory = self._get_or_create_memory(session_id)

        # Get chat history from memory
        chat_history = memory.chat_memory.messages

        # Execute agent with context
        try:
            result = await self.agent_executor.ainvoke(
                {"input": message, "chat_history": chat_history}
            )

            response = result["output"]

            # Save conversation to memory
            memory.chat_memory.add_user_message(message)
            memory.chat_memory.add_ai_message(response)

            return response

        except Exception as e:
            error_msg = f"I apologize, but I encountered an error processing your question: {str(e)}. Please try rephrasing your question or ask about a specific aspect of the resume."

            # Still save to memory for context
            memory.chat_memory.add_user_message(message)
            memory.chat_memory.add_ai_message(error_msg)

            return error_msg

    async def stream_chat(
        self, message: str, session_id: str = "default"
    ) -> AsyncIterator[str]:
        """
        Stream chat responses in real-time.

        Args:
            message: User's message/question.
            session_id: Session identifier for conversation context.

        Yields:
            str: Partial response chunks.
        """
        # Get conversation memory for this session
        memory = self._get_or_create_memory(session_id)
        chat_history = memory.chat_memory.messages

        try:
            # Stream the agent's response
            response_chunks = []
            async for chunk in self.agent_executor.astream(
                {"input": message, "chat_history": chat_history}
            ):
                if "output" in chunk:
                    content = chunk["output"]
                    response_chunks.append(content)
                    yield content

            # Save full conversation to memory
            full_response = "".join(response_chunks)
            memory.chat_memory.add_user_message(message)
            memory.chat_memory.add_ai_message(full_response)

        except Exception as e:
            error_msg = f"I encountered an error: {str(e)}. Please try again."
            memory.chat_memory.add_user_message(message)
            memory.chat_memory.add_ai_message(error_msg)
            yield error_msg

    def clear_memory(self, session_id: str) -> None:
        """
        Clear conversation memory for a specific session.

        Args:
            session_id: Session identifier to clear.
        """
        if session_id in self.memory_store:
            del self.memory_store[session_id]

    def get_session_history(self, session_id: str) -> list:
        """
        Get conversation history for a session.

        Args:
            session_id: Session identifier.

        Returns:
            list: List of messages in the conversation.
        """
        if session_id not in self.memory_store:
            return []

        memory = self.memory_store[session_id]
        return [
            {
                "type": "human" if isinstance(msg, HumanMessage) else "ai",
                "content": msg.content,
                "timestamp": getattr(msg, "timestamp", None),
            }
            for msg in memory.chat_memory.messages
        ]


# Global agent instance
_agent_instance = None


def get_resume_agent() -> ResumeAgent:
    """
    Get or create the global resume agent instance.

    Returns:
        ResumeAgent: The agent instance.
    """
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = ResumeAgent()
    return _agent_instance


async def create_resume_agent() -> ResumeAgent:
    """
    Async factory function to create a new resume agent.

    Returns:
        ResumeAgent: New agent instance.
    """
    return ResumeAgent()
