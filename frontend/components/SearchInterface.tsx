import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Search, BookOpen, FileText, ChevronRight } from "lucide-react";
import { BACKEND_BASE_URL } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import { SlideSearchResult } from "./SlideSearchResult";

interface Slide {
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
}

interface LectureSeries {
  uuid: string;
  name: string;
}

export function SearchInterface() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Slide[]>([]);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const [lectureSeries, setLectureSeries] = useState<LectureSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLectureSeries = async () => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/lecture-series/`);
      if (!response.ok) {
        throw new Error("Failed to fetch lecture series");
      }
      const data = await response.json();
      setLectureSeries(data);
    } catch (error) {
      console.error("Error fetching lecture series:", error);
      toast({
        title: "Error",
        description: "Failed to fetch lecture series",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLectureSeries();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let url = `${BACKEND_BASE_URL}/api/search?query=${encodeURIComponent(searchQuery)}`;

      if (selectedSeries.length > 0) {
        const seriesParams = selectedSeries.map((s) => `decks=${s}`).join("&");
        url += `&${seriesParams}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to search slides");
      }

      const results = await response.json();

      // Fetch additional deck and series information for each slide
      const enrichedResults = await Promise.all(
        results.map(async (slide: Slide) => {
          try {
            // Fetch deck information
            const deckResponse = await fetch(
              `${BACKEND_BASE_URL}/api/slide-decks/${slide.deck_uuid}`,
            );
            if (deckResponse.ok) {
              const deck = await deckResponse.json();
              slide.deck = deck;

              // Fetch series information
              const seriesResponse = await fetch(
                `${BACKEND_BASE_URL}/api/lecture-series/${deck.series_uuid}`,
              );
              if (seriesResponse.ok) {
                const series = await seriesResponse.json();
                slide.series = series;
              }
            }
          } catch (error) {
            console.error("Error fetching additional slide info:", error);
          }

          return slide;
        }),
      );

      setSearchResults(enrichedResults);
      if (enrichedResults.length > 0) {
        setSelectedSlide(enrichedResults[0]);
      }
    } catch (error) {
      console.error("Error searching slides:", error);
      toast({
        title: "Error",
        description: "Failed to search slides",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSeriesSelection = (seriesId: string) => {
    setSelectedSeries((prev) =>
      prev.includes(seriesId)
        ? prev.filter((id) => id !== seriesId)
        : [...prev, seriesId],
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search slides by content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || loading}
          >
            <Search className="mr-2 h-4 w-4" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Search through all slide content. Use the filter panel to narrow down
          by lecture series.
        </p>
      </div>

      <div className="gap-6">
        {/* <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter by Lecture Series</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {lectureSeries.map((series) => (
                                    <div 
                                        key={series.uuid}
                                        className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedSeries.includes(series.uuid) ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                                        onClick={() => toggleSeriesSelection(series.uuid)}
                                    >
                                        <span className="text-sm">{series.name}</span>
                                        {selectedSeries.includes(series.uuid) && (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div> */}

        <div className="space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {!loading && searchResults.length === 0 && searchQuery.trim() && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No results found</p>
              </CardContent>
            </Card>
          )}

          {!loading && searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((slide) => (
                <SlideSearchResult
                  key={slide.uuid}
                  slide={slide}
                  searchTerm={searchQuery}
                  isSelected={selectedSlide?.uuid === slide.uuid}
                  onSelect={() => setSelectedSlide(slide)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
