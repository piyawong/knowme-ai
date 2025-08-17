/**
 * Standalone widget entry point for embedding on external websites.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import ChatWidget from "./components/ChatWidget";
import "./styles.css";

interface WidgetConfig {
  apiBaseUrl?: string;
  theme?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  greeting?: string;
}

// Global widget API
declare global {
  interface Window {
    KnowmeWidget: {
      init: (config?: WidgetConfig) => void;
      destroy: () => void;
    };
  }
}

let widgetRoot: ReactDOM.Root | null = null;
let widgetContainer: HTMLElement | null = null;

const KnowmeWidget = {
  init: (config: WidgetConfig = {}) => {
    // Avoid multiple initializations
    if (widgetContainer) {
      console.warn("KnowmeWidget is already initialized");
      return;
    }

    // Create container
    widgetContainer = document.createElement("div");
    widgetContainer.id = "knowme-widget-container";
    widgetContainer.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;

    document.body.appendChild(widgetContainer);

    // Get API URL from config or environment
    const apiBaseUrl =
      config.apiBaseUrl ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";

    // Render widget
    widgetRoot = ReactDOM.createRoot(widgetContainer);
    widgetRoot.render(
      <div style={{ pointerEvents: "auto" }}>
        <ChatWidget
          apiBaseUrl={apiBaseUrl}
          theme={config.theme}
          position={config.position}
          greeting={config.greeting}
        />
      </div>
    );
  },

  destroy: () => {
    if (widgetRoot) {
      widgetRoot.unmount();
      widgetRoot = null;
    }

    if (widgetContainer) {
      document.body.removeChild(widgetContainer);
      widgetContainer = null;
    }
  },
};

// Auto-initialize if config is found
document.addEventListener("DOMContentLoaded", () => {
  const script = document.querySelector("script[data-knowme-widget]");
  if (script) {
    try {
      const config = JSON.parse(
        script.getAttribute("data-knowme-widget") || "{}"
      );
      KnowmeWidget.init(config);
    } catch (e) {
      console.error("Failed to parse KnowmeWidget config:", e);
      KnowmeWidget.init();
    }
  }
});

// Expose to global scope
window.KnowmeWidget = KnowmeWidget;

export default KnowmeWidget;
