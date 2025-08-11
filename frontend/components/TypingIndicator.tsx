/**
 * Typing indicator component for showing when the AI is responding.
 *
 * Displays animated dots to indicate the agent is processing a response.
 */

import React from "react";

interface TypingIndicatorProps {
  isVisible: boolean;
}

export default function TypingIndicator({ isVisible }: TypingIndicatorProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex justify-start w-full mb-4">
      <div className="bg-gray-100 border rounded-lg px-4 py-2 shadow-sm max-w-[80%]">
        <div className="flex items-center space-x-1">
          <span className="text-gray-600 text-sm">Knowme is typing</span>
          <div className="flex space-x-1 ml-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
