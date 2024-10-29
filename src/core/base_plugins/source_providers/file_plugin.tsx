import FileImporterDialog from "@/components/FileImporterDialog";
import {
  SourceProvider,
  SourceProviderOptions,
  SourceDialogProps,
  SourceInput,
} from "@/core/data";
import { Plugin } from "@/core/plugin_system";
import { FileIcon } from "lucide-react";
import { ReactNode } from "react";

class FileImporter implements SourceProvider {
  id = "file-importer";
  name = "File Importer";
  importFromLabel = "Import from file";

  async preprocess(input: SourceInput, { progress }: SourceProviderOptions) {
    if (!(input instanceof File)) {
      throw new Error("Input is not a file");
    }

    progress.update(50, "Reading file");

    return {
      data: input,
      filename: input.name,
      contentType: input.type,
    };
  }

  icon(props: { className?: string }): ReactNode {
    return <FileIcon {...props} />;
  }

  dialogElement(props: SourceDialogProps): ReactNode {
    return <FileImporterDialog {...props} provider={this} />;
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
