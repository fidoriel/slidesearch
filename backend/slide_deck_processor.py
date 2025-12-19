from pdf2image import convert_from_bytes
import io
import ollama
import base64
from uuid import uuid4
from .pytypes import Slide, SlideDeck, LectureSeries
import hashlib
from .config import config
import openai



def pdf_to_image(pdf: bytes):
    images = convert_from_bytes(pdf)
    for img in images:
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        yield buf.getvalue()


async def call_deepseek_ollama(slide: bytes) -> str:
    model = 'deepseek-ocr:3b-bf16'
    response = ollama.chat(
        model=model,
        messages=[{
            'role': 'user',
            'content': '\nFree OCR.',
            'images': [slide]
        }],
        stream=False
    )
    return response['message']['content']

async def call_openai_ocr(slide: bytes) -> str:
    image_base64 = base64.b64encode(slide).decode("utf-8")
    client = openai.AsyncOpenAI(api_key="42",
                                base_url="http://localhost:8000/v1"

    )
    response = await client.chat.completions.create(
        model="deepseek-ai/DeepSeek-OCR",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "\nFree OCR."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}}
                ]
            }
        ],
    )
    return response.choices[0].message.content

async def process_slide_deck(series: LectureSeries, deck_bytes: bytes):


    deck = SlideDeck(
        series_uuid=series.uuid,
        file_hash=hashlib.sha256(deck_bytes).hexdigest(),
        name="",
        path=config.DATA_DIR / f"{uuid4()}.pdf"
    )


    with open(deck.path, "wb") as f:
        f.write(deck_bytes)

    slides: list[Slide] = []

    for i, img in enumerate(pdf_to_image(deck_bytes)):
        slide_text = await call_openai_ocr(img)
        slide = Slide(
            number=i,
            deck_uuid=deck.uuid,
            content_scrape="",
            content_ocr=slide_text,
        )
        slides.append(slide)
        print(slide_text)
        print(f"finished slide {i}")

    deck.save()
    for slide in slides:
        slide.save()
        slide.index()
