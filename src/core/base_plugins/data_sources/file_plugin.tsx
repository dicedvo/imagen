import FileImporterDialog from "@/components/FileImporterDialog";
import {
  DataProcessor,
  DataRecord,
  DataSource,
  DataSourcePreElementProps,
  SourceInput,
} from "@/core/data";
import { Plugin } from "@/core/plugin_system";
import { UploadProgress } from "@/lib/progress";
import { FileIcon } from "lucide-react";
import { ReactNode } from "react";

class FileImporter implements DataSource {
  id = "file-importer";
  title = "File Importer";
  importFromLabel = "Import from file";

  async import(
    input: SourceInput,
    progress: UploadProgress,
    processors: DataProcessor[],
  ): Promise<DataRecord[]> {
    if (!(input instanceof File)) {
      throw new Error("Input is not a file");
    }

    const importer = processors.find((importer) =>
      importer.supportedFileTypes.includes(input.type),
    );
    if (!importer) {
      throw new Error("No importer found for file");
    }

    return importer.process(input, progress);
  }

  icon(props: { className?: string }): ReactNode {
    return <FileIcon {...props} />;
  }

  preElement(props: DataSourcePreElementProps): ReactNode {
    return <FileImporterDialog {...props} />;
  }
}

const filePlugin: Plugin = {
  meta: {
    id: "file",
    publisher: "imagen",
    version: "0.0.1",
    description: "Support for importing data from files.",
    name: "File",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerDataSource(new FileImporter());
  },
};

export default filePlugin;
