/**
 * Message bubble component for displaying individual chat messages.
 * 
 * Handles user and AI messages with proper styling and formatting.
 */

import React from 'react';
import { Message } from '@/lib/api';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { content, isUser, timestamp } = message;

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white ml-auto'
            : 'bg-gray-100 text-gray-900 mr-auto border'
        }`}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {content}
        </div>
        
        {/* Timestamp */}
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
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