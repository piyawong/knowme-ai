/**
 * Root layout for the Next.js application.
 *
 * Provides global styles, metadata, and providers for the entire app.
 */

import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Piyawong Mahattanasawat - Resume Q&A",
  description:
    "Interactive resume chatbot - Ask questions about Piyawong Mahattanasawat's background, experience, and skills.",
  keywords: ["resume", "chatbot", "AI", "career", "software engineer"],
  authors: [{ name: "Piyawong Mahattanasawat" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
