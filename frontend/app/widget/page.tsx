/**
 * Widget demo page showing the embeddable chat widget.
 */

"use client";

import ChatWidget from "@/components/ChatWidget";

export default function WidgetPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Knowme AI Chat Widget Demo
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">About the Widget</h2>
          <p className="text-gray-600 mb-4">
            This is a live demo of the Knowme AI chat widget. The widget appears
            in the bottom-right corner and can be embedded on any website to
            provide AI-powered chat about Piyawong Mahattanasawat's professional
            background.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Floating chat button</li>
                <li>• Expandable/collapsible interface</li>
                <li>• Real-time streaming responses</li>
                <li>• Responsive design</li>
                <li>• Customizable themes</li>
                <li>• Easy integration</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Use Cases:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Portfolio websites</li>
                <li>• Professional profiles</li>
                <li>• Resume showcases</li>
                <li>• Personal branding sites</li>
                <li>• Job application platforms</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Integration Code</h2>
          <p className="text-gray-600 mb-4">
            Add this code to any website to embed the chat widget:
          </p>

          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              {`<!-- Add this to your HTML head -->
<script src="https://your-domain.com/widget.js"></script>

<!-- Initialize the widget anywhere in your body -->
<script>
  KnowmeWidget.init({
    apiBaseUrl: 'https://your-api-domain.com',
    theme: {
      primary: '#3b82f6',
      secondary: '#e5e7eb',
      background: '#ffffff',
      text: '#1f2937'
    },
    position: 'bottom-right',
    greeting: 'Hi! Ask me about Piyawong!'
  });
</script>`}
            </pre>
          </div>
        </div>
      </div>

      {/* The actual widget */}
      <ChatWidget
        position="bottom-right"
        greeting="Hi! I'm Knowme AI. Click here to learn about Piyawong's professional background, skills, and experience!"
      />
    </div>
  );
}
