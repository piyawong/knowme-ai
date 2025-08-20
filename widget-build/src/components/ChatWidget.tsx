/**
 * Standalone chat widget component for embedding.
 */

import React, { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatWidgetProps {
  apiBaseUrl?: string;
  theme?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  greeting?: string;
}

// Icons as inline SVG components
const MessageCircleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const XIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MinimizeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SendIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22,2 15,22 11,13 2,9 22,2" />
  </svg>
);

// Simple API client
async function* streamChatMessage(
  message: string,
  sessionId: string,
  baseUrl: string = "http://localhost:8000"
) {
  // Get current origin for CORS
  const currentOrigin = window.location.origin;
  console.log("currentOrigin", currentOrigin);
  const response = await fetch(`${baseUrl}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: currentOrigin,
      "X-Widget-Origin": currentOrigin,
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      origin: currentOrigin,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            console.warn("Failed to parse SSE data:", data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export default function ChatWidget({
  apiBaseUrl = "http://localhost:8000",
  theme = {
    primary: "#3b82f6",
    secondary: "#f3f4f6",
    background: "#ffffff",
    text: "#1f2937",
  },
  position = "bottom-right",
  greeting = "Hi! I'm Knowme AI. Ask me anything about Piyawong's professional background!",
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(
    () => `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const positionStyles = {
    "bottom-right": { bottom: "20px", right: "20px" },
    "bottom-left": { bottom: "20px", left: "20px" },
    "top-right": { top: "20px", right: "20px" },
    "top-left": { top: "20px", left: "20px" },
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: greeting,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, greeting, messages.length]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      content: messageText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setCurrentStreamingMessage("");

    try {
      const aiMessageId = `ai_${Date.now()}`;
      let fullResponse = "";

      for await (const chunk of streamChatMessage(
        messageText.trim(),
        sessionId,
        apiBaseUrl
      )) {
        if (chunk.content) {
          fullResponse += chunk.content;
          setCurrentStreamingMessage(fullResponse);
        }

        if (chunk.is_complete) {
          const aiMessage: Message = {
            id: aiMessageId,
            content: fullResponse,
            isUser: false,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, aiMessage]);
          setCurrentStreamingMessage("");
          break;
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        content: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentStreamingMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeWidget = () => {
    setIsMinimized(true);
  };

  const restoreWidget = () => {
    setIsMinimized(false);
  };

  const widgetStyles: React.CSSProperties = {
    position: "fixed",
    zIndex: 2147483647,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "14px",
    ...positionStyles[position],
  };

  return (
    <div style={widgetStyles}>
      {!isOpen && (
        <button
          onClick={toggleWidget}
          className="knowme-widget-fab"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "30px",
            backgroundColor: theme.primary,
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: "knowme-widget-slide-up 0.5s ease-out",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08) translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.25), 0 12px 40px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1) translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.1)";
          }}
        >
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)",
            opacity: 0,
            transition: "opacity 0.3s ease",
          }}
          className="knowme-widget-fab-glow"
          />
          <MessageCircleIcon />
          <span style={{
            position: "absolute",
            width: "12px",
            height: "12px",
            backgroundColor: "#10b981",
            borderRadius: "50%",
            top: "8px",
            right: "8px",
            border: "2px solid white",
            animation: "knowme-widget-pulse 2s infinite",
          }} />
        </button>
      )}

      {isOpen && (
        <div
          className="knowme-widget-container"
          style={{
            width: "380px",
            height: isMinimized ? "56px" : "520px",
            backgroundColor: theme.background,
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.08)",
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            animation: isMinimized ? "none" : "knowme-widget-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transformOrigin: position.includes("bottom") ? "bottom" : "top",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}dd 100%)`,
              color: "white",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: "56px",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircleIcon />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600" }}>
                  Knowme AI
                </div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>Online</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={isMinimized ? restoreWidget : minimizeWidget}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                }}
              >
                <MinimizeIcon />
              </button>
              <button
                onClick={toggleWidget}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                }}
              >
                <XIcon />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      justifyContent: message.isUser
                        ? "flex-end"
                        : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        backgroundColor: message.isUser
                          ? theme.primary
                          : theme.secondary,
                        color: message.isUser ? "white" : theme.text,
                        fontSize: "14px",
                        lineHeight: "1.4",
                        borderBottomLeftRadius: message.isUser ? "12px" : "4px",
                        borderBottomRightRadius: message.isUser
                          ? "4px"
                          : "12px",
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {currentStreamingMessage && (
                  <div
                    style={{ display: "flex", justifyContent: "flex-start" }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        borderBottomLeftRadius: "4px",
                        backgroundColor: theme.secondary,
                        color: theme.text,
                        fontSize: "14px",
                        lineHeight: "1.4",
                      }}
                    >
                      {currentStreamingMessage}
                      <span
                        style={{
                          display: "inline-block",
                          width: "2px",
                          height: "16px",
                          backgroundColor: "currentColor",
                          marginLeft: "4px",
                          animation: "blink 1s infinite",
                        }}
                      />
                    </div>
                  </div>
                )}

                {isLoading && !currentStreamingMessage && (
                  <div
                    style={{ display: "flex", justifyContent: "flex-start" }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "12px",
                        borderBottomLeftRadius: "4px",
                        backgroundColor: theme.secondary,
                        display: "flex",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "4px",
                          height: "4px",
                          backgroundColor: "#9ca3af",
                          borderRadius: "50%",
                          animation: "bounce 1.4s infinite ease-in-out",
                        }}
                      />
                      <div
                        style={{
                          width: "4px",
                          height: "4px",
                          backgroundColor: "#9ca3af",
                          borderRadius: "50%",
                          animation: "bounce 1.4s infinite ease-in-out 0.16s",
                        }}
                      />
                      <div
                        style={{
                          width: "4px",
                          height: "4px",
                          backgroundColor: "#9ca3af",
                          borderRadius: "50%",
                          animation: "bounce 1.4s infinite ease-in-out 0.32s",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  borderTop: `1px solid ${theme.secondary}`,
                  padding: "12px",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: `1px solid ${theme.secondary}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: theme.background,
                    color: "black",
                  }}
                  disabled={isLoading}
                  maxLength={300}
                />
                <button
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: theme.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: !input.trim() || isLoading ? 0.5 : 1,
                  }}
                >
                  <SendIcon />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes knowme-widget-blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          @keyframes knowme-widget-bounce {
            0%, 80%, 100% { 
              transform: translateY(0) scale(1);
            }
            40% { 
              transform: translateY(-8px) scale(1.1);
            }
          }
          @keyframes knowme-widget-slide-up {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes knowme-widget-message-slide {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes knowme-widget-pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            70% {
              box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
          }
          @keyframes knowme-widget-rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .knowme-widget-messages::-webkit-scrollbar {
            width: 6px;
          }
          
          .knowme-widget-messages::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .knowme-widget-messages::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.2);
            border-radius: 3px;
          }
          
          .knowme-widget-messages::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.3);
          }
          
          .knowme-widget-fab:hover .knowme-widget-fab-glow {
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  );
}
