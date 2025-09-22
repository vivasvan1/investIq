from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="InvestIQ Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://investiq-*.vercel.app"],
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
    financial_health_score: int = Field(description="Financial health score 1-10", ge=1, le=10)
    investment_recommendation: str = Field(description="Investment recommendation: Strong Buy/Buy/Hold/Pass")
    due_diligence_questions: List[str] = Field(description="Key due diligence questions")
    pitch_deck_assessment: Optional[str] = Field(description="Pitch deck quality assessment if provided")

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

# Dependencies
class InvestIQDependencies:
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)

# Initialize models
# GPT-OSS for main agent with tools support
gpt_oss_model = OpenAIChatModel(
    model_name='gpt-oss:20b',
    provider=OllamaProvider(base_url='http://localhost:11434/v1'),
)

# Ollama model for vision tasks
ollama_model = OpenAIChatModel(
    model_name='gemma3:4b',
    provider=OllamaProvider(base_url='http://localhost:11434/v1'),
)

# Create the InvestIQ agent with GPT-OSS for tools support
investiq_agent = Agent(
    gpt_oss_model,
    deps_type=InvestIQDependencies,
    output_type=InvestmentAnalysis,
    tools=[duckduckgo_search_tool()],
    instructions="""You are InvestIQ, an AI investment analyst assistant. You can:
1. Analyze investment opportunities using structured data
2. Research companies using web search
3. Provide market insights and investment recommendations
4. Answer questions about startups, funding, and investments

Always provide professional, data-driven investment analysis with clear recommendations.
Use the available tools to gather real-time information when needed.""",
)

# Note: DuckDuckGo search tool is already available to the agent through the tools list
# The agent will automatically use it when needed for web searches

