import { Plugin } from "@/core/plugin_system";
import {
  DataProcessor,
  SourceProcessedFile,
  DataSourceRecord,
} from "@/core/data";
import Papa from "papaparse";

class CSVImporter implements DataProcessor {
  id = "csv";
  supportedFileTypes = ["text/csv"];

  process({ data }: SourceProcessedFile): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(data, {
        header: true,
        complete(results) {
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
