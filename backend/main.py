from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.common_tools.duckduckgo import duckduckgo_search_tool
import httpx
import asyncio
from typing import List, Optional, Dict, Any
import json
from datetime import datetime
import logging
import traceback
import PyPDF2
import fitz  # PyMuPDF
import io
from fastapi import UploadFile, File
from pdf_extract import insert_data, reterive_data
from agent_try import (
    create_agent,
    founder_profile_task,
    industry_analysis_task,
    technology_analysis_task,
    revenue_stream_task,
    competitor_analysis_task,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="InvestIQ Backend", version="1.0.0")

# CORS middleware - Updated for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://35.200.237.52:8000",
        "https://investiq-*.vercel.app",
        "https://*.appspot.com",  # App Engine domain
        "https://*.run.app",  # Cloud Run domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class WebSearchResult(BaseModel):
    url: str
    title: str
    content: str
    relevance_score: float = Field(ge=0, le=1)


class InvestmentAnalysis(BaseModel):
    executive_summary: str = Field(description="2-3 sentence executive summary")
    key_strengths: List[str] = Field(description="List of key strengths")
    risk_factors: List[str] = Field(description="List of risk factors")
    market_opportunity: str = Field(description="Market opportunity assessment")
    financial_health_score: int = Field(
        description="Financial health score 1-10", ge=1, le=10
    )
    investment_recommendation: str = Field(
        description="Investment recommendation: Strong Buy/Buy/Hold/Pass"
    )
    due_diligence_questions: List[str] = Field(
        description="Key due diligence questions"
    )
    pitch_deck_assessment: Optional[str] = Field(
        description="Pitch deck quality assessment if provided"
    )


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str
    tools_used: Optional[List[str]] = None


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []
    company_data: Optional[str] = None
    pitch_deck_text: Optional[str] = None
    financials: Optional[str] = None
    market_data: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    tools_used: List[str] = []
    web_search_results: Optional[List[WebSearchResult]] = None
    timestamp: str


# API Routes
@app.get("/")
async def root():
    return {"message": "InvestIQ Backend API", "status": "running"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle conversational chat with the InvestIQ agent."""
    try:
        logger.info(f"Starting chat request: {request.message[:100]}...")

        # Prepare conversation context
        conversation_context = f"""
        User Message: {request.message}
        
        Additional Context:
        - Company Data: {request.company_data or 'Not provided'}
        - Pitch Deck Text: {request.pitch_deck_text or 'Not provided'}
        - Financial Information: {request.financials or 'Not provided'}
        - Market Data: {request.market_data or 'Not provided'}
        
        Please respond as InvestIQ, providing helpful investment analysis and insights.
        Use the available tools to gather additional information if needed.
        """

        # Run the agent
        agent = await create_agent()
        logger.info("Running InvestIQ agent...")
        result = await agent.run(conversation_context)
        logger.info(f"Agent result type: {type(result)}")
        logger.info(
            f"Agent result data type: {type(result.data) if hasattr(result, 'data') else 'No data attribute'}"
        )

        # Extract tools used from the result
        tools_used = []
        if hasattr(result, "messages"):
            logger.info(f"Result has {len(result.messages)} messages")
            for i, msg in enumerate(result.messages):
                logger.info(f"Message {i}: {type(msg)}")
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    tools_used.extend([call.name for call in msg.tool_calls])
                    logger.info(
                        f"Tool calls found: {[call.name for call in msg.tool_calls]}"
                    )

        # Handle different response types
        # The agent result has an 'output' attribute, not 'data'
        if hasattr(result, "output"):
            if hasattr(result.output, "executive_summary"):
                message = result.output.executive_summary
                logger.info("Using executive_summary from result output")
            elif hasattr(result.output, "message"):
                message = result.output.message
                logger.info("Using message from result output")
            elif isinstance(result.output, str):
                message = result.output
                logger.info("Using string result output")
            else:
                message = str(result.output)
                logger.info(
                    f"Converting result output to string: {type(result.output)}"
                )
        else:
            # Fallback to string representation of the entire result
            message = str(result)
            logger.info(f"Using string representation of result: {type(result)}")

        logger.info("Chat request completed successfully")
        return ChatResponse(
            message=message, tools_used=tools_used, timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        error_msg = f"Chat failed: {str(e)}"
        logger.error(f"Error in chat endpoint: {error_msg}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/api/analyze-pdf")
async def analyze_pdf_endpoint(
    pdf_file: UploadFile = File(...), analysis_type: str = "investment_document"
):
    """Upload and analyze PDF documents for investment insights."""
    try:
        logger.info(f"PDF upload request: {pdf_file.filename}, type: {analysis_type}")

        # Validate file type
        if not pdf_file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        # Save the uploaded file temporarily
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            content = await pdf_file.read()
            temp_file.write(content)
            temp_pdf_path = temp_file.name

            # Insert data into vector database using pdf_extract.py
            logger.info(f"Inserting PDF data into vector database: {pdf_file.filename}")
            await insert_data(temp_pdf_path)
            logger.info("PDF data successfully inserted into vector database")

            results = {}

            # Run all analysis tasks in sequence
            try:
                logger.info("Running founder profile analysis...")
                results["founder_profile"] = await founder_profile_task()
                logger.info("Founder profile analysis completed")
            except Exception as e:
                logger.error(f"Founder profile analysis failed: {str(e)}")
                results["founder_profile"] = {"error": str(e)}

            try:
                logger.info("Running industry analysis...")
                results["industry_analysis"] = await industry_analysis_task()
                logger.info("Industry analysis completed")
            except Exception as e:
                logger.error(f"Industry analysis failed: {str(e)}")
                results["industry_analysis"] = {"error": str(e)}

            try:
                logger.info("Running technology analysis...")
                results["technology_analysis"] = await technology_analysis_task()
                logger.info("Technology analysis completed")
            except Exception as e:
                logger.error(f"Technology analysis failed: {str(e)}")
                results["technology_analysis"] = {"error": str(e)}

            try:
                logger.info("Running revenue stream analysis...")
                results["revenue_stream"] = await revenue_stream_task()
                logger.info("Revenue stream analysis completed")
            except Exception as e:
                logger.error(f"Revenue stream analysis failed: {str(e)}")
                results["revenue_stream"] = {"error": str(e)}

            try:
                logger.info("Running competitor analysis...")
                results["competitor_analysis"] = await competitor_analysis_task()
                logger.info("Competitor analysis completed")
            except Exception as e:
                logger.error(f"Competitor analysis failed: {str(e)}")
                results["competitor_analysis"] = {"error": str(e)}

            # Add metadata
            results["metadata"] = {
                "timestamp": datetime.now().isoformat(),
                "pipeline_status": "completed",
                "tasks_run": [
                    "founder_profile",
                    "industry_analysis",
                    "technology_analysis",
                    "revenue_stream",
                    "competitor_analysis",
                ],
            }

        return results

    except Exception as e:
        error_msg = f"PDF analysis failed: {str(e)}"
        logger.error(f"Error in analyze_pdf_endpoint: {error_msg}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn
    import os

    # Get port from environment variable (required for App Engine)
    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(app, host="0.0.0.0", port=port)
