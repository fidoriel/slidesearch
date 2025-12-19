from typing import List
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Response
from uuid import UUID, uuid4
from fastapi.middleware.cors import CORSMiddleware
from .pytypes import LectureSeries, SlideDeck, Slide
from .slide_deck_processor import process_slide_deck
from fastapi import Query
from .pytypes import search_slides, index
import json
import os


app = FastAPI()
api_router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api_router.post("/lecture-series/", response_model=LectureSeries)
async def create_lecture_series(name: str) -> LectureSeries:
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

@api_router.get("/lecture-series/", response_model=List[LectureSeries])
async def list_lecture_series() -> List[LectureSeries]:
    return LectureSeries.list()

@api_router.get("/lecture-series/{series_id}", response_model=LectureSeries)
async def get_lecture_series(series_id: UUID) -> LectureSeries:
    series = LectureSeries.get(series_id)
    if not series:
        raise HTTPException(status_code=404, detail="Lecture series not found")
    return series

@api_router.post("/lecture-series/{series_id}/upload", response_model=dict)
async def upload_deck_to_lecture_series(
    series_id: UUID,
    file: UploadFile = File(...)
) -> dict:
    series = LectureSeries.get(series_id)
    if not series:
        raise HTTPException(status_code=404, detail="Lecture series not found")
    deck_bytes = await file.read()
    await process_slide_deck(series, deck_bytes)
    return {"message": "Slide deck uploaded and processed successfully"}

@api_router.put("/slide-decks/{deck_id}", response_model=SlideDeck)
async def update_slide_deck(
    deck_id: UUID,
    name: str = Query(..., description="New name for the slide deck")
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

@api_router.get("/search", response_model=List[Slide])
async def search_slides_endpoint(
    query: str = Query(..., description="Search query text"),
    decks: List[UUID] = Query(None, description="Optional list of deck UUIDs to filter")
) -> List[Slide]:
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
            "Content-Length": str(len(pdf_content))
        }
    )

@api_router.get("/export")
async def export_data():
    try:
        # Get all lecture series
        series_list = LectureSeries.list()
        
        # Get all slide decks
        decks_list = SlideDeck.list()
        
        # Get all slides
        slides_list = Slide.list()
        
        # Create export data structure
        export_data = {
            "lecture_series": [series.model_dump() for series in series_list],
            "slide_decks": [deck.model_dump() for deck in decks_list],
            "slides": [slide.model_dump() for slide in slides_list]
        }
        
        return export_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/import")
async def import_data(file: UploadFile = File(...)):
    try:
        # Read the uploaded file
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        # Clear existing data
        for series in LectureSeries.list():
            LectureSeries.delete(series.uuid)
        
        for deck in SlideDeck.list():
            SlideDeck.delete(deck.uuid)
        
        for slide in Slide.list():
            Slide.delete(slide.uuid)
        
        # Import lecture series
        for series_data in data.get("lecture_series", []):
            series = LectureSeries(**series_data)
            series.save()
        
        # Import slide decks
        for deck_data in data.get("slide_decks", []):
            deck = SlideDeck(**deck_data)
            deck.save()
        
        # Import slides and re-index
        for slide_data in data.get("slides", []):
            slide = Slide(**slide_data)
            slide.save()
            slide.index()
        
        return {"message": "Data imported successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router, prefix="/api")