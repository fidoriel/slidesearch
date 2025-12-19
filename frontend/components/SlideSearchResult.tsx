import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { BookOpen, FileText, ChevronDown } from "lucide-react";

import { SimplePDFPreview } from "./SimplePDFPreview";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./ui/collapsible";

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
  onSelect: () => void;
}

export function SlideSearchResult({
  slide,
  searchTerm,
  onSelect,
}: SlideSearchResultProps) {
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
    <Card className="mb-6 border border-muted">
      <CardHeader className="pb-2 cursor-pointer" onClick={onSelect}>
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          <CardTitle className="text-lg flex flex-wrap items-center gap-2">
            <span>
              {slide.series?.name && (
                <span className="font-semibold">{slide.series.name}</span>
              )}
              {slide.series?.name && slide.deck?.name && (
                <span className="mx-1 text-muted-foreground">/</span>
              )}
              {slide.deck?.name && (
                <span className="font-semibold">{slide.deck.name}</span>
              )}
              {(slide.series?.name || slide.deck?.name) && (
                <span className="mx-1 text-muted-foreground">-</span>
              )}
              <span>Page {slide.number}</span>
            </span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4 lg:col-span-2">
            <SimplePDFPreview
              deckId={slide.deck_uuid}
              initialPageNumber={slide.number}
              deckName={slide.deck?.name}
              searchWords={searchTerm.split(/\s+/).filter(Boolean)}
            />
          </div>

          {/* Right Column: Slide Details and Content (1/3 width on large screens) */}
          <div className="space-y-6 lg:col-span-1">
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
                    slide.content_scrape || "No content available",
                    searchTerm,
                  )}
                </p>
              </div>
            </div>

            {slide.content_ocr && (
              <div className="space-y-2">
                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">OCR Content</span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform duration-300 data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content">
                    <div className="bg-muted p-3 rounded-lg mt-2 border-l-2 border-primary">
                      <p className="text-sm">
                        {highlightText(slide.content_ocr, searchTerm)}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
