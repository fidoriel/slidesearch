from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Response
from uuid import UUID, uuid4
from fastapi.middleware.cors import CORSMiddleware
from .pytypes import LectureSeries, SlideDeck, Slide
from .slide_deck_processor import process_slide_deck
from fastapi import Query
from .pytypes import search_slides, index
import asyncio

app = FastAPI()
api_router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Slide.index_all()

@api_router.post("/lecture-series/", response_model=LectureSeries)
async def create_lecture_series(lecture_series_data: dict) -> LectureSeries:
    name = lecture_series_data.get("name")
    if not name:
        raise HTTPException(status_code=422, detail="Name is required")
    series = LectureSeries(uuid=uuid4(), name=name)
    series.save()
    return series


@api_router.delete("/lecture-series/{series_id}", response_model=dict)
async def delete_lecture_series(series_id: UUID) -> dict:
    series = LectureSeries.get(series_id)
    if not series:
        raise HTTPException(status_code=404, detail="Lecture series not found")
    LectureSeries.delete(series_id)
    return {"message": "Lecture series deleted successfully", "id": str(series_id)}


@api_router.get("/lecture-series/", response_model=list[LectureSeries])
async def list_lecture_series() -> list[LectureSeries]:
    return LectureSeries.list()


@api_router.get("/lecture-series/{series_id}", response_model=LectureSeries)
async def get_lecture_series(series_id: UUID) -> LectureSeries:
    series = LectureSeries.get(series_id)
    if not series:
        raise HTTPException(status_code=404, detail="Lecture series not found")
    return series


@api_router.post("/lecture-series/{series_id}/upload", response_model=dict)
async def upload_decks_to_lecture_series(
    series_id: UUID, files: list[UploadFile] = File(...)
) -> dict:
    series = LectureSeries.get(series_id)
    if not series:
        raise HTTPException(status_code=404, detail="Lecture series not found")

    async def process_file_background(series, deck_bytes, filename):
        try:
            await process_slide_deck(series, deck_bytes, filename)
        except Exception as e:
            print(e)
            pass

    for file in files:
        deck_bytes = await file.read()
        asyncio.create_task(process_file_background(series, deck_bytes, file.filename))

    return {
        "message": f"Batch upload started for {len(files)} file(s). Processing in background."
    }


@api_router.put("/slide-decks/{deck_id}", response_model=SlideDeck)
async def update_slide_deck(
    deck_id: UUID, name: str = Query(..., description="New name for the slide deck")
) -> SlideDeck:
    deck = SlideDeck.get(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Slide deck not found")

    deck.name = name
    deck.save()

    return deck


@api_router.delete("/slide-decks/{deck_id}", response_model=dict)
async def delete_slide_deck(deck_id: UUID) -> dict:
    deck = SlideDeck.get(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Slide deck not found")

    slides = Slide.list()
    slide_uuids_to_delete = []
    for slide in slides:
        if slide.deck_uuid == deck_id:
            slide_uuids_to_delete.append(str(slide.uuid))
            Slide.delete(slide.uuid)

    if slide_uuids_to_delete:
        index.delete_documents(slide_uuids_to_delete)

    SlideDeck.delete(deck_id)

    if deck.path.exists():
        deck.path.unlink()

    return {"message": "Slide deck deleted successfully", "id": str(deck_id)}


@api_router.get("/search", response_model=list[Slide])
async def search_slides_endpoint(
    query: str = Query(..., description="Search query text"),
    series: list[UUID] = Query(
        None, description="Optional list of lecture series UUIDs to filter"
    ),
) -> list[Slide]:
    decks = None
    if series:
        decks = []
        for series_uuid in series:
            lecture_series = LectureSeries.get(series_uuid)
            if lecture_series:
                decks.extend(lecture_series.get_decks())

    return search_slides(query, decks)


@api_router.get("/slide-decks/{deck_id}")
async def get_slide_deck(deck_id: UUID):
    deck = SlideDeck.get(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Slide deck not found")
    return deck


@api_router.get("/slide-decks/{deck_id}/pdf")
async def get_slide_deck_pdf(deck_id: UUID):
    deck = SlideDeck.get(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Slide deck not found")

    if not deck.path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found")

    with open(deck.path, "rb") as f:
        pdf_content = f.read()

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={deck.path.name}",
            "Content-Length": str(len(pdf_content)),
        },
    )


app.include_router(api_router, prefix="/api")
