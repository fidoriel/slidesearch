import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ExternalLink,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { SimplePDFPreview } from "./SimplePDFPreview";
import { BACKEND_BASE_URL } from "../lib/api";

interface SlideSearchResultProps {
  slide: {
    uuid: string;
    deck_uuid: string;
    number: number;
    content_scrape: string;
    content_ocr: string;
    deck?: {
      uuid: string;
      name: string;
      series_uuid: string;
    };
    series?: {
      uuid: string;
      name: string;
    };
  };
  searchTerm: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function SlideSearchResult({
  slide,
  searchTerm,
  isSelected,
  onSelect,
}: SlideSearchResultProps) {
  const { toast } = useToast();

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;

    const regex = new RegExp(`(${term})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <Card className={`mb-6 ${isSelected ? "border-primary" : "border-border"}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={onSelect}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Slide {slide.number}
          </CardTitle>
          <div className="flex items-center gap-2">
            {slide.deck && (
              <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
                {slide.deck.name}
              </span>
            )}
            {slide.series && (
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {slide.series.name}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: PDF Preview */}
          <div className="space-y-4">
            <SimplePDFPreview
              deckId={slide.deck_uuid}
              pageNumber={slide.number}
              deckName={slide.deck?.name}
              width={500}
              height={400}
            />

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (slide.deck_uuid) {
                    window.open(
                      `${BACKEND_BASE_URL}/api/slide-decks/${slide.deck_uuid}/pdf#page=${slide.number}`,
                      "_blank",
                    );
                  }
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Full PDF
              </Button>
            </div>
          </div>

          {/* Right Column: Slide Details and Content */}
          <div className="space-y-6">
            {/* Slide Information */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Slide Information
              </h3>
              <div className="space-y-2 text-sm bg-muted p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slide Number:</span>
                  <span className="font-medium">{slide.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deck:</span>
                  <span className="font-medium">
                    {slide.deck?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lecture Series:</span>
                  <span className="font-medium">
                    {slide.series?.name || "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* Slide Content with search term highlighting */}
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Slide Content
              </h3>
              <div className="bg-muted p-3 rounded-lg min-h-[150px]">
                <p className="text-sm">
                  {highlightText(
                    slide.content_scrape ||
                      slide.content_ocr ||
                      "No content available",
                    searchTerm,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
