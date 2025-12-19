import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface DropzoneProps {
  onFilesDrop: (files: { pdfFiles: File[] }) => void;
  onError: (error: string) => void;
}

export function Dropzone({ onFilesDrop, onError }: DropzoneProps) {
  const pdfFileFormats = [".pdf"];

  const isValidFileType = (file: File) => {
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    return pdfFileFormats.includes(ext);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => isValidFileType(file));

      if (validFiles.length !== acceptedFiles.length) {
        onError("Some files were skipped due to unsupported file types");
      }

      onFilesDrop({
        pdfFiles: validFiles,
      });
    },
    [onError, onFilesDrop],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 1024 * 1024 * 1024, // 1GB
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {isDragActive
            ? "Drop the PDF files here"
            : "Drag and drop your PDF files here"}
        </p>
        <p className="text-xs text-muted-foreground">Allowed file type: .pdf</p>
      </div>
    </div>
  );
}

export default Dropzone;
