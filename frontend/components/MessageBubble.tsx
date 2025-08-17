/**
 * Message bubble component for displaying individual chat messages.
 * 
 * Handles user and AI messages with proper styling and formatting.
 */

import React from 'react';
import { Message } from '@/lib/api';
import MarkdownMessage from './MarkdownMessage';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { content, isUser, timestamp } = message;

  return (
    <div className={`flex w-full mb-4 animate-slide-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-5 py-3 shadow-soft transition-all ${
          isUser
            ? 'gradient-primary text-white ml-auto hover:shadow-glow'
            : 'bg-gradient-to-r from-muted to-muted/70 text-foreground mr-auto border border-border'
        }`}
      >
        {/* Message content */}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">
            {content}
          </div>
        ) : (
          <MarkdownMessage content={content} />
        )}
        
        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-white/70' : 'text-muted-foreground'
          }`}
        >
          {timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}