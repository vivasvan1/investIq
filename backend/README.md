# InvestIQ Backend

A Python backend for InvestIQ using Pydantic AI for agentic investment analysis with web search capabilities.

## Features

- **Agentic AI**: Powered by Pydantic AI with Ollama integration
- **Web Search**: Built-in web search tools for real-time research
- **Structured Output**: Type-safe investment analysis using Pydantic models
- **Tool Integration**: Company research, market analysis, and web search tools
- **FastAPI**: High-performance async API with automatic documentation

## Prerequisites

- Python 3.8 or higher
- Ollama running locally with Gemma 3:4b model
- pip3

## Installation

1. **Install Ollama and the model:**
   ```bash
   # Install Ollama (if not already installed)
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Start Ollama
   ollama serve
   
   # Pull the Gemma 3:4b model
   ollama pull gemma3:4b
   ```

2. **Install Python dependencies:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

## Running the Backend

### Option 1: Using the startup script (recommended)
```bash
./start_backend.sh
```

### Option 2: Manual startup
```bash
cd backend
source venv/bin/activate
python start.py
```

The backend will start on `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `GET /api/health` - Detailed health check
- `POST /api/analyze` - Structured investment analysis
- `POST /api/chat` - Conversational chat with the AI agent

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## Available Tools

The InvestIQ agent has access to several tools:

1. **web_search**: Search the web for company and market information
2. **research_company**: Deep dive research on specific companies
3. **analyze_market**: Market analysis for industries and regions

## Configuration

Environment variables (optional):
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `RELOAD`: Enable auto-reload (default: true)

## Development

To run in development mode with auto-reload:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Troubleshooting

1. **Ollama not running**: Make sure Ollama is running on port 11434
2. **Model not found**: Ensure `gemma3:4b` model is pulled: `ollama pull gemma3:4b`
3. **Port conflicts**: Change the port in `start.py` or set the `PORT` environment variable
4. **CORS issues**: Check that the frontend URL is in the CORS allowed origins

## Architecture

The backend uses:
- **Pydantic AI**: For agentic AI capabilities with tool integration
- **FastAPI**: For the REST API
- **Ollama**: For local LLM inference
- **Pydantic**: For data validation and serialization
- **httpx**: For async HTTP requests

## License

MIT License
