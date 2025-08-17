/**
 * Standalone widget entry point for embedding on external websites.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import ChatWidget from "./components/ChatWidget";
import "./styles.css";

// Type definitions for React 17/18 compatibility
interface ReactDOM17 {
  render: (element: React.ReactElement, container: Element) => void;
  unmountComponentAtNode: (container: Element) => boolean;
}

interface ReactDOM18 {
  createRoot: (container: Element) => {
    render: (element: React.ReactElement) => void;
    unmount: () => void;
  };
}

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
    // Check if React and ReactDOM are available
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      console.error('React and ReactDOM must be loaded before initializing KnowmeWidget');
      return;
    }

    // Avoid multiple initializations
    if (widgetContainer) {
      console.warn("KnowmeWidget is already initialized");
      return;
    }

    try {
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

      console.log("Initializing widget with API URL:", apiBaseUrl);

      // Create widget element
      const widgetElement = React.createElement("div", 
        { style: { pointerEvents: "auto" } },
        React.createElement(ChatWidget, {
          apiBaseUrl: apiBaseUrl,
          theme: config.theme,
          position: config.position,
          greeting: config.greeting,
        })
      );

      // Render widget with compatibility for React 17/18
      if ((ReactDOM as any).createRoot) {
        // React 18
        widgetRoot = (ReactDOM as any).createRoot(widgetContainer);
        if (widgetRoot) {
          widgetRoot.render(widgetElement);
        }
      } else {
        // React 17 fallback
        (ReactDOM as any).render(widgetElement, widgetContainer);
      }
    } catch (error) {
      console.error("Failed to initialize KnowmeWidget:", error);
      // Cleanup on error
      if (widgetContainer) {
        try {
          document.body.removeChild(widgetContainer);
        } catch (e) {
          console.warn("Failed to cleanup container:", e);
        }
        widgetContainer = null;
      }
    }
  },

  destroy: () => {
    try {
      if (widgetRoot && widgetRoot.unmount) {
        // React 18
        widgetRoot.unmount();
        widgetRoot = null;
      }

      if (widgetContainer) {
        // React 17 fallback - unmount manually
        if (!widgetRoot && (ReactDOM as any).unmountComponentAtNode) {
          (ReactDOM as any).unmountComponentAtNode(widgetContainer);
        }
        
        document.body.removeChild(widgetContainer);
        widgetContainer = null;
      }
    } catch (error) {
      console.warn("Error during widget cleanup:", error);
      // Force cleanup
      widgetRoot = null;
      if (widgetContainer) {
        try {
          document.body.removeChild(widgetContainer);
        } catch (e) {
          console.warn("Failed to remove container:", e);
        }
        widgetContainer = null;
      }
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
