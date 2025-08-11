# Knowme.ai - AI-Powered Resume Q&A Assistant

An intelligent, full-stack chatbot application that enables interactive conversations about professional resumes. Built with modern technologies including Next.js, FastAPI, and LangChain, this project demonstrates advanced AI agent implementation with custom tools, real-time streaming responses, and conversational memory.

## 🎯 Project Overview

Knowme.ai transforms static resume information into an interactive conversational experience. Users can naturally ask questions about professional background, skills, experience, and projects, receiving intelligent, context-aware responses powered by OpenAI's GPT models through LangChain agents.

## 🏗 Architecture

### Technology Stack
- **Backend**: FastAPI (Python 3.11+) with async/await support
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **AI Framework**: LangChain with OpenAI GPT-4 integration
- **Infrastructure**: Docker containerization with multi-stage builds
- **Testing**: Pytest for backend, comprehensive test coverage

### Key Components
- **LangChain Agent**: Custom resume agent with specialized tools for data retrieval
- **Streaming API**: Server-Sent Events (SSE) for real-time response streaming
- **Memory Management**: Session-based conversation history with context retention
- **Custom Tools**: Six specialized tools for accessing different resume sections
- **Type Safety**: Pydantic models for data validation and type hints throughout

## ✨ Features

### Core Functionality
- 🤖 **Intelligent Agent**: LangChain agent with custom tools for precise data retrieval
- 💬 **Real-time Streaming**: Character-by-character response streaming via SSE
- 🧠 **Conversation Memory**: Maintains context across multiple questions in a session
- 🔍 **Smart Search**: Full-text search across all resume sections with relevance ranking
- 📊 **Structured Data**: JSON-based resume data with comprehensive validation
- 🎨 **Modern UI**: Responsive chat interface with typing indicators and animations

### Technical Features
- 🐳 **Docker Ready**: Production and development Docker configurations
- ✅ **Full Test Coverage**: Unit, integration, and end-to-end tests
- 🔒 **CORS Configuration**: Secure cross-origin resource sharing
- 📝 **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- 🚦 **Health Checks**: Built-in health monitoring endpoints
- ⚡ **Hot Reloading**: Development mode with automatic code reloading

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone and setup environment**:
```bash
git clone <repository-url>
cd context-engineering-template

# Create virtual environment
python3 -m venv venv_linux
source venv_linux/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

2. **Configure environment**:
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key:
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

3. **Start the backend**:
```bash
cd backend
source ../venv_linux/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

4. **Start the frontend** (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```

5. **Visit the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Docker Deployment

For production deployment with Docker:

```bash
# Production deployment
docker-compose up --build

# Development with hot reloading
docker-compose -f docker-compose.dev.yml up --build
```

## API Endpoints

### Chat Endpoints

- `POST /api/chat` - Send a message and get complete response
- `POST /api/chat/stream` - Send a message and get streaming response
- `GET /api/chat/history/{session_id}` - Get conversation history
- `DELETE /api/chat/history/{session_id}` - Clear conversation history

### Utility Endpoints

- `GET /` - API information and available endpoints
- `GET /api/health` - Health check for monitoring

### Example API Usage

```bash
# Send a chat message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about your work experience"}'

# Test streaming endpoint
curl -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "What programming languages do you know?"}'
```

## Resume Data Customization

Edit `backend/data/resume.json` to customize the resume information:

```json
{
  "personal_info": {
    "name": "Your Name",
    "email": "your.email@example.com",
    "location": "Your City",
    "linkedin": "https://linkedin.com/in/yourprofile",
    "github": "https://github.com/yourusername"
  },
  "summary": "Your professional summary...",
  "education": [...],
  "experience": [...],
  "skills": {...},
  "projects": [...]
}
```

## Testing

Run the comprehensive test suite:

```bash
# Activate virtual environment
source venv_linux/bin/activate

# Run all tests with coverage
python -m pytest tests/ -v --cov=backend --cov-report=term-missing

# Run specific test categories
python -m pytest tests/test_resume_tools.py -v     # Tool tests
python -m pytest tests/test_resume_agent.py -v     # Agent tests
python -m pytest tests/test_chat_api.py -v         # API tests
python -m pytest tests/test_integration.py -v      # Integration tests
```

### Validation Commands

```bash
# Code formatting and linting
source venv_linux/bin/activate
ruff check backend/ tests/ --fix
black backend/ tests/

# Type checking (optional)
mypy backend/

