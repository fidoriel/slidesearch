from pydantic import BaseModel, Field
from uuid import UUID
from pathlib import Path
from .config import config
from valkey import Valkey
import meilisearch
from typing import Type, TypeVar, Optional, ClassVar
from pydantic import field_serializer
from uuid import uuid4
import json
from uuid import UUID


class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return obj.hex
        return json.JSONEncoder.default(self, obj)
    
VALKEY_GLOBAL_PREFIX = "slidesearch"
T = TypeVar("T", bound="StorageMixin")

valkey = Valkey()
search = meilisearch.Client(
    url=f"http://{config.MEILISEARCH_HOST}:{config.MEILISEARCH_PORT}",
)
try:
    index = search.get_index('slides')
except meilisearch.errors.MeilisearchApiError:
    index = search.create_index('slides', {'primaryKey': 'uuid'})
index.update_filterable_attributes([
  'uuid',
  'deck_uuid'
])

class StorageMixin:
    VALKEY_OBJECT_PATH: ClassVar[str]

    def valkey_instance_path(self) -> str:
        return f"{self.valkey_path()}:{str(self.uuid)}"

    def valkey_path(self) -> str:
        return f"{VALKEY_GLOBAL_PREFIX}:{self.VALKEY_OBJECT_PATH}"

    @classmethod
    def get(cls: Type[T], uuid: UUID) -> T | None:
        key = f"{VALKEY_GLOBAL_PREFIX}:{cls.VALKEY_OBJECT_PATH}:{uuid}"
        data = valkey.get(key)
        if data:
            return cls.parse_raw(data)
        return None

    @classmethod
    def list(cls: Type[T]) -> list[T]:
        uuids = valkey.smembers(f"{VALKEY_GLOBAL_PREFIX}:{cls.VALKEY_OBJECT_PATH}")
        objects = []
        for u in uuids:
            obj = cls.get(UUID(u.decode("utf-8")))
            if obj:
                objects.append(obj)
        return objects

    @classmethod
    def delete(cls: Type[T], uuid: UUID) -> None:
        key = f"{VALKEY_GLOBAL_PREFIX}:{cls.VALKEY_OBJECT_PATH}:{uuid}"
        valkey.delete(key)
        valkey.srem(f"{VALKEY_GLOBAL_PREFIX}:{cls.VALKEY_OBJECT_PATH}", str(uuid))

    def save(self) -> None:
        valkey.set(self.valkey_instance_path(), self.model_dump_json())
        valkey.sadd(self.valkey_path(), str(self.uuid))

class Slide(BaseModel, StorageMixin):
    VALKEY_OBJECT_PATH: ClassVar[str] = "slide"
    uuid: UUID = Field(default_factory=uuid4)
    deck_uuid: UUID
    number: int
    content_scrape: str
    content_ocr: str

    def index(self):
        index.add_documents([self.model_dump()])

    def get_file(self) -> bytes:
        deck = SlideDeck.get(self.deck_uuid)
        with open(deck.path, "rb") as f:
            return f.read()
    
    @property
    def series(self) -> "LectureSeries":
        return LectureSeries.get(self.deck.series_uuid)

    @property
    def deck(self) -> "SlideDeck":
        return SlideDeck.get(self.deck_uuid)

    @field_serializer('uuid', 'deck_uuid', mode='plain')
    def serialize_uuids(self, value):
        return str(value)


class SlideDeck(BaseModel, StorageMixin):
    VALKEY_OBJECT_PATH: ClassVar[str] = "slidedeck"
    uuid: UUID = Field(default_factory=uuid4)
    series_uuid: UUID
    name: str
    file_hash: str

    @property
    def path(self) -> Path:
        return config.DATA_DIR / f"{self.uuid}.pdf"


class LectureSeries(BaseModel, StorageMixin):
    VALKEY_OBJECT_PATH: ClassVar[str] = "lectureseries"
    uuid: UUID = Field(default_factory=uuid4)
    name: str
    slide_deck_uuids: list[str] | None = None
    slide_decks: list[str] | None = None

    @field_serializer('slide_deck_uuids', mode='plain')
    def serialize_slide_deck_uuids(self, value):
        return [
            str(deck.uuid)
            for deck in SlideDeck.list()
            if deck.series_uuid == self.uuid
        ]

    @field_serializer('slide_decks', mode='plain')
    def serialize_slide_decks(self, value):
        return [
            deck.model_dump()
            for deck in SlideDeck.list()
            if deck.series_uuid == self.uuid
        ]


def search_slides(query_text: str, decks: list[UUID] | None = None) -> list[Slide]:
    filter_query = None
    if decks:
        deck_uuids = [str(d) for d in decks]
        filter_query = f'deck_uuid IN [{", ".join(f""""{u}""" for u in deck_uuids)}]'
    results = index.search(query_text)
    slides = []
    for hit in results['hits']:
        slide = Slide.get(UUID(hit['uuid']))
        if slide:
            slides.append(slide)

    docs = index.get_documents()
    return slides
