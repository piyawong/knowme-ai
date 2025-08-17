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
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="gradient-primary px-6 py-5 flex items-center justify-between shadow-soft">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-glow">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Knowme AI</h1>
            <p className="text-sm text-white/80">Resume Q&A Assistant</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center space-x-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-all hover-lift"
          title="Clear conversation"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">Clear</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-b from-background to-muted/30">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Current streaming message */}
        {currentStreamingMessage && (
          <div className="flex justify-start w-full mb-4 animate-slide-in">
            <div className="bg-gradient-to-r from-muted to-muted/70 border border-border rounded-xl px-5 py-3 shadow-soft max-w-[80%]">
              <div className="whitespace-pre-wrap break-words text-foreground">
                {currentStreamingMessage}
                <span className="inline-block w-2 h-4 bg-primary/60 ml-1 animate-pulse rounded"></span>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        <TypingIndicator isVisible={isLoading && !currentStreamingMessage} />

        {/* Suggested questions when chat is empty */}
        {messages.length <= 1 && !isLoading && (
          <div className="mt-8 animate-slide-in">
            <p className="text-muted-foreground text-sm mb-4 font-medium">
              Try asking about:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left p-4 border border-border rounded-xl hover:bg-muted hover:border-primary/30 transition-all text-sm hover-lift gradient-primary-subtle shadow-soft"
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
      <div className="border-t border-border bg-background/95 backdrop-blur-sm px-6 py-5">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Piyawong's experience, skills, projects..."
              className="w-full px-5 py-3.5 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
              disabled={isLoading}
              maxLength={500}
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {input.length}/500
            </div>
          </div>

          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="gradient-primary text-white p-3.5 rounded-xl hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center hover-lift"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground mt-3 text-center">
          This is an AI assistant representing Piyawong Mahattanasawat's resume.
          Ask questions about experience, skills, projects, or education.
        </div>
      </div>
    </div>
  );
}
