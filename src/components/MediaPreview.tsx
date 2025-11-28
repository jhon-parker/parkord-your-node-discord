import { useState } from "react";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MediaPreviewProps {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MediaPreview = ({ url, open, onOpenChange }: MediaPreviewProps) => {
  const [zoom, setZoom] = useState(1);
  
  const isVideo = url?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i);
  const isImage = url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "media";
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur border-border max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {isImage && (
            <>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setZoom(z => Math.min(z + 0.5, 3))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button size="icon" variant="secondary" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center min-h-[300px] max-h-[80vh] overflow-auto p-4">
          {isVideo ? (
            <video
              src={url}
              controls
              className="max-w-full max-h-[75vh] rounded"
              autoPlay
            />
          ) : isImage ? (
            <img
              src={url}
              alt="Preview"
              className="max-w-full max-h-[75vh] rounded transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <div className="text-muted-foreground">
              Предпросмотр недоступен
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreview;
