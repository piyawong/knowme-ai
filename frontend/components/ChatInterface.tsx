/**
 * Main chat interface component with streaming responses.
 *
 * Handles real-time chat interactions, message display, and
 * streaming responses from the backend agent.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, RotateCcw, User, Bot } from "lucide-react";
import { Message, streamChatMessage, clearChatHistory } from "@/lib/api";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  // Add welcome message on component mount
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      content:
        "Hello! I'm Knowme AI, your personal assistant for learning about Piyawong Mahattanasawat. I can help you discover his professional background, technical skills, project experience, and career achievements. What would you like to know about Piyawong?",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) {
      return;
    }

    // Add user message
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
      // Create AI message placeholder
      const aiMessageId = `ai_${Date.now()}`;
      let fullResponse = "";

      // Stream the response
      for await (const chunk of streamChatMessage(
        messageText.trim(),
        sessionId
      )) {
        if (chunk.content) {
          fullResponse += chunk.content;
          setCurrentStreamingMessage(fullResponse);
        }

        if (chunk.is_complete) {
          // Finalize the AI message
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
      console.error("Chat error:", error);

      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        content: `I apologize, but I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setCurrentStreamingMessage("");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChatHistory(sessionId);
      setMessages([]);
      setCurrentStreamingMessage("");

      // Add welcome message back
      const welcomeMessage: Message = {
        id: "welcome_new",
        content:
          "Chat cleared! I'm ready to answer questions about Piyawong's resume. What would you like to know?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const suggestedQuestions = [
    "Tell me about Piyawong's work experience",
    "What programming languages does Piyawong know?",
    "What projects has Piyawong worked on?",
    "Tell me about Piyawong's education background",
    "What technologies does Piyawong use?",
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Knowme AI</h1>
            <p className="text-sm text-gray-600">Resume Q&A Assistant</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Clear conversation"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">Clear</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Current streaming message */}
        {currentStreamingMessage && (
          <div className="flex justify-start w-full mb-4">
            <div className="bg-gray-100 border rounded-lg px-4 py-2 shadow-sm max-w-[80%]">
              <div className="whitespace-pre-wrap break-words">
                {currentStreamingMessage}
                <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse"></span>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        <TypingIndicator isVisible={isLoading && !currentStreamingMessage} />

        {/* Suggested questions when chat is empty */}
        {messages.length <= 1 && !isLoading && (
          <div className="mt-8">
            <p className="text-gray-600 text-sm mb-4">Try asking about:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Piyawong's experience, skills, projects..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {input.length}/500
            </div>
          </div>

          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-2 text-center">
          This is an AI assistant representing Piyawong Mahattanasawat's resume.
          Ask questions about experience, skills, projects, or education.
        </div>
      </div>
    </div>
  );
}
