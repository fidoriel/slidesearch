import { useState } from "react";
import { Button } from "./ui/button";
import { Database, Upload } from "lucide-react";
import { BACKEND_BASE_URL } from "../lib/api";
import { useToast } from "../hooks/use-toast";

export function ExportDataButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleExport() {
    setLoading(true);
    try {
      const response = await fetch(BACKEND_BASE_URL + "/api/export", {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to export data");
      }
      const data = await response.json();

      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "slidesearch_data_export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleExport}
      disabled={loading}
    >
      <Database className="h-4 w-4" />
    </Button>
  );
}

export function ImportDataButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(BACKEND_BASE_URL + "/api/import", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to import data");
        }

        toast({
          title: "Success",
          description: "Data imported successfully. Page will reload.",
        });

        // Refresh the page to load new data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Import error:", error);
        toast({
          title: "Error",
          description: "Failed to import data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    input.click();
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleImport}
      disabled={loading}
    >
      <Upload className="h-4 w-4" />
    </Button>
  );
}
