import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Trash2, Plus, Edit, Save, X } from "lucide-react";
import { BACKEND_BASE_URL } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LectureSeries {
  uuid: string;
  name: string;
  slide_decks?: any[];
}

export function LectureSeriesManagement() {
  const [lectureSeries, setLectureSeries] = useState<LectureSeries[]>([]);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [editingSeries, setEditingSeries] = useState<{ [key: string]: string }>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectureSeries();
  }, []);

  const handleCreateSeries = async () => {
    if (!newSeriesName.trim()) return;

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/lecture-series/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newSeriesName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to create lecture series");
      }

      const newSeries = await response.json();
      setLectureSeries([...lectureSeries, newSeries]);
      setNewSeriesName("");
      toast({
        title: "Success",
        description: "Lecture series created successfully",
      });
    } catch (error) {
      console.error("Error creating lecture series:", error);
      toast({
        title: "Error",
        description: "Failed to create lecture series",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSeries = async (seriesId: string) => {
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/lecture-series/${seriesId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete lecture series");
      }

      setLectureSeries(
        lectureSeries.filter((series) => series.uuid !== seriesId),
      );
      toast({
        title: "Success",
        description: "Lecture series deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting lecture series:", error);
      toast({
        title: "Error",
        description: "Failed to delete lecture series",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSeries = async (seriesId: string) => {
    const newName = editingSeries[seriesId];
    if (!newName?.trim()) return;

    try {
      // Aktuell gibt es keine direkte Update-Endpunkt für LectureSeries
      // Wir könnten einen neuen erstellen oder die Serie löschen und neu anlegen
      // Für jetzt zeigen wir nur eine Nachricht
      toast({
        title: "Info",
        description: "Lecture series name update not yet implemented",
      });
      setEditingSeries({});
    } catch (error) {
      console.error("Error updating lecture series:", error);
      toast({
        title: "Error",
        description: "Failed to update lecture series",
        variant: "destructive",
      });
    }
  };

  const startEditing = (seriesId: string, currentName: string) => {
    setEditingSeries({ [seriesId]: currentName });
  };

  const cancelEditing = (seriesId: string) => {
    const newEditing = { ...editingSeries };
    delete newEditing[seriesId];
    setEditingSeries(newEditing);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Create New Lecture Series</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Enter series name (e.g., 'Introduction to AI')"
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateSeries()}
              className="flex-1"
            />
            <Button
              onClick={handleCreateSeries}
              disabled={!newSeriesName.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Series
            </Button>
          </div>
          {newSeriesName.trim() && (
            <p className="text-sm text-muted-foreground mt-2">
              Press Enter or click "Create Series" to add "
              {newSeriesName.trim()}"
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lectureSeries.map((series) => (
          <Card key={series.uuid} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {editingSeries[series.uuid] !== undefined ? (
                <div className="flex-1">
                  <Input
                    type="text"
                    value={editingSeries[series.uuid]}
                    onChange={(e) =>
                      setEditingSeries({
                        ...editingSeries,
                        [series.uuid]: e.target.value,
                      })
                    }
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleUpdateSeries(series.uuid)
                    }
                    autoFocus
                  />
                </div>
              ) : (
                <CardTitle className="flex-1 truncate">{series.name}</CardTitle>
              )}
              <div className="flex gap-2">
                {editingSeries[series.uuid] !== undefined ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUpdateSeries(series.uuid)}
                      className="h-8 w-8"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelEditing(series.uuid)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(series.uuid, series.name)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSeries(series.uuid)}
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                {series.slide_decks?.length || 0} slide decks
              </p>
              <p className="text-sm text-muted-foreground">
                Click "View Details" to manage slide decks
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/data/${series.uuid}`)}
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
