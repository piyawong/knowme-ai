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
    <div className="flex justify-start w-full mb-4 animate-slide-in">
      <div className="bg-gradient-to-r from-muted to-muted/70 border border-border rounded-xl px-5 py-3 shadow-soft max-w-[80%]">
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground text-sm font-medium">Knowme is thinking</span>
          <div className="flex space-x-1.5 ml-2">
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-gradient-end rounded-full animate-bounce"></div>
            <div
              className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-gradient-end rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-gradient-end rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
