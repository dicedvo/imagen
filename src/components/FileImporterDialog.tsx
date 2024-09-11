import { useEffect, useState } from "react";
import FileUploadDialog from "./FileUploadDialog";
import emitter from "@/lib/event-bus";
import { DataSourcePreElementProps } from "@/core/data";
import { nanoid } from "nanoid";
import { useDataSourceStore } from "@/stores/registry_store";

export default function FileImporterDialog({
  processors,
  onImportFinished,
}: DataSourcePreElementProps) {
  const fileImporter = useDataSourceStore((state) =>
    state.get("file-importer"),
  );
  const [open, setOpen] = useState(false);

  const handleOpenImporter = ({ id }: { id: string }) => {
    if (!fileImporter) return;
    setOpen(id === fileImporter.id);
  };

  useEffect(() => {
    emitter.on("openImporter", handleOpenImporter);
    return () => {
      emitter.off("openImporter", handleOpenImporter);
    };
  }, [fileImporter]);

  return (
    <FileUploadDialog
      open={open}
      onOpenChange={setOpen}
      accept={processors.flatMap((processor) => processor.supportedFileTypes)}
      onUpload={(files, progress) => {
        if (files.length === 0 || !fileImporter) return;

        Promise.all(
          files.map((file) => {
            return fileImporter.import(
              file,
              progress.get(file.name),
              processors,
            );
          }),
        )
          .then((imported) => {
            return imported.map((records) => {
              return records.map((record) => {
                if (record.__id) {
                  return record;
                }
                return {
                  ...record,
                  __id: nanoid(),
                };
              });
            });
          })
          .then((data) => {
            onImportFinished?.({
              source: fileImporter.id,
              data: data.flat(),
            });

            setOpen(false);
          });
      }}
    />
  );
}
