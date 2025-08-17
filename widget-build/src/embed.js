/**
 * Easy embed script for Knowme AI Widget
 * Automatically initializes widget from script tag attributes
 */

(function() {
  'use strict';

  // Find the embed script tag
  const embedScript = document.currentScript || 
    document.querySelector('script[src*="embed.js"]') ||
    document.querySelector('script[data-api-url]');

  if (!embedScript) {
    console.error('Knowme Widget embed script not found');
    return;
  }

  // Get configuration from data attributes
  const getConfig = () => {
    const config = {};
    
    // API URL - optional, will use environment variable if not provided
    const apiUrl = embedScript.getAttribute('data-api-url');
    if (apiUrl) {
      config.apiBaseUrl = apiUrl;
    }

    // Theme configuration
    const primaryColor = embedScript.getAttribute('data-primary-color');
    const secondaryColor = embedScript.getAttribute('data-secondary-color');
    const backgroundColor = embedScript.getAttribute('data-background-color');
    const textColor = embedScript.getAttribute('data-text-color');

    if (primaryColor || secondaryColor || backgroundColor || textColor) {
      config.theme = {};
      if (primaryColor) config.theme.primary = primaryColor;
      if (secondaryColor) config.theme.secondary = secondaryColor;
      if (backgroundColor) config.theme.background = backgroundColor;
      if (textColor) config.theme.text = textColor;
    }

    // Position
    const position = embedScript.getAttribute('data-position');
    if (position) {
      config.position = position;
    }

    // Greeting message
    const greeting = embedScript.getAttribute('data-greeting');
    if (greeting) {
      config.greeting = greeting;
    }

    return config;
  };

  // Load dependencies if not already loaded
  const loadDependencies = () => {
    return Promise.all([
      loadScript('https://unpkg.com/react@18/umd/react.production.min.js', 'React'),
      loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', 'ReactDOM')
    ]);
  };

  // Load script helper
  const loadScript = (src, globalVar) => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window[globalVar]) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  // Load widget script
  const loadWidget = () => {
    const widgetSrc = embedScript.src.replace('embed.js', 'knowme-widget.js');
    return loadScript(widgetSrc, 'KnowmeWidget');
  };

  // Initialize widget
  const initWidget = () => {
    const config = getConfig();
    console.log('Initializing Knowme Widget with config:', config);
    
    if (window.KnowmeWidget && window.KnowmeWidget.init) {
      window.KnowmeWidget.init(config);
    } else {
      console.error('KnowmeWidget not found');
    }
  };

  // Auto-initialize when DOM is ready
  const autoInit = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  };

  // Start loading process
  const start = () => {
    loadDependencies()
      .then(() => loadWidget())
      .then(() => initWidget())
      .catch((error) => {
        console.error('Failed to initialize Knowme Widget:', error);
      });
  };

  // Start the process
  autoInit();

})();