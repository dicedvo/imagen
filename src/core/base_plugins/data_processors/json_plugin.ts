import { Plugin } from "@/core/plugin_system";
import { DataProcessor, SourceProcessedFile } from "@/core/data";

class JSONImporter implements DataProcessor {
  id = "json";
  supportedFileTypes = ["application/json"];

  checkData(data: unknown): Record<string, unknown>[] {
    if (!data) {
      throw new Error("Data is empty");
    } else if (!Array.isArray(data)) {
      throw new Error("Data is not an array. Got: " + typeof data);
    } else if (!data.every((record) => typeof record === "object")) {
      throw new Error("Data is not an array of objects");
    }
    return data;
  }

  async process({
    data,
  }: SourceProcessedFile): Promise<Record<string, unknown>[]> {
    if (data instanceof File) {
      const text = await data.text();
      return this.checkData(JSON.parse(text));
    }
    return this.checkData(JSON.parse(data));
  }
}

const jsonPlugin: Plugin = {
  meta: {
    id: "json",
    publisher: "imagen",
    version: "0.0.1",
    description: "Support for processing JSON files",
    name: "JSON",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerDataProcessor(new JSONImporter());
  },
};

export default jsonPlugin;
