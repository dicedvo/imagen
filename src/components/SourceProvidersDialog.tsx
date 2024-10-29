import { DataSource, processFiles, SourceProcessedFile } from "@/core/data";
import emitter from "@/lib/event-bus";
import { inferSchema, Schema } from "@/lib/schema";
import {
  useDataProcessorStore,
  useSourceProviderStore,
} from "@/stores/registry_store";
import { useSchemaFieldTypeStore } from "@/stores/schema_store";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export default function SourceProvidersDialog({
  onImportFinished: handleImportFinished,
}: {
  onImportFinished: (data: {
    source: string;
    sources: DataSource<Schema>[];
  }) => void;
}) {
  const dataProcessors = useDataProcessorStore(
    useShallow((state) => state.items),
  );
  const dataSourceProviders = useSourceProviderStore(
    useShallow((state) => state.registry.items),
  );
  const schemaFieldTypes = useSchemaFieldTypeStore(
    useShallow((state) => state.items),
  );
  const [currentOpenedProvider, setCurrentOpenedProvider] = useState<{
    id: string;
    settings: Record<string, unknown>;
  } | null>(null);

  const handleOpenImporter = (provider: {
    id: string;
    settings: Record<string, unknown>;
  }) => {
    setCurrentOpenedProvider(provider);
  };

  const close = () => {
    setCurrentOpenedProvider(null);
  };

  const handleProcessFiles = async ({
    source,
    files,
  }: {
    source: string;
    files: SourceProcessedFile[];
  }) => {
    const sources = await processFiles(files, {
      processors: dataProcessors,
      fromSourceId: source,
      progress: (_file) => ({
        update(_progress, _message) {},
      }),
      onGenerateSchema(records) {
        return inferSchema(records, schemaFieldTypes);
      },
    });

    handleImportFinished({ source, sources });
    close();
  };

  useEffect(() => {
    emitter.on("openImporter", handleOpenImporter);
    return () => {
      emitter.off("openImporter", handleOpenImporter);
    };
  }, [currentOpenedProvider]);

  return dataSourceProviders
    .filter((source) => source.dialogElement)
    .map((source) => {
      const DataSourceDialogElement = source.dialogElement!.bind(source);
      return (
        <DataSourceDialogElement
          key={`importer_dialog_${source.id}`}
          open={currentOpenedProvider?.id === source.id}
          supportedFileTypes={dataProcessors.flatMap(
            (processor) => processor.supportedFileTypes,
          )}
          settings={currentOpenedProvider?.settings ?? {}}
          process={(files) => handleProcessFiles({ source: source.id, files })}
          close={close}
        />
      );
    });
}
