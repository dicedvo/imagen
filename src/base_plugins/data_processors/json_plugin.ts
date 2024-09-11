import { Plugin } from "@/core/plugin_system";
import { DataProcessor, DataRecord, SourceInput } from "@/core/data";
import { UploadProgress } from "@/lib/progress";

class JSONImporter implements DataProcessor {
  id = "json";
  supportedFileTypes = ["application/json"];

  checkData(data: unknown): DataRecord[] {
    if (!data) {
      throw new Error("Data is empty");
    } else if (!Array.isArray(data)) {
      throw new Error("Data is not an array. Got: " + typeof data);
    } else if (!data.every((record) => typeof record === "object")) {
      throw new Error("Data is not an array of objects");
    }
    return data;
  }

  async process(
    data: SourceInput,
    progress: UploadProgress,
  ): Promise<DataRecord[]> {
    if (data instanceof File) {
      const text = await data.text();
      const parsed = this.checkData(JSON.parse(text));
      progress.update(100, "Imported " + parsed.length + " records");
      return parsed;
    }

    const parsed = this.checkData(JSON.parse(data));
    progress.update(100, "Imported " + parsed.length + " records");
    return parsed;
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
