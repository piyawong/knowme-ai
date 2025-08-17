/**
 * Embeddable chat widget component for external websites.
 * 
 * A compact, responsive chat interface that can be embedded
 * on any website as a live chat widget.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, X, Minimize2 } from "lucide-react";
import { Message, streamChatMessage } from "@/lib/api";
import MarkdownMessage from "./MarkdownMessage";

interface ChatWidgetProps {
  /** API base URL for the chat service */
  apiBaseUrl?: string;
  /** Widget theme colors */
  theme?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  /** Widget position on screen */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Custom greeting message */
  greeting?: string;
}

export default function ChatWidget({
  apiBaseUrl = "http://localhost:8000",
  theme = {
    primary: "#3b82f6",
    secondary: "#e5e7eb",
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

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-5 right-5",
    "bottom-left": "bottom-5 left-5",
    "top-right": "top-5 right-5",
    "top-left": "top-5 left-5",
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  // Add welcome message when widget opens
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

      for await (const chunk of streamChatMessage(messageText.trim(), sessionId)) {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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

  return (
    <div
      className={`fixed z-50 ${positionClasses[position]} font-sans`}
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={toggleWidget}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110"
          style={{ backgroundColor: theme.primary }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          className={`bg-white rounded-lg shadow-xl border transition-all duration-300 ${
            isMinimized ? "w-80 h-12" : "w-80 h-96"
          }`}
          style={{
            backgroundColor: theme.background,
            color: theme.text,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-3 rounded-t-lg"
            style={{ backgroundColor: theme.primary }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Knowme AI</h3>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={isMinimized ? restoreWidget : minimizeWidget}
                className="w-6 h-6 flex items-center justify-center text-white/80 hover:text-white"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button
                onClick={toggleWidget}
                className="w-6 h-6 flex items-center justify-center text-white/80 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-64 overflow-y-auto p-3 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.isUser
                          ? "text-white rounded-br-none"
                          : "border rounded-bl-none"
                      }`}
                      style={{
                        backgroundColor: message.isUser ? theme.primary : theme.secondary,
                        color: message.isUser ? "white" : theme.text,
                        borderColor: theme.secondary,
                      }}
                    >
                      <MarkdownMessage content={message.content} />
                    </div>
                  </div>
                ))}

                {/* Streaming message */}
                {currentStreamingMessage && (
                  <div className="flex justify-start">
                    <div
                      className="max-w-[80%] px-3 py-2 rounded-lg rounded-bl-none text-sm border"
                      style={{
                        backgroundColor: theme.secondary,
                        color: theme.text,
                        borderColor: theme.secondary,
                      }}
                    >
                      <MarkdownMessage content={currentStreamingMessage} />
                      <span className="inline-block w-1 h-3 bg-current ml-1 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                {isLoading && !currentStreamingMessage && (
                  <div className="flex justify-start">
                    <div
                      className="px-3 py-2 rounded-lg rounded-bl-none text-sm border"
                      style={{
                        backgroundColor: theme.secondary,
                        borderColor: theme.secondary,
                      }}
                    >
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3" style={{ borderColor: theme.secondary }}>
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
                    style={{
                      borderColor: theme.secondary,
                      backgroundColor: theme.background,
                      color: theme.text,
                    }}
                    disabled={isLoading}
                    maxLength={300}
                  />
                  <button
                    onClick={() => handleSendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white disabled:opacity-50"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}