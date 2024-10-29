import FileUploadDialog from "./FileUploadDialog";
import { SourceDialogProps, SourceProvider } from "@/core/data";

export default function FileImporterDialog({
  open,
  settings,
  supportedFileTypes,
  process,
  close,
  provider: fileImporter,
}: SourceDialogProps & { provider: SourceProvider }) {
  return (
    <FileUploadDialog
      open={open}
      onOpenChange={close}
      accept={supportedFileTypes}
      onUpload={(files, progress) => {
        if (files.length === 0) {
          console.error("No files provided");
          return;
        } else if (!fileImporter) {
          console.error("No file importer provided");
          return;
        }

        Promise.all(
          files.map((file) =>
            fileImporter.preprocess(file, {
              progress: progress.get(file.name),
              ...settings,
            }),
          ),
        )
          .then(process)
          .then(close);
      }}
    />
  );
}
