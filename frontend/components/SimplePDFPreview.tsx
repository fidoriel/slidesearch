import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

import { useState } from "react";
import { pdfjs } from "react-pdf";
import { BACKEND_BASE_URL } from "../lib/api";
import { Document, Page } from "react-pdf";
import { Button } from "./ui/button";

interface SimplePDFPreviewProps {
  deckId: string;
  deckName?: string;
  searchWords?: string[];
  initialPageNumber?: number;
}

export function SimplePDFPreview({
  deckId,
  deckName,
  searchWords = [],
  initialPageNumber = 1,
}: SimplePDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(initialPageNumber);
  const pdfUrl = `${BACKEND_BASE_URL}/api/slide-decks/${deckId}/pdf`;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const customTextRenderer = (textItem: { str: string }) => {
    if (!searchWords || searchWords.length === 0) return textItem.str;
    let str = textItem.str;
    const regex = new RegExp(
      `(${searchWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "gi",
    );
    return str.replace(
      regex,
      '<mark style="background: #fde68a; border-radius: 0.2em; padding: 0 0.1em;">$1</mark>',
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="mr-2"
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPageNumber((p) =>
                numPages ? Math.min(numPages, p + 1) : p + 1,
              )
            }
            disabled={numPages ? pageNumber >= numPages : false}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`${pdfUrl}#page=${pageNumber}`, "_blank")
            }
            className="ml-2"
          >
            Open in PDF Reader
          </Button>
        </div>
      </div>
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        className="w-full flex items-center justify-center"
      >
        <Page
          pageNumber={pageNumber}
          renderAnnotationLayer={true}
          renderTextLayer={true}
          customTextRenderer={customTextRenderer}
        />
      </Document>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Page {pageNumber} of {numPages}
      </p>
    </div>
  );
}
