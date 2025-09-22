from google import genai
import os
from typing import List, Dict
from google.genai.types import Tool, GoogleSearch, GenerateContentConfig

google_search_tool = Tool(google_search=GoogleSearch())

# === Set up your API key and project ===
project_name = "Gemini"  # not required by SDK but keep for your reference

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

async def gemini_inference(model_name: str, system_instruction: str, query: str, all_images: List[Dict]=None, web_search: bool=False):
    """
    Process images using Gemini API
    
    Args:
        system_instruction: System instruction for Gemini API
        query: Query string for image analysis
        all_images: List of image data with format [{"text": "caption", "image": "base64_data"}]
        web_search: Whether to use web search or not
    """
    if all_images:
        contents = []
        for image_item in all_images:
            contents.append({"text": image_item['text']})
            contents.append({"inline_data": {"mime_type": "image/jpeg", "data": image_item['image']}})
        contents.append({"text": query})
    else:
        contents = query
    if web_search:
        response = client.models.generate_content(model=model_name,
                                               contents=contents,
                                               config= GenerateContentConfig(
                                                   system_instruction=system_instruction,
                                                   tools=[google_search_tool],
                                                   response_modalities=["TEXT"],
                                                   seed = 42,
                                                   temperature = 0.0,
                                                #    max_output_tokens = 4000,
                                                #    top_p = 1.0,
                                                #    top_k = 40.0
                                               )
                                               )
        print(f"response from gemini: {response.text}")
        return response.text                                   
    else:
        response = client.models.generate_content(model=model_name,
                                               contents=contents,
                                               config=GenerateContentConfig(
                                                   system_instruction=system_instruction,
                                                   response_modalities=["TEXT"],
                                                   seed = 42,
                                                   temperature = 0.1,
                                               ),
                                               )
        return response.text


async def gemini_inference_stream(model_name: str, system_instruction: str, query: str, all_images: List[Dict]=None, web_search: bool=False):
    """
    Process images using Gemini API and stream the response
    
    Args:
        system_instruction: System instruction for Gemini API
        query: Query string for image analysis
        all_images: List of image data with format [{"text": "caption", "image": "base64_data"}]    
        web_search: Whether to use web search or not
    """
    if all_images:
        contents = []
        for image_item in all_images:
            contents.append({"text": image_item['text']})
            contents.append({"inline_data": {"mime_type": "image/jpeg", "data": image_item['image']}})
        contents.append({"text": query})
    else:
        contents = query
    if web_search:
        response = client.models.generate_content_stream(model=model_name,
                                               contents=contents,
                                               config= GenerateContentConfig(
                                                   system_instruction=system_instruction,
                                                   tools=[google_search_tool],
                                                   response_modalities=["TEXT"],
                                                   seed = 42,
                                                   temperature = 0.0,
                                                   top_p = 1.0,
                                                   top_k = 1.0
                                               )
                                               )

        for chunk in response:
            yield chunk.text
    else:
        response = client.models.generate_content_stream(model=model_name,
                                               contents=contents,
                                               config=GenerateContentConfig(
                                                   system_instruction=system_instruction,
                                                   response_modalities=["TEXT"],
                                                   seed = 42,
                                                   temperature = 0.2,
                                                   top_p = 0.95,
                                                   top_k = 40
                                               ),
                                               )
        for chunk in response:
            yield chunk.text
