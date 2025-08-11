/**
 * Chat page component for the resume Q&A interface.
 *
 * Main chat interface where users can interact with the AI assistant.
 */

import React from "react";
import ChatInterface from "@/components/ChatInterface";

export default function HomePage() {
  return (
    <div className="h-screen bg-gray-50">
      <ChatInterface />
    </div>
  );
}
