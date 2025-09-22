import ollama
import os
from pathlib import Path
import json
from tqdm import tqdm
from pymilvus import MilvusClient
import base64
import fitz # PyMuPDF
from gemini_models import gemini_inference

milvus_client = MilvusClient(uri="./milvus_demo.db")
collection_name = "pdf_collection"
IMAGE_RESOLUTION_SCALE = 2.0


def emb_text(text):
    response = ollama.embed(
        model='embeddinggemma',
        input=text,
        )
    return response["embeddings"]

async def process_pdf(pdf_path):
    """
    Convert PDFs -> DoclingDocument -> HybridChunker -> contextualized text.
    Tables & figures are kept as coherent elements; contextualize() adds headers/captions.
    """
    texts= []
    doc = fitz.open(pdf_path, filetype="pdf")
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(IMAGE_RESOLUTION_SCALE, IMAGE_RESOLUTION_SCALE))
        
        # Get image bytes directly without saving to file
        image_bytes = pix.pil_tobytes(format="PNG")
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        response = await gemini_inference(model_name="gemini-2.5-flash-lite", 
            system_instruction="""
            You are a ppt slide extractor. You will be given a ppt slide and you will need to extract all the information from the slide.
            Do not miss any information from the slide.
            Always provide a response as a text formatted as below.
            <Slide_Title>: <Information about the slide>
            """, 
            query=f"""
            Extract all the information from the slide.
            """, 
            all_images=[{"text": "slide image", "image": image_base64}])

        texts.append(response)
    doc.close()
    
    return texts

def create_milvus_collection(collection_name, embedding_dim):
    if milvus_client.has_collection(collection_name):
        milvus_client.drop_collection(collection_name)
    milvus_client.create_collection(
    collection_name=collection_name,
    dimension=embedding_dim,
    metric_type="IP",  # Inner product distance
    consistency_level="Bounded",  # Supported values are (`"Strong"`, `"Session"`, `"Bounded"`, `"Eventually"`). See https://milvus.io/docs/consistency.md#Consistency-Level for more details.
    )

async def insert_data(pdf_path):
    embedding_dim = 768
    # Set path to downloaded PDFs folder
    # pdf_path = "/Users/harinI_narasimhan/ML-EVIN/personal/Company Data/01. Data stride/Sia - DSA-Pitch deck_V1-INR.pdf"

    # Process PDFs (specify max_pdfs=None to process all, or set a number like 5 for testing)
    max_pdfs_to_process = 1 # Change this number or set to None to process all PDFs
    texts = await process_pdf(pdf_path)

    collection = create_milvus_collection(collection_name, embedding_dim)
    data = []
    for i, chunk in enumerate(tqdm(texts, desc="Processing chunks")):
        embedding = emb_text(chunk)
        data.append({"id": i, "vector": embedding[0], "text": chunk})
    milvus_client.insert(collection_name=collection_name, data=data)

def reterive_data(query: str) -> str:  
    """Get necessary information from milvus database collection."""
    search_res = milvus_client.search(
    collection_name=collection_name,
    data=[emb_text(query)[0]],
    limit=3,
    search_params={"metric_type": "IP", "params": {}},
    output_fields=["text"],
    )
    retrieved_lines_with_distances = [
    (res["entity"]["text"], res["distance"]) for res in search_res[0]
    ]
    response = json.dumps(retrieved_lines_with_distances, indent=4)
    return response
if __name__ == "__main__":
    import asyncio
    pdf_path = "/Users/harinI_narasimhan/ML-EVIN/personal/Company Data/01. Data stride/Sia - DSA-Pitch deck_V1-INR.pdf"
    asyncio.run(insert_data(pdf_path))
    reterive_data("what is the target industry of the company?")


