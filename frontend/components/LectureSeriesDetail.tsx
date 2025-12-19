import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { ArrowLeft, Trash2, Edit, Save, X, FileText } from "lucide-react";
import { BACKEND_BASE_URL } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import Dropzone from "../Dropzone";
import { SlideSearchResult } from "./SlideSearchResult";
import { Input } from "./ui/input";

interface SlideDeck {
  uuid: string;
  name: string;
  series_uuid: string;
}

interface LectureSeries {
  uuid: string;
  name: string;
  slide_decks?: SlideDeck[];
}

export function LectureSeriesDetail() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [series, setSeries] = useState<LectureSeries | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editingDeckName, setEditingDeckName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchSeries = async () => {
    if (!seriesId) return;

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/lecture-series/${seriesId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch lecture series");
      }
      const data = await response.json();
      setSeries(data);
      setEditingName(data.name);
    } catch (error) {
      console.error("Error fetching lecture series:", error);
      toast({
        title: "Error",
        description: "Failed to fetch lecture series",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [seriesId]);

  const handleUpload = async (files: { pdfFiles: File[] }) => {
    if (!seriesId) return;

    // Wir erwarten PDF-Dateien
    const pdfFiles = files.pdfFiles.filter((file) =>
      file.name.toLowerCase().endsWith(".pdf"),
    );

    if (pdfFiles.length === 0) {
      toast({
        title: "Error",
        description: "No PDF files found",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      for (const file of pdfFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${BACKEND_BASE_URL}/api/lecture-series/${seriesId}/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to upload slide deck");
        }
      }

      // Neu laden, um die neuen Slide Decks anzuzeigen
      await fetchSeries();
      toast({
        title: "Success",
        description: "Slide decks uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading slide deck:", error);
      toast({
        title: "Error",
        description: "Failed to upload slide deck",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/slide-decks/${deckId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete slide deck");
      }

      if (series) {
        setSeries({
          ...series,
          slide_decks: series.slide_decks?.filter(
            (deck) => deck.uuid !== deckId,
          ),
        });
      }

      toast({
        title: "Success",
        description: "Slide deck deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting slide deck:", error);
      toast({
        title: "Error",
        description: "Failed to delete slide deck",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDeckName = async (deckId: string, newName: string) => {
    if (!newName?.trim()) return;

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/slide-decks/${deckId}?name=${encodeURIComponent(newName)}`,
        {
          method: "PUT",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update slide deck name");
      }

      const updatedDeck = await response.json();
      if (series) {
        setSeries({
          ...series,
          slide_decks: series.slide_decks?.map((deck) =>
            deck.uuid === deckId ? updatedDeck : deck,
          ),
        });
      }

      // Beende den Bearbeitungsmodus
      setEditingDeckId(null);
      setEditingDeckName("");

      toast({
        title: "Success",
        description: "Slide deck name updated successfully",
      });
    } catch (error) {
      console.error("Error updating slide deck name:", error);
      toast({
        title: "Error",
        description: "Failed to update slide deck name",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSeriesName = async () => {
    if (!editingName?.trim() || !seriesId) return;

    try {
      // Aktuell gibt es keinen direkten Endpunkt zum Aktualisieren des Namens
      // Wir könnten einen neuen Endpunkt erstellen oder die Serie löschen und neu anlegen
      // Für jetzt zeigen wir nur eine Nachricht
      toast({
        title: "Info",
        description: "Lecture series name update not yet implemented",
      });
    } catch (error) {
      console.error("Error updating lecture series name:", error);
      toast({
        title: "Error",
        description: "Failed to update lecture series name",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Lecture series not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          {editingName !== null ? (
            <div className="flex gap-2">
              <Input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateSeriesName()}
                className="flex-1"
              />
              <Button onClick={handleUpdateSeriesName} size="sm">
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingName(series.name)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {series.name}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingName(series.name)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </h1>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Slide Decks</CardTitle>
        </CardHeader>
        <CardContent>
          <Dropzone
            onFilesDrop={handleUpload}
            onError={(error) =>
              toast({
                title: "Error",
                description: error,
                variant: "destructive",
              })
            }
          />
          {uploading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Uploading and processing slide decks...</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slide Decks</CardTitle>
        </CardHeader>
        <CardContent>
          {series.slide_decks && series.slide_decks.length > 0 ? (
            <div className="space-y-4">
              {series.slide_decks.map((deck) => (
                <div
                  key={deck.uuid}
                  className="flex items-center justify-between p-4 border rounded-lg group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    {editingDeckId === deck.uuid ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          type="text"
                          value={editingDeckName}
                          onChange={(e) => setEditingDeckName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateDeckName(deck.uuid, editingDeckName);
                              setEditingDeckId(null);
                            }
                          }}
                          autoFocus
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleUpdateDeckName(deck.uuid, editingDeckName)
                          }
                          className="h-8 w-8"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingDeckId(null);
                            setEditingDeckName("");
                          }}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-2">
                        <span className="font-medium truncate">
                          {deck.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingDeckId(deck.uuid);
                            setEditingDeckName(deck.name);
                          }}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(
                          `${BACKEND_BASE_URL}/api/slide-decks/${deck.uuid}/pdf`,
                          "_blank",
                        );
                      }}
                    >
                      View PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteDeck(deck.uuid)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No slide decks uploaded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
