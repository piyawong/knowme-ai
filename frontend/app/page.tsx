/**
 * Chat page component for the resume Q&A interface.
 *
 * Main chat interface where users can interact with the AI assistant.
 */

import React from "react";
import ChatInterface from "@/components/ChatInterface";

export default function HomePage() {
  console.log("envza", process.env.NEXT_PUBLIC_API_URL);
  return (
    <div className="h-screen bg-gray-50">
      <ChatInterface />
    </div>
  );
}
