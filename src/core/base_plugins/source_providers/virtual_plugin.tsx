import {
  SourceProvider,
  SourceProviderOptions,
  SourceDialogProps,
  SourceInput,
} from "@/core/data";
import { Plugin } from "@/core/plugin_system";
import { FileIcon } from "lucide-react";
import { ReactNode } from "react";

class VirtualProvider implements SourceProvider {
  id = "virtual";
  name = "Virtual Provider";
  importFromLabel = "";

  async preprocess(input: SourceInput, _: SourceProviderOptions) {
    return {
      data: input,
      filename: "virtual",
      contentType: "text/plain",
    };
  }

  icon(props: { className?: string }): ReactNode {
    return <FileIcon {...props} />;
  }

  dialogElement(_: SourceDialogProps): ReactNode {
    return <></>;
  }
}

const virtualPlugin: Plugin = {
  meta: {
    id: "virtual-provider",
    publisher: "imagen",
    version: "0.0.1",
    description:
      "Support for creating virtual data source records (add record via `Add Entry`)",
    name: "File",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerDataSource(new VirtualProvider());
  },
};

export default virtualPlugin;
