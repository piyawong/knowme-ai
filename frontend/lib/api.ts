/**
 * API client for communicating with the FastAPI backend.
 * 
 * Provides functions for chat interactions, streaming responses,
 * and session management.
 */

export interface ChatMessage {
  message: string;
  session_id?: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  sources: string[];
  timestamp: string;
  session_id?: string;
}

export interface ChatStreamChunk {
  content: string;
  is_complete: boolean;
  sources?: string[];
}

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Send a chat message and get a complete response.
 */
export async function sendChatMessage(
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Send a chat message and stream the response in real-time.
 */
export async function* streamChatMessage(
  message: string,
  sessionId?: string
): AsyncIterableIterator<ChatStreamChunk> {
  const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data.trim()) {
              const parsedChunk: ChatStreamChunk = JSON.parse(data);
              yield parsedChunk;
              
              if (parsedChunk.is_complete) {
                return;
              }
            }
          } catch (error) {
            console.warn('Failed to parse SSE chunk:', error);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Get chat history for a session.
 */
export async function getChatHistory(sessionId: string): Promise<{
  session_id: string;
  messages: Array<{
    type: string;
    content: string;
    timestamp?: string;
  }>;
  total_messages: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/chat/history/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Clear chat history for a session.
 */
export async function clearChatHistory(sessionId: string): Promise<{
  message: string;
  session_id: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/chat/history/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check backend health status.
 */
export async function checkHealth(): Promise<{
  status: string;
  timestamp: string;
  service: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed: HTTP ${response.status}`);
  }

  return response.json();
}