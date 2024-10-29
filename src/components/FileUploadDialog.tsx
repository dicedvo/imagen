import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FileUploadDropZone, {
  FileUploadDropZoneProps,
} from "./FileUploadDropZone";

export default function FileUploadDialog({
  open,
  accept,
  onUpload,
  onOpenChange,
  maxFiles,
  title,
}: {
  open: boolean;
  title?: string;
  onOpenChange: (open: boolean) => void;
} & FileUploadDropZoneProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title ?? "Upload File"}</DialogTitle>
        </DialogHeader>

        <FileUploadDropZone
          accept={accept}
          maxFiles={maxFiles}
          onUpload={onUpload}
          footerChildren={({
            uploadState,
            files,
            setUploadState,
            openDialog,
          }) => (
            <DialogFooter className="justify-end space-x-2">
              <Button
                variant="secondary"
                disabled={uploadState === "uploading"}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={() => {
                  if (files.length === 0) {
                    openDialog();
                  } else {
                    setUploadState(
                      uploadState === "idle" ? "uploading" : "idle",
                    );
                  }
                }}
              >
                {uploadState === "idle" ? "Upload" : "Stop"}
              </Button>
            </DialogFooter>
          )}
        />
      </DialogContent>
    </Dialog>
  );
}
