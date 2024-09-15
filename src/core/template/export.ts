import JSZip from "jszip";
import Konva from "konva";
import { DataRecord } from "../data";
import { _OutputExporter } from "../output_exporter";
import { IRegistry } from "../registries";
import URIHandler from "../uri_handler";
import TemplateRenderer from "./renderer";
import { Template, TemplateInstanceValues } from "./types";
import { compileTemplateValues, renderTemplateText } from "./values";

interface ExportInfo {
  filename: string;
  values: TemplateInstanceValues;
  width: number; // TODO: replace width with the opts.width setting
  height: number; // TODO: replace height with the opts.height setting
}

interface ExportItem {
  filename: string;
  content: Blob;
}

type GetRawInstanceValueFn = (
  t: Template | null,
  r: DataRecord,
) => TemplateInstanceValues | null;

function createExportInfoList(
  template: Template,
  filenameFormat: string,
  records: DataRecord[],
  onGetRawTemplateInstanceValue: GetRawInstanceValueFn,
): ExportInfo[] {
  return records
    .map((record) => {
      const rawValues = onGetRawTemplateInstanceValue(template, record);
      if (!rawValues) return null;
      return {
        filename: renderTemplateText(filenameFormat, record),
        values: compileTemplateValues(rawValues, record),
        width: template.settings.canvas_width,
        height: template.settings.canvas_height,
      };
    })
    .filter(Boolean) as ExportInfo[];
}

export async function exportRecords({
  exporter,
  template,
  records,
  filenameFormat,
  exporterOptions,
  onGetRawTemplateInstanceValue,
  uriHandlersRegistry,
}: {
  exporter: _OutputExporter;
  template: Template | null;
  records: DataRecord[];
  filenameFormat: string;
  exporterOptions: Record<string, unknown>;
  onGetRawTemplateInstanceValue: GetRawInstanceValueFn;
  uriHandlersRegistry: IRegistry<URIHandler>;
}) {
  if (!template) {
    throw new Error("No template loaded");
  }

  const toBeExported = createExportInfoList(
    template,
    filenameFormat,
    records,
    onGetRawTemplateInstanceValue,
  );
  if (toBeExported.length === 0) {
    throw new Error("No records to export");
  }

  const fakeCanvas = document.createElement("div");
  const stage = new Konva.Stage({
    container: fakeCanvas,
    width: 0,
    height: 0,
  });

  const outputLayer = new Konva.Layer();
  stage.add(outputLayer);

  const renderer = new TemplateRenderer(outputLayer, uriHandlersRegistry);
  renderer.setWaitForAssetLoad(true);

  const _exporter =
    typeof exporter === "object" ? exporter : exporter(renderer);
  const exports: ExportItem[] = [];

  for (const { values, filename } of toBeExported) {
    const output = await _exporter.export(template, values, exporterOptions);

    if ("url" in output) {
      const outputResponse = await fetch(output.url);
      const outputBlob = await outputResponse.blob();

      exports.push({
        filename,
        content: outputBlob,
      });
    } else {
      exports.push({
        filename,
        content: output.blob,
      });
    }
  }

  // outputLayer.destroy();
  // stage.destroy();

  if (exports.length === 1) {
    const [exported] = exports;
    return {
      filename: exported.filename,
      url: URL.createObjectURL(exported.content),
    };
  } else {
    const zip = new JSZip();
    for (const { filename, content } of exports) {
      zip.file(filename, content);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    return {
      filename: "export.zip",
      url: URL.createObjectURL(blob),
    };
  }
}