# Company research tool
@investiq_agent.tool
async def research_company(
    ctx: RunContext[InvestIQDependencies],
    company_name: str,
    research_type: str = "comprehensive"
) -> str:
    """Research a specific company for investment analysis."""
    try:
        logger.info(f"Researching company: {company_name}, type: {research_type}")
        
        # Simulate company research
        research_data = {
            "company_name": company_name,
            "research_type": research_type,
            "findings": f"Comprehensive research on {company_name} including financial performance, market position, competitive landscape, and growth prospects.",
            "key_metrics": {
                "revenue_growth": "15% YoY",
                "market_share": "5%",
                "funding_rounds": "Series A - $5M",
                "valuation": "$25M"
            }
        }
        
        logger.info(f"Company research completed for {company_name}")
        return json.dumps(research_data, indent=2)
    except Exception as e:
        logger.error(f"Error in research_company: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return f"Error researching company: {str(e)}"

# Market analysis tool
@investiq_agent.tool
async def analyze_market(
    ctx: RunContext[InvestIQDependencies],
    industry: str,
    region: str = "global"
) -> str:
    """Analyze market conditions for a specific industry and region."""
    try:
        logger.info(f"Analyzing market: {industry} in {region}")
        
        market_analysis = {
            "industry": industry,
            "region": region,
            "market_size": "$50B TAM",
            "growth_rate": "12% CAGR",
            "key_trends": [
                "Digital transformation acceleration",
                "Increased funding in early-stage companies",
                "Focus on sustainable technologies"
            ],
            "competitive_landscape": "Highly competitive with 200+ players",
            "regulatory_environment": "Favorable with new supportive policies"
        }
        
        logger.info(f"Market analysis completed for {industry} in {region}")
        return json.dumps(market_analysis, indent=2)
    except Exception as e:
        logger.error(f"Error in analyze_market: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return f"Error analyzing market: {str(e)}"

# Vision analysis tool using gemma3:4b
@investiq_agent.tool
async def analyze_image(
    ctx: RunContext[InvestIQDependencies],
    image_url: str,
    analysis_type: str = "investment_document"
) -> str:
    """Analyze images, documents, or charts for investment insights using vision capabilities."""
    try:
        logger.info(f"Analyzing image: {image_url}, type: {analysis_type}")
        
        # Create a separate agent for vision tasks using gemma3:4b
        vision_agent = Agent(
            ollama_model,
            instructions=f"""You are a vision analysis specialist for investment documents. 
            Analyze the provided image and extract key information relevant to investment analysis.
            Focus on: financial data, charts, graphs, company information, market trends, and any numerical data.
            Provide a structured analysis of what you see in the image."""
        )
        
        # For now, return a mock analysis since we need to implement image loading
        # In production, you would load the image and pass it to the vision agent
        analysis_result = {
            "image_url": image_url,
            "analysis_type": analysis_type,
            "findings": f"Vision analysis of {image_url} - This would contain extracted text, charts, and financial data from the image.",
            "key_metrics": {
                "extracted_text": "Sample extracted text from document",
                "charts_detected": 2,
                "financial_data_points": 15,
                "confidence_score": 0.85
            }
        }
        
        logger.info(f"Vision analysis completed for {image_url}")
        return json.dumps(analysis_result, indent=2)
    except Exception as e:
        logger.error(f"Error in analyze_image: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return f"Error analyzing image: {str(e)}"

# PDF analysis tool with comprehensive research
@investiq_agent.tool
async def analyze_pdf(
    ctx: RunContext[InvestIQDependencies],
    pdf_content: str,
    analysis_type: str = "investment_document"
) -> str:
    """Analyze PDF documents for investment insights with comprehensive research."""
    try:
        logger.info(f"Analyzing PDF document, type: {analysis_type}")
        
        # First, extract key information from PDF using gemma3:4b
        pdf_agent = Agent(
            ollama_model,
            instructions=f"""You are a PDF document analysis specialist for investment documents. 
            Analyze the provided PDF content and extract key information relevant to investment analysis.
            Focus on: financial data, company information, market analysis, revenue figures, growth metrics, 
            competitive analysis, and any numerical data that would be relevant for investment decisions.
            
            Extract the following key information:
            1. Company name and business description
            2. Financial metrics (revenue, growth, profitability)
            3. Market size and opportunity
            4. Competitive landscape mentions
            5. Key risks and challenges
            6. Growth strategy and plans
            
            Provide a structured analysis of the document content."""
        )
        
        # Run the PDF analysis
        deps = InvestIQDependencies()
        pdf_result = await pdf_agent.run(f"Analyze this PDF document for investment insights:\n\n{pdf_content[:4000]}", deps=deps)
        pdf_analysis = str(pdf_result.output) if hasattr(pdf_result, 'output') else str(pdf_result)
        
        # Extract company name for further research
        company_name = "Unknown Company"
        if "company" in pdf_content.lower() or "inc" in pdf_content.lower() or "corp" in pdf_content.lower():
            # Try to extract company name from content
            lines = pdf_content.split('\n')[:50]  # Check first 50 lines
            for line in lines:
                if any(word in line.lower() for word in ['inc', 'corp', 'llc', 'ltd', 'company']):
                    company_name = line.strip()
                    break
        
        # Perform comprehensive research using the main agent with tools
        research_queries = [
            f"{company_name} competitors analysis",
            f"{company_name} financial performance market research",
            f"{company_name} industry analysis market size",
            f"{company_name} funding rounds investment news"
        ]
        
        research_results = []
        for query in research_queries:
            try:
                logger.info(f"Researching: {query}")
                # Use the main agent to perform web search
                research_result = await investiq_agent.run(f"Search for: {query}", deps=deps)
                research_results.append({
                    "query": query,
                    "result": str(research_result.output) if hasattr(research_result, 'output') else str(research_result)
                })
            except Exception as e:
                logger.warning(f"Research query failed for {query}: {e}")
                research_results.append({
                    "query": query,
                    "result": f"Research failed: {str(e)}"
                })
        
        # Compile comprehensive analysis
        comprehensive_analysis = {
            "pdf_analysis": pdf_analysis,
            "company_name": company_name,
            "web_research": research_results,
            "analysis_type": analysis_type,
            "document_length": len(pdf_content),
            "key_sections": [
                "Executive Summary",
                "Financial Performance", 
                "Market Analysis",
                "Competitive Landscape",
                "Risk Assessment",
                "Web Research Findings"
            ],
            "confidence_score": 0.90
        }
        
        logger.info(f"Comprehensive PDF analysis completed for {analysis_type}")
        return json.dumps(comprehensive_analysis, indent=2)
    except Exception as e:
        logger.error(f"Error in analyze_pdf: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return f"Error analyzing PDF: {str(e)}"

# Helper function to extract text from PDF
async def extract_pdf_text(pdf_file: UploadFile) -> str:
    """Extract text content from uploaded PDF file."""
    try:
        # Read the PDF file
        pdf_content = await pdf_file.read()
        
        # Try PyMuPDF first (better for complex PDFs)
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            logger.warning(f"PyMuPDF failed, trying PyPDF2: {e}")
            
            # Fallback to PyPDF2
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
            
    except Exception as e:
        logger.error(f"Error extracting PDF text: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

# API Routes
@app.get("/")
async def root():
    return {"message": "InvestIQ Backend API", "status": "running"}

@app.post("/api/analyze", response_model=InvestmentAnalysis)
async def analyze_investment(request: ChatRequest):
    """Analyze an investment opportunity with structured output."""
    try:
        logger.info(f"Starting investment analysis for request: {request.message[:100]}...")
        
        # Prepare context for analysis
        analysis_context = f"""
        Company Data: {request.company_data or 'Not provided'}
        Pitch Deck Text: {request.pitch_deck_text or 'Not provided'}
        Financial Information: {request.financials or 'Not provided'}
        Market Data: {request.market_data or 'Not provided'}
        
        Please provide a comprehensive investment analysis based on the provided information.
        """
        
        # Run the agent
        deps = InvestIQDependencies()
        result = await investiq_agent.run(analysis_context, deps=deps)
        
        logger.info("Investment analysis completed successfully")
        # The agent result has an 'output' attribute, not 'data'
        if hasattr(result, 'output'):
            return result.output
        else:
            # Fallback to string representation
            return str(result)
    except Exception as e:
        error_msg = f"Analysis failed: {str(e)}"
        logger.error(f"Error in analyze_investment: {error_msg}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)

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
        deps = InvestIQDependencies()
        logger.info("Running InvestIQ agent...")
        result = await investiq_agent.run(conversation_context, deps=deps)
        logger.info(f"Agent result type: {type(result)}")
        logger.info(f"Agent result data type: {type(result.data) if hasattr(result, 'data') else 'No data attribute'}")
        
        # Extract tools used from the result
        tools_used = []
        if hasattr(result, 'messages'):
            logger.info(f"Result has {len(result.messages)} messages")
            for i, msg in enumerate(result.messages):
                logger.info(f"Message {i}: {type(msg)}")
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    tools_used.extend([call.name for call in msg.tool_calls])
                    logger.info(f"Tool calls found: {[call.name for call in msg.tool_calls]}")
        
        # Handle different response types
        # The agent result has an 'output' attribute, not 'data'
        if hasattr(result, 'output'):
            if hasattr(result.output, 'executive_summary'):
                message = result.output.executive_summary
                logger.info("Using executive_summary from result output")
            elif hasattr(result.output, 'message'):
                message = result.output.message
                logger.info("Using message from result output")
            elif isinstance(result.output, str):
                message = result.output
                logger.info("Using string result output")
            else:
                message = str(result.output)
                logger.info(f"Converting result output to string: {type(result.output)}")
        else:
            # Fallback to string representation of the entire result
            message = str(result)
            logger.info(f"Using string representation of result: {type(result)}")
        
        logger.info("Chat request completed successfully")
        return ChatResponse(
            message=message,
            tools_used=tools_used,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        error_msg = f"Chat failed: {str(e)}"
        logger.error(f"Error in chat endpoint: {error_msg}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/analyze-image")
async def analyze_image_endpoint(request: dict):
    """Analyze images for investment insights using vision capabilities."""
    try:
        logger.info(f"Vision analysis request: {request.get('image_url', 'No URL provided')}")
        
        image_url = request.get('image_url', '')
        analysis_type = request.get('analysis_type', 'investment_document')
        
        if not image_url:
            raise HTTPException(status_code=400, detail="image_url is required")
        
        # Create dependencies and run vision analysis
        deps = InvestIQDependencies()
        
        # Use the vision agent directly
        vision_agent = Agent(
            ollama_model,
            instructions=f"""You are a vision analysis specialist for investment documents. 
            Analyze the provided image and extract key information relevant to investment analysis.
            Focus on: financial data, charts, graphs, company information, market trends, and any numerical data.
            Provide a structured analysis of what you see in the image."""
        )
        
        # For now, return mock analysis - in production you'd load and analyze the actual image
        analysis_result = {
            "image_url": image_url,
            "analysis_type": analysis_type,
            "findings": f"Vision analysis of {image_url} - This would contain extracted text, charts, and financial data from the image.",
            "key_metrics": {
                "extracted_text": "Sample extracted text from document",
                "charts_detected": 2,
                "financial_data_points": 15,
                "confidence_score": 0.85
            },
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info("Vision analysis completed successfully")
        return analysis_result
    except Exception as e:
        error_msg = f"Vision analysis failed: {str(e)}"
        logger.error(f"Error in analyze_image_endpoint: {error_msg}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/analyze-pdf")
async def analyze_pdf_endpoint(
    pdf_file: UploadFile = File(...),
    analysis_type: str = "investment_document"
):
    """Upload and analyze PDF documents for investment insights."""
    try:
        logger.info(f"PDF upload request: {pdf_file.filename}, type: {analysis_type}")
        
        # Validate file type
        if not pdf_file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Extract text from PDF
        pdf_text = await extract_pdf_text(pdf_file)
        logger.info(f"Extracted {len(pdf_text)} characters from PDF")
        
        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="No text content found in PDF")
        
        # Create dependencies and run PDF analysis
        deps = InvestIQDependencies()
        
        # Use the PDF analysis tool
        analysis_result = await analyze_pdf(deps, pdf_text, analysis_type)
        
        # Parse the JSON result
        try:
            analysis_data = json.loads(analysis_result)
        except json.JSONDecodeError:
            analysis_data = {
                "analysis_type": analysis_type,
                "findings": analysis_result,
                "document_length": len(pdf_text),
                "filename": pdf_file.filename,
                "timestamp": datetime.now().isoformat()
            }
        
        analysis_data["filename"] = pdf_file.filename
        analysis_data["timestamp"] = datetime.now().isoformat()
        
        logger.info("PDF analysis completed successfully")
        return analysis_data
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
    uvicorn.run(app, host="0.0.0.0", port=8000)