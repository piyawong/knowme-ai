# Project Planning & Architecture

## 🏗️ Architecture Overview

### Backend Structure
```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration management
├── agents/              # LangChain agents
│   ├── resume_agent.py  # Main chatbot agent
│   └── prompts.py       # System prompts
├── api/                 # FastAPI routes
│   └── chat.py          # Chat endpoints
├── tools/               # Agent tools
│   └── resume_tools.py  # Resume data tools
├── models/              # Pydantic models
│   ├── chat.py          # Chat message models
│   └── resume.py        # Resume data models
└── data/                # Static data
    └── resume.json      # Resume information
```

### Frontend Structure
```
frontend/
├── app/                 # Next.js app directory
│   ├── page.tsx         # Main page
│   ├── layout.tsx       # Root layout
│   └── api/             # API routes
├── components/          # React components
│   ├── ChatInterface.tsx    # Main chat UI
│   ├── MessageBubble.tsx    # Message display
│   ├── MarkdownMessage.tsx  # Markdown rendering
│   └── TypingIndicator.tsx  # Loading indicator
├── lib/                 # Utilities
│   └── api.ts           # API client
└── styles/              # CSS files
    └── markdown.css     # Markdown styling
```

## 🧪 Testing Strategy

### Unit Tests (Backend)
- **Location**: `/tests/`
- **Framework**: Pytest
- **Coverage**: Individual functions, classes, and modules
- **Run Command**: `source venv/bin/activate && python -m pytest tests/ -v`

### Integration Tests (Backend)
- **Location**: `/tests/test_integration.py`
- **Framework**: Pytest with asyncio
- **Coverage**: API endpoints, agent workflows, tool integration
- **Run Command**: `source venv/bin/activate && python -m pytest tests/test_integration.py -v`

### E2E Tests (Frontend + Backend)
- **Location**: `/tests/e2e/`
- **Framework**: Playwright
- **Coverage**: Full user workflows, UI interactions, API integration
- **Run Command**: `cd frontend && npm run test:e2e`

### Testing Requirements
1. **Always test after task completion** - Run all relevant tests
2. **Minimum test coverage**:
   - Unit tests: 1 happy path, 1 edge case, 1 failure case
   - Integration tests: API endpoints and agent workflows
   - E2E tests: Critical user flows
3. **Test environment**: Use `venv` for Python tests

## 🎯 Development Guidelines

### Code Structure
- **Max file length**: 500 lines - refactor into modules if exceeded
- **Module organization**: Group by feature/responsibility
- **Imports**: Prefer relative imports within packages
- **Environment variables**: Use python-dotenv and load_env()

### Code Style
- **Language**: Python (backend), TypeScript (frontend)
- **Formatting**: Black for Python, Prettier for TypeScript
- **Type hints**: Required for all Python functions
- **Validation**: Pydantic for data validation
- **Documentation**: Google-style docstrings for all functions

### Frameworks & Tools
- **Backend**: FastAPI, LangChain, SQLAlchemy/SQLModel
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Testing**: Pytest, Playwright
- **DevOps**: Docker, Docker Compose

## 📝 Task Management

### File Structure
- `TASK.md` - Track current and completed tasks
- `PLANNING.md` - Architecture and guidelines (this file)
- `README.md` - Setup and usage instructions

### Task Workflow
1. Check `TASK.md` before starting new tasks
2. Add new tasks with brief description and date
3. Mark completed tasks immediately after finishing
4. Add discovered sub-tasks to "Discovered During Work" section

## 🔄 Development Workflow

### Before Starting
1. Read `PLANNING.md` for context
2. Check `TASK.md` for current tasks
3. Activate virtual environment: `source venv/bin/activate`

### During Development
1. Follow naming conventions and architecture patterns
2. Create tests for new features
3. Update existing tests when modifying logic
4. Keep files under 500 lines

### After Completion
1. Run all relevant tests:
   ```bash
   # Backend tests
   source venv/bin/activate
   python -m pytest tests/ -v
   
   # Frontend tests
   cd frontend
   npm run test:e2e
   
   # Linting
   cd frontend && npm run lint
   ruff check backend/
   ```
2. Mark tasks as completed in `TASK.md`
3. Update `README.md` if needed

## 🚀 Deployment

### Local Development
```bash
# Start with Docker Compose
docker-compose up --build

# Or start services separately
source venv/bin/activate
cd backend && uvicorn main:app --reload --port 8000
cd frontend && npm run dev
```

### Production
- Backend: FastAPI with Uvicorn
- Frontend: Next.js static export or server
- Database: PostgreSQL (if implemented)
- Deployment: Docker containers

## 🛡️ Security & Best Practices

### Environment Variables
- Store API keys in `.env` files
- Never commit secrets to repository
- Use environment-specific configurations

### Code Quality
- Type checking with mypy (backend) and TypeScript (frontend)
- Linting with ruff (backend) and ESLint (frontend)
- Code formatting with Black and Prettier
- Pre-commit hooks for quality checks

### Error Handling
- Graceful error handling in agents and APIs
- User-friendly error messages
- Proper logging and monitoring