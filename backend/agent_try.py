import os
import asyncio
from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.tools import Tool
from pydantic_ai.common_tools.duckduckgo import duckduckgo_search_tool
from pdf_extract import reterive_data
from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import (
    AgentStreamEvent,
    FinalResultEvent,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    PartDeltaEvent,
    PartStartEvent,
    TextPartDelta,
    ThinkingPartDelta,
    ToolCallPartDelta,
)

api_key = "AIzaSyDKykjkSPXZRcT0N_e6i3JL5q3ijlOt06s"
os.environ["GEMINI_API_KEY"] = api_key

provider = GoogleProvider(api_key=os.environ.get("GEMINI_API_KEY"))
model = GoogleModel('gemini-2.0-flash', provider=provider)
output_messages: list[str] = []

async def event_stream_handler(
    ctx,
    event_stream,
):
    async for event in event_stream:
        if isinstance(event, PartStartEvent):
            output_messages.append(f'[Request] Starting part {event.index}: {event.part!r}')
        elif isinstance(event, PartDeltaEvent):
            if isinstance(event.delta, TextPartDelta):
                output_messages.append(f'[Request] Part {event.index} text delta: {event.delta.content_delta!r}')
            elif isinstance(event.delta, ThinkingPartDelta):
                output_messages.append(f'[Request] Part {event.index} thinking delta: {event.delta.content_delta!r}')
            elif isinstance(event.delta, ToolCallPartDelta):
                output_messages.append(f'[Request] Part {event.index} args delta: {event.delta.args_delta}')
        elif isinstance(event, FunctionToolCallEvent):
            output_messages.append(
                f'[Tools] The LLM calls tool={event.part.tool_name!r} with args={event.part.args} (tool_call_id={event.part.tool_call_id!r})'
            )
        elif isinstance(event, FunctionToolResultEvent):
            output_messages.append(f'[Tools] Tool call {event.tool_call_id!r} returned => {event.result.content}')
        elif isinstance(event, FinalResultEvent):
            output_messages.append(f'[Result] The model starting producing a final result (tool_name={event.tool_name})')
    print(f"output_messages: {output_messages}")

async def create_agent():
    # Create local retrieval tool
    retrieval_tool = Tool(
        function=reterive_data,
        description="Get company specific data from the local database loaded from pitch deck"
    )
    
    # Create DuckDuckGo search tool
    search_tool = duckduckgo_search_tool()
    
    # Combine all tools
    all_tools = [search_tool, retrieval_tool]
    
    prompt = """
    You are an AI investment analyst assistant.
    You are provided with the following tools:
    - duckduckgo_search: to search the web for any specific information using DuckDuckGo
    - reterive_data: to get the company specific data from the local database. This database is loaded from the pitch deck provided by the company.
    You will be given a task, you should retrieve the information of the company using the reterive_data tool and use the duckduckgo_search tool to get any specific information from the web.
    Make sure to complete the task thoroughly.
    """
    
    agent = Agent(model, tools=all_tools, instructions=prompt)
    return agent

async def founder_profile_task():
    prompt = """
    Perform founder profile analysis of the company. Mention Education, Work experience, any previously founded companies, etc. Use linkedin and other web sources to identify the founder and his/her profile.
    Based on the research, provide a json format response as below.
    ```json
    {   "Founder1": {
        "name": "text",
        "education": "text",
        "work_experience": "text",
        "previously_founded_companies": "text"
        },
        "Founder2": {
            "name": "text",
            "education": "text",
            "work_experience": "text",
            "previously_founded_companies": "text"
        },
        ...
    }
    ```
    Strictly follow the json format and do not miss any information. The json should contain the information of all the founders.
    Your task is completed after you search the web and identify information for all the founders.
    """
    agent = await create_agent()
    result = await agent.run(prompt)
    return result.output

