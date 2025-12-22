from pdf2image import convert_from_bytes
import io
import ollama
import base64
from .pytypes import Slide, SlideDeck, LectureSeries
import hashlib
import openai
from thepipe.scraper import scrape_file
from thepipe.chunker import chunk_by_page
import asyncio


async def pdf_to_image_async(pdf: bytes):
    images = await asyncio.to_thread(convert_from_bytes, pdf)
    for img in images:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        yield buf.getvalue()


async def call_deepseek_ollama(slide: bytes) -> str:
    model = "deepseek-ocr:3b-bf16"
    response = ollama.chat(
        model=model,
        messages=[{"role": "user", "content": "\nFree OCR.", "images": [slide]}],
        stream=False,
    )
    return response["message"]["content"]


async def call_openai_ocr(slide: bytes) -> str:
    image_base64 = base64.b64encode(slide).decode("utf-8")
    client = openai.AsyncOpenAI(api_key="42", base_url="http://localhost:8000/v1")
    response = await client.chat.completions.create(
        model="deepseek-ai/DeepSeek-OCR",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "\nFree OCR."},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{image_base64}"},
                    },
                ],
            }
        ],
    )
    return response.choices[0].message.content


async def process_slide_deck(
    series: LectureSeries, deck_bytes: bytes, filename: str = ""
):
    deck_name = filename.rsplit(".", 1)[0] if filename else ""
    deck = SlideDeck(
        series_uuid=series.uuid,
        file_hash=hashlib.sha256(deck_bytes).hexdigest(),
        name=deck_name,
    )
    with open(deck.path, "wb") as f:
        f.write(deck_bytes)

    chunks = scrape_file(
        filepath=str(deck.path),
    )
    content_scrape = chunk_by_page(chunks)

    slides: list[Slide] = []
    images = [img async for img in pdf_to_image_async(deck_bytes)]
    ocr_tasks = [call_openai_ocr(img) for img in images]
    ocr_results = await asyncio.gather(*ocr_tasks)

    for i, _ in enumerate(ocr_tasks):
        slide_text = ocr_results[i]
        chunk_text = getattr(content_scrape[i], "text", str(content_scrape[i]))
        slide = Slide(
            number=i + 1,
            deck_uuid=deck.uuid,
            content_scrape=chunk_text,
            content_ocr=slide_text,
        )
        slides.append(slide)

    deck.save()
    for slide in slides:
        slide.save()
        slide.index()
