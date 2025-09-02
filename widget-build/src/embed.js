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

  // Wait for React to be fully loaded and ready with exponential backoff
  const waitForReact = (maxAttempts = 100, initialDelay = 100) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      let delay = initialDelay;
      
      const check = () => {
        // Check if React and ReactDOM are fully loaded
        if (window.React && 
            window.ReactDOM && 
            (window.ReactDOM.createRoot || window.ReactDOM.render) &&
            document.readyState !== 'loading') {
          console.log('React dependencies ready');
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          // Exponential backoff with jitter to avoid thundering herd
          const jitter = Math.random() * 50;
          setTimeout(check, Math.min(delay + jitter, 1000));
          delay = Math.min(delay * 1.1, 500); // Cap at 500ms
        } else {
          reject(new Error(`React/ReactDOM not loaded after ${maxAttempts * initialDelay / 1000} seconds`));
        }
      };
      check();
    });
  };

  // Load dependencies if not already loaded
  const loadDependencies = () => {
    const reactPromise = window.React ? 
      Promise.resolve() : 
      loadScript('https://unpkg.com/react@18/umd/react.production.min.js', 'React');
    
    const reactDOMPromise = window.ReactDOM ? 
      Promise.resolve() : 
      loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', 'ReactDOM');

    return Promise.all([reactPromise, reactDOMPromise])
      .then(() => waitForReact());
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
      script.onload = () => {
        // Add extra wait for script execution
        setTimeout(() => {
          if (window[globalVar]) {
            resolve();
          } else {
            reject(new Error(`${globalVar} not available after loading ${src}`));
          }
        }, 50);
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  // Load widget script
  const loadWidget = () => {
    const widgetSrc = embedScript.src.replace('embed.js', 'knowme-widget.js');
    return loadScript(widgetSrc, 'KnowmeWidget');
  };

  // Initialize widget with retry mechanism
  const initWidget = async (retryCount = 0, maxRetries = 3) => {
    const config = getConfig();
    console.log('Initializing Knowme Widget with config:', config);
    
    try {
      // Wait for KnowmeWidget to be available
      await waitForKnowmeWidget();
      
      if (window.KnowmeWidget && window.KnowmeWidget.init) {
        window.KnowmeWidget.init(config);
        console.log('Knowme Widget initialized successfully');
      } else {
        throw new Error('KnowmeWidget.init not found');
      }
    } catch (error) {
      console.warn(`Widget initialization attempt ${retryCount + 1} failed:`, error.message);
      
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => initWidget(retryCount + 1, maxRetries), delay);
      } else {
        console.error('Failed to initialize Knowme Widget after', maxRetries + 1, 'attempts:', error);
      }
    }
  };

  // Wait for KnowmeWidget to be available
  const waitForKnowmeWidget = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const check = () => {
        if (window.KnowmeWidget && typeof window.KnowmeWidget.init === 'function') {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 100);
        } else {
          reject(new Error('KnowmeWidget not loaded after 5 seconds'));
        }
      };
      check();
    });
  };

  // Auto-initialize when DOM is ready
  const autoInit = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  };

  // Start loading process with comprehensive error handling
  const start = async () => {
    try {
      console.log('Starting Knowme Widget loading process...');
      
      // Step 1: Load React dependencies
      console.log('Loading React dependencies...');
      await loadDependencies();
      
      // Step 2: Load widget script
      console.log('Loading widget script...');
      await loadWidget();
      
      // Step 3: Initialize widget (has its own retry logic)
      console.log('Initializing widget...');
      await initWidget();
      
    } catch (error) {
      console.error('Failed to initialize Knowme Widget:', error);
      
      // Fallback: Try one more time after a longer delay
      console.log('Attempting fallback initialization in 3 seconds...');
      setTimeout(() => {
        if (!window.KnowmeWidget || !window.KnowmeWidget.isInitialized) {
          initWidget().catch(fallbackError => {
            console.error('Fallback initialization also failed:', fallbackError);
          });
        }
      }, 3000);
    }
  };

  // Start the process
  autoInit();

})();