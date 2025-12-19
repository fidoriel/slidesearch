import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { BACKEND_BASE_URL } from "../lib/api";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface SimplePDFPreviewProps {
  deckId: string;
  pageNumber: number;
  deckName?: string;
  width?: number;
  height?: number;
}

export function SimplePDFPreview({
  deckId,
  pageNumber,
  deckName,
  width = 400,
  height = 300,
}: SimplePDFPreviewProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Removed isMounted state, not needed

  useEffect(() => {
    let isActive = true;

    const loadAndRender = async () => {
      try {
        if (!isActive) return;

        setStatus("loading");
        setErrorMsg(null);

        // Step 1: Fetch PDF from backend
        const response = await fetch(
          `${BACKEND_BASE_URL}/api/slide-decks/${deckId}/pdf`,
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const pdfData = await response.arrayBuffer();

        // Step 3: Load PDF document
        const pdfDoc = await pdfjs.getDocument({ data: pdfData }).promise;

        // Step 4: Get specific page
        const page = await pdfDoc.getPage(pageNumber);

        // Step 5: Setup canvas
        if (!isActive) return;
        // Wait for next animation frame to ensure canvas is in DOM
        await new Promise(requestAnimationFrame);
        const canvas = canvasRef.current;
        if (!canvas) {
          if (isActive) {
            setStatus("error");
            setErrorMsg(
              "Canvas element not found - component may have unmounted",
            );
          }
          return;
        }

        const context = canvas.getContext("2d");
        if (!context) {
          if (isActive) {
            setStatus("error");
            setErrorMsg("Could not get 2D context");
          }
          return;
        }

        // Step 6: Calculate viewport
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = Math.min(
          width / viewport.width,
          height / viewport.height,
        );
        const scaledViewport = page.getViewport({ scale });

        // Step 7: Set canvas size and render
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Clear canvas with white background
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // PDF.js expects a 'canvas' property in render parameters
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        }).promise;

        if (isActive) {
          setStatus("loaded");
        }
      } catch (err) {
        if (isActive) {
          setStatus("error");
          setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        }
      }
    };

    loadAndRender();

    return () => {
      isActive = false;
    };
  }, [deckId, pageNumber, width, height]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {deckName ? `${deckName} - ` : ""}Page {pageNumber}
        </h3>
        {status !== "idle" && (
          <span className="text-xs text-muted-foreground">
            Status: {status}
          </span>
        )}
      </div>

      <div className="bg-muted rounded-lg overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className={`w-full h-auto ${status === "loaded" ? "block" : "hidden"}`}
          style={{ maxWidth: `${width}px`, maxHeight: `${height}px` }}
        />

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-muted-foreground">
              Loading PDF preview...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center h-80 text-center p-4">
            <p className="text-sm text-destructive mb-3">
              Failed to load preview
            </p>
            {errorMsg && (
              <p className="text-xs text-muted-foreground mb-2">{errorMsg}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `${BACKEND_BASE_URL}/api/slide-decks/${deckId}/pdf#page=${pageNumber}`,
                  "_blank",
                )
              }
            >
              Open Full PDF
            </Button>
          </div>
        )}

        {status === "idle" && (
          <div className="flex items-center justify-center h-80">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-primary/20 rounded-lg"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