# Frontend validation
cd frontend
npm run lint
npm run type-check
npm run build
```

## 📁 Project Structure

```
knowme-ai/
├── backend/                    # FastAPI Backend Application
│   ├── agents/                 # LangChain Agent Implementation
│   │   ├── __init__.py
│   │   ├── resume_agent.py     # Main agent with conversation memory & tool orchestration
│   │   └── prompts.py          # System prompts for agent personality & behavior
│   │
│   ├── api/                    # FastAPI Route Handlers
│   │   ├── __init__.py
│   │   └── chat.py             # Chat endpoints (REST & SSE streaming)
│   │
│   ├── data/                   # Resume Data Storage
│   │   └── resume.json         # Structured resume information (customizable)
│   │
│   ├── models/                 # Pydantic Data Models
│   │   ├── __init__.py
│   │   ├── chat.py             # Chat request/response models
│   │   └── resume.py           # Resume data structure validation
│   │
│   ├── tools/                  # Custom LangChain Tools
│   │   ├── __init__.py
│   │   └── resume_tools.py     # Six specialized tools for data retrieval:
│   │                           # - get_personal_info
│   │                           # - get_education
│   │                           # - get_experience
│   │                           # - get_skills
│   │                           # - get_projects
│   │                           # - search_resume
│   │
│   ├── config.py               # Application configuration & settings
│   ├── main.py                 # FastAPI app initialization & middleware
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # Next.js Frontend Application
│   ├── app/                    # Next.js App Router
│   │   ├── chat/
│   │   │   └── page.tsx        # Chat interface page
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Landing page with resume overview
│   │
│   ├── components/             # React Components
│   │   ├── ChatInterface.tsx   # Main chat UI with message handling
│   │   ├── MessageBubble.tsx   # Individual message display
│   │   └── TypingIndicator.tsx # Animated typing indicator
│   │
│   ├── lib/                    # Utility Libraries
│   │   └── api.ts              # Backend API client with streaming support
│   │
│   ├── next.config.js          # Next.js configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── package.json            # Node.js dependencies
│
├── tests/                      # Comprehensive Test Suite
│   ├── __init__.py
│   ├── test_resume_tools.py    # Unit tests for individual tools
│   ├── test_resume_agent.py    # Agent behavior & conversation tests
│   ├── test_chat_api.py        # API endpoint tests
│   └── test_integration.py     # End-to-end integration tests
│
├── Docker Configuration
│   ├── Dockerfile.backend      # Multi-stage backend container
│   ├── Dockerfile.frontend     # Multi-stage frontend container
│   ├── docker-compose.yml      # Production deployment
│   └── docker-compose.dev.yml  # Development with hot-reload
│
├── Project Configuration
│   ├── .env.example            # Environment variables template
│   ├── pytest.ini              # Pytest configuration
│   ├── CLAUDE.md               # AI development guidelines
│   └── README.md               # This file
```

### Component Details

#### Backend Components
- **Agent System**: Orchestrates tool usage and maintains conversation state
- **Tools**: Specialized functions for accessing specific resume sections
- **API Layer**: RESTful endpoints with streaming support via SSE
- **Models**: Type-safe data structures with validation
- **Configuration**: Environment-based settings management

#### Frontend Components
- **Chat Interface**: Real-time message handling with streaming support
- **UI Components**: Modular, reusable React components
- **API Client**: Async communication with backend services
- **Responsive Design**: Mobile-first approach with Tailwind CSS

#### Infrastructure
- **Docker**: Multi-stage builds for optimized container sizes
- **Health Checks**: Service monitoring and auto-restart capabilities
- **Networking**: Isolated container network for security
- **Volume Management**: Persistent data storage for resume information

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for LLM | Yes | - |
| `BACKEND_PORT` | Backend server port | No | 8000 |
| `CORS_ORIGINS` | Allowed CORS origins | No | ["http://localhost:3000"] |
| `RESUME_DATA_PATH` | Path to resume JSON file | No | ./backend/data/resume.json |
| `DEBUG` | Enable debug mode | No | false |
| `LOG_LEVEL` | Logging level | No | info |
| `FRONTEND_URL` | Frontend application URL | No | http://localhost:3000 |

## Troubleshooting

### Common Issues

**Import Errors**: Ensure virtual environment is activated
```bash
source venv_linux/bin/activate
```

**CORS Errors**: Verify `CORS_ORIGINS` includes your frontend URL

**OpenAI API Errors**: Check that `OPENAI_API_KEY` is valid and has sufficient credits

**Tool Call Errors**: Ensure resume.json follows the expected data structure

### Logs and Debugging

Enable debug mode for detailed logging:
```bash
# In .env file
DEBUG=true
LOG_LEVEL=debug
```

View container logs:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Contributing

1. Follow the patterns established in existing code
2. Add unit tests for new functionality
3. Ensure all validation gates pass before submitting
4. Update documentation for any new features

## License

This project is licensed under the MIT License. See LICENSE file for details.