async def industry_analysis_task():
    prompt = """
    Perform industry and market analysis of the company.
    Step 1: Identify the industry of the company using reterive_data tool and it's market size.
    Step 2: Perform research using 'duckduckgo_search' tool on the identified industry domain on key terms such as market size, growth potential, key risks and challenges, recent news, growth strategy and plans. Verfiy the market size from the website and compare it with the market size from the reterive_data tool.
            When you need to research information, you MUST call the `duckduckgo_search` tool. Example call: {"name": "duckduckgo_search","arguments": {"query": "global data analytics market size 2024"}}
    Step 3: Based on the research, provide a json format response as below.
    ```json
    {
        "industry": {"data": "text", "data_source_url": "<url>"},
        "market_size": {"data": "text", "data_source_url": "<url>"},
        "recent_news": {"data": "text", "data_source_url": "<url>"},
        "growth_potential": {"data": "text", "data_source_url": "<url>"},
        "key_risks_and_challenges": {"data": "text", "data_source_url": "<url>"},
        "growth_strategy_and_plans": {"data": "text", "data_source_url": "<url>"}
    }
    ```
    Strictly search the web for the information and do not use the company data.
    Strictly follow the json format and do not miss any information. All the information should be from the website and provide the website url in the json.
    """
    agent = await create_agent()
    result = await agent.run(prompt)
    return result.output

async def technology_analysis_task():
    prompt = """
    Perform technology analysis of the company.
    Step 1: Identify the core technologies of the company using reterive_data tool and it's market size.
    Step 2: Perform research using 'duckduckgo_search' tool to get the information about various industries that uses the same technology and its market size. Verfiy the market size from the website and compare it with the market size from the reterive_data tool.
    Step 3: Based on the research, provide a json format response as below.
    ```json
    {
        "technology": "text",
        "industries_using_technology": 
        {
        {"industry": "text", "market_size": "text", "data_source_url": "<url>"},
        {"industry": "text", "market_size": "text", "data_source_url": "<url>"},
        ...
        }
        }
    }
    ```
    Strictly search the web for the information and do not use the company data.
    Strictly follow the json format and do not miss any information. All the information should be from the website and provide the website url in the json.
    """
    agent = await create_agent()
    result = await agent.run(prompt)
    return result.output

async def revenue_stream_task():
    prompt = """
    From the company data, Clearly define all sources of revenue. For each stream, include:
    ```json
    {
        "revenue_streams": [
            {"name": "<Name of the Revenue Stream (e.g., Subscription Fees, Commission, Product Sales).>", 
            "description": "<Description of the Revenue Stream>", 
            "target_audience": "<Target Audience i.e., Who is paying?>", 
            "percentage_contribution": "<Share of total revenue (if available)>"},
            ...
        ]
    }
    ```
    Strictly follow the json format and do not miss any information.
    """
    agent = await create_agent()
    result = await agent.run(prompt)
    print(f"result from revenue stream task: {result}")
    return result.output

async def competitor_analysis_task():
    prompt = """
   Perform competitor analysis and cover 2-3 competitors operating in the similar revenue model or advanced revenue model in comparison to the company.
   Step 1: Identify the competitors of the company using reterive_data tool if available.
   Step2: Also identify the revenue model, technology used and the target audience.
   Step 2: Use the duckduckgo_search tool to find the competitors and their information.
   Step 3: Based on the research, provide a json format response as below for all the competitors.
   ```json
   {
        "competitors": [
            {"Company Name ": "<Name of the Competitor>", 
            "Headquarters ": "<Headquarters of the Competitor company>", 
            "Founding Year ": "<Founding Year of the Competitor company>", 
            "Total Funding Raised": "<Total Funding Raised by the Competitor company>",
            "Funding Rounds ": "<number of Funding Rounds>"},
            "Investors ": "<List of Investors of the Competitor company>",
            "Revenue Streams ": "<List of Revenue Streams of the Competitor company>",
            "Business Model ": "<Business Model of the Competitor company>",
            "Gross Margin ": "<Gross Margin of the Competitor company>",
            "Net Margin ": "<Net Margin of the Competitor company>",
            "Current ARR ": "<Current ARR of the Competitor company>",
            "Current MRR ": "<Current MRR of the Competitor company>",
            "ARR Growth rate ": "<ARR Growth rate of the Competitor company>",
            "Churn Rate ": "<Churn Rate of the Competitor company>",
            "differentiating factors ": "<Differentiating factors of this company from the Competitor company>",
            },

            ...
        ]
   }
   ```
   Strictly follow the json format and do not miss any information.
   Strictly search the web for the information and do not use the company data.
   """
    agent = await create_agent()
    result = await agent.run(prompt)
    return result.output

# if __name__ == "__main__":
#     import asyncio
#     result = asyncio.run(founder_profile_task())
#     print(result)
   