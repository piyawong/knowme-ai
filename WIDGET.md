# 🤖 Knowme AI Chat Widget

A lightweight, embeddable chat widget that provides AI-powered assistance about Piyawong Mahattanasawat's professional background.

## ✨ Features

- **🚀 Easy Integration** - Single script tag deployment
- **🎨 Customizable** - Themes, colors, and positioning options  
- **📱 Responsive** - Works on desktop, tablet, and mobile
- **⚡ Real-time** - Streaming chat responses
- **🔒 Secure** - CORS-enabled and secure API communication
- **🪶 Lightweight** - Minimal impact on page load times

## 🛠️ Technology Stack

### Frontend Widget
- **React 18** - Component framework
- **TypeScript** - Type safety
- **Webpack 5** - Module bundling and optimization
- **CSS-in-JS** - Inline styles for isolation
- **UMD Build** - Universal module definition for compatibility

## 🚀 Quick Start

### Simple Embed (Recommended)

Add one line to your website:

```html
<script 
  src="https://your-domain.com/embed.js"
  data-api-url="https://your-api-domain.com"
  data-primary-color="#3b82f6"
  data-position="bottom-right">
</script>
```

**Note**: `data-api-url` is optional. If not provided, the widget will use the environment variable `NEXT_PUBLIC_API_URL` or default to `http://localhost:8000`.

### Manual Initialization

For more control:

```html
<!-- Load dependencies -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://your-domain.com/knowme-widget.js"></script>

<!-- Initialize widget -->
<script>
  KnowmeWidget.init({
    apiBaseUrl: 'https://your-api-domain.com', // Optional - will use env or default
    theme: {
      primary: '#3b82f6',
      secondary: '#f3f4f6',
      background: '#ffffff',
      text: '#1f2937'
    },
    position: 'bottom-right',
    greeting: 'Hi! Ask me about Piyawong!'
  });
</script>
```

## ⚙️ Configuration Options

### Theme Configuration

```javascript
theme: {
  primary: '#3b82f6',      // Primary color (buttons, headers)
  secondary: '#f3f4f6',    // Secondary color (message bubbles)  
  background: '#ffffff',   // Widget background
  text: '#1f2937'         // Text color
}
```

### Position Options

- `bottom-right` (default) - Bottom right corner
- `bottom-left` - Bottom left corner  
- `top-right` - Top right corner
- `top-left` - Top left corner

## 🔧 Widget Development & Build

### Project Structure
```bash
widget-build/
├── package.json          # Widget dependencies
├── webpack.config.js      # Webpack build configuration
├── tsconfig.json         # TypeScript configuration
├── src/
│   ├── widget.tsx        # Main widget entry point
│   ├── components/       # React components
│   └── styles.css        # Widget styles
└── dist/                 # Build output
    ├── knowme-widget.js  # Main widget bundle (~20KB)
    ├── embed.js          # Easy embed script
    └── demo.html         # Demo page
```

### Build Process

#### Method 1: Local Build
```bash
# Navigate to widget build directory
cd widget-build

# Install dependencies
npm install

# Build for production
npm run build

# Generated files in dist/:
# - knowme-widget.js (main bundle)
# - embed.js (embed script)  
# - demo.html (demo page)
```

#### Method 2: Docker Build
```bash
# Build widget using Docker
docker build -f Dockerfile.widget -t knowme-widget .

# Run container to serve widget files
docker run -d -p 3100:80 --name widget-server knowme-widget

# Access widget files at:
# - http://localhost:3100/knowme-widget.js
# - http://localhost:3100/embed.js
# - http://localhost:3100/demo.html
```

#### Method 3: Docker Build with Volume (Development)
```bash
# Build and extract files to local directory
docker build -f Dockerfile.widget -t knowme-widget .

# Copy built files from container to local directory
docker create --name temp-widget knowme-widget
docker cp temp-widget:/usr/share/nginx/html ./widget-dist
docker rm temp-widget

# Widget files now available in ./widget-dist/
```

## 🌐 Widget Deployment

