import { Plugin } from "@/core/plugin_system";
import { DataProcessor, DataRecord, SourceInput } from "@/core/data";
import { UploadProgress } from "@/lib/progress";
import Papa from "papaparse";

class CSVImporter implements DataProcessor {
  id = "csv";
  supportedFileTypes = ["text/csv"];

  process(data: SourceInput, progress: UploadProgress): Promise<DataRecord[]> {
    return new Promise((resolve, reject) => {
      Papa.parse<DataRecord>(data, {
        header: true,
        complete(results) {
          progress.update(100, "Imported " + results.data.length + " records");
          resolve(results.data);
        },
        error(error) {
          reject(error);
        },
      });
    });
  }
}

const csvPlugin: Plugin = {
  meta: {
    id: "csv",
    publisher: "imagen",
    version: "0.0.1",
    description: "Support for processing CSV files",
    name: "CSV",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerDataProcessor(new CSVImporter());
  },
};

export default csvPlugin;