### Option 1: Upload to CDN
Upload these files to your CDN or static hosting:
```
your-cdn.com/
├── knowme-widget.js      # Main widget bundle
├── embed.js              # Easy embed script
└── demo.html             # Demo page (optional)
```

### Option 2: Docker Deployment

#### Production Docker Deployment
```bash
# Build widget image
docker build -f Dockerfile.widget -t knowme-widget:latest .

# Run as production service
docker run -d \
  --name knowme-widget-prod \
  -p 80:80 \
  --restart unless-stopped \
  knowme-widget:latest

# Access widget at:
# - http://your-domain.com/knowme-widget.js
# - http://your-domain.com/embed.js
```

#### Docker Compose Deployment

Deploy widget alongside backend and frontend:
```bash
# Production deployment
docker-compose up --build

# Development deployment (with hot reload)
docker-compose -f docker-compose.dev.yml up --build

# Access services:
# - Backend API: http://localhost:8000
# - Frontend App: http://localhost:3000  
# - Widget Files: http://localhost:3100
```

Widget service configuration:

**Production (`docker-compose.yml`)**:
```yaml
widget:
  build:
    context: .
    dockerfile: Dockerfile.widget
  container_name: resume-chatbot-widget
  ports:
    - "3100:80"
  networks:
    - resume-chatbot-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

**Development (`docker-compose.dev.yml`)**:
```yaml
widget:
  image: node:18-alpine
  container_name: resume-chatbot-widget-dev
  working_dir: /app
  ports:
    - "3100:8080"
  environment:
    - NODE_ENV=development
  volumes:
    - ./widget-build:/app:rw
    - /app/node_modules
  networks:
    - resume-chatbot-network
  restart: unless-stopped
  command: sh -c "npm install && npm run dev -- --host 0.0.0.0 --port 8080"
```

#### Deploy with Load Balancer
```bash
# Deploy multiple instances for high availability
docker run -d --name widget-1 -p 8081:80 knowme-widget:latest
docker run -d --name widget-2 -p 8082:80 knowme-widget:latest
docker run -d --name widget-3 -p 8083:80 knowme-widget:latest

# Use nginx or cloud load balancer to distribute traffic
```

### Integration Examples

#### Static Website
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Portfolio</title>
</head>
<body>
    <h1>Welcome to My Portfolio</h1>
    
    <!-- Knowme AI Widget -->
    <script 
      src="https://your-cdn.com/embed.js"
      data-api-url="https://your-api.herokuapp.com"
      data-primary-color="#your-brand-color"
      data-position="bottom-right">
    </script>
</body>
</html>
```

#### React Application
```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://your-cdn.com/embed.js';
    script.setAttribute('data-api-url', process.env.REACT_APP_API_URL);
    script.setAttribute('data-primary-color', '#your-color');
    document.body.appendChild(script);
    
    return () => {
      // Cleanup
      if (window.KnowmeWidget) {
        window.KnowmeWidget.destroy();
      }
      document.body.removeChild(script);
    };
  }, []);
  
  return <div>Your App Content</div>;
}
```

#### WordPress
```php
// Add to functions.php
function add_knowme_widget() {
    echo '<script src="https://your-domain.com/embed.js" 
           data-api-url="https://your-api.com" 
           data-primary-color="#your-theme-color"></script>';
}
add_action('wp_footer', 'add_knowme_widget');
```

## 🎨 Pre-built Themes

### Blue Theme (Default)
```javascript
theme: {
  primary: '#3b82f6',
  secondary: '#dbeafe', 
  background: '#ffffff',
  text: '#1e293b'
}
```

### Green Theme
```javascript
theme: {
  primary: '#10b981',
  secondary: '#d1fae5',
  background: '#ffffff', 
  text: '#1e293b'
}
```

## 📱 Responsive Design

The widget automatically adapts to different screen sizes:

- **Desktop** - Full-featured 320x400px widget
- **Tablet** - Optimized touch interactions
- **Mobile** - Responsive sizing and touch-friendly buttons

## 📈 Performance

### Bundle Size
- Main widget: ~20KB gzipped
- Dependencies: React + ReactDOM (externalized)
- Total impact: < 50KB additional payload

### Loading Strategy
- Lazy loading of dependencies
- Code splitting for optimal bundle size
- Efficient event handling
- Minimal DOM manipulation

## 🧪 Testing

### Local Development

1. Build the widget:
```bash
cd widget-build
npm run build
```

2. Serve the test site:
```bash
python3 -m http.server 3000
```

3. Open http://localhost:3000/test-site.html

### Testing Checklist

- [ ] Widget loads correctly
- [ ] Chat functionality works
- [ ] Responsive design on mobile
- [ ] Theme customization works
- [ ] Position changes work
- [ ] No console errors

## 🚨 Troubleshooting

### Common Issues

**Widget doesn't appear:**
- Check browser console for errors
- Verify API URL is correct and accessible
- Ensure React dependencies are loaded

**Chat doesn't work:**
- Verify backend is running and accessible
- Check API endpoint URLs
- Check browser console for errors

**Styling issues:**
- Check for CSS conflicts
- Verify theme configuration
- Test in different browsers

### Debug Mode

Enable debug logging:
```javascript
window.KNOWME_WIDGET_DEBUG = true;
KnowmeWidget.init(config);
```

## 🇹🇭 คำอธิบายภาษาไทย

### Widget นี้สร้างด้วยอะไร?

- **React 18** - Framework สำหรับสร้าง UI
- **TypeScript** - เพิ่ม Type Safety
- **Webpack 5** - Bundle และ optimize โค้ด
- **CSS-in-JS** - Style แบบ inline

### วิธี Build และ Deploy Widget

#### แบบ Local Build
```bash
# 1. Build Widget
cd widget-build
npm install
npm run build

# 2. อัพโหลดไฟล์ไปยัง CDN
# - knowme-widget.js
# - embed.js  
# - demo.html
```

#### แบบ Docker Build
```bash
# 1. Build ด้วย Docker
docker build -f Dockerfile.widget -t knowme-widget .

# 2. รัน container เพื่อ serve ไฟล์
docker run -d -p 3100:80 --name widget-server knowme-widget

# 3. เข้าถึงไฟล์ได้ที่:
# - http://localhost:3100/knowme-widget.js
# - http://localhost:3100/embed.js
```

#### แบบ Docker Compose (รัน พร้อม Backend + Frontend)
```bash
# Production deployment
docker-compose up --build

# Development deployment (with hot reload)
docker-compose -f docker-compose.dev.yml up --build

# เข้าถึงได้ที่:
# - Backend API: http://localhost:8000
# - Frontend App: http://localhost:3000
# - Widget Files: http://localhost:3100
```

### 🔧 การแก้ปัญหา CORS

Widget ส่ง origin information ไปยัง backend เพื่อ debug CORS:

1. **Widget ส่งข้อมูล origin** ใน request headers และ body
2. **Backend log origin** เพื่อตรวจสอบ CORS
3. **Backend รองรับ wildcard origins** สำหรับ widget

```javascript
// Widget ส่ง origin อัตโนมัติ
headers: {
  "Content-Type": "application/json",
  "Origin": window.location.origin,
  "X-Widget-Origin": window.location.origin,
}
```

#### แบบ Docker + Volume (สำหรับ Development)
```bash
# Extract ไฟล์จาก container มาใช้
docker build -f Dockerfile.widget -t knowme-widget .
docker create --name temp-widget knowme-widget
docker cp temp-widget:/usr/share/nginx/html ./widget-dist
docker rm temp-widget
```

### ขั้นตอนการใช้งาน

1. **Build Widget** จาก source code (แบบ local หรือ Docker)
2. **Deploy** ด้วย CDN, static hosting, หรือ Docker container
3. **เพิ่ม script tag** ในเว็บไซต์ที่ต้องการใช้:
   ```html
   <script src="https://your-domain.com/embed.js" 
           data-api-url="https://your-api.com"></script>
   ```
4. **กำหนดค่า** theme และ position ตามต้องการ

---

*Built with React and TypeScript. Designed for professional portfolios and personal branding websites.*