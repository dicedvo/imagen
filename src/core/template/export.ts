import Konva from "konva";
import { DataRecord } from "../data";
import { _OutputExporter } from "../output_exporter";
import { IRegistry } from "../registries";
import URIHandler from "../uri_handler";
import TemplateRenderer, { RenderLayerFilter } from "./renderer";
import { Template, TemplateInstanceValues } from "./types";
import { compileTemplateValues, renderTemplateText } from "./values";
import { loadAsyncImage } from "./konva-helpers";

interface ExportInfo {
  filename: string;
  values: TemplateInstanceValues;
  width: number; // TODO: replace width with the opts.width setting
  height: number; // TODO: replace height with the opts.height setting
}

export interface ExportItem {
  filename: string;
  content: Blob;
  width?: number;
  height?: number;
}

type GetRawInstanceValueFn = (
  r: DataRecord,
  t: Template | null,
) => TemplateInstanceValues | null;

export async function exportImages({
  exporter,
  template,
  records,
  filenameFormat,
  renderFilter,
  exporterOptions,
  onGetRawTemplateInstanceValue,
  uriHandlersRegistry,
}: {
  exporter: _OutputExporter;
  template: Template | null;
  records: DataRecord[];
  filenameFormat: string;
  renderFilter?: RenderLayerFilter;
  exporterOptions: Record<string, unknown>;
  onGetRawTemplateInstanceValue: GetRawInstanceValueFn;
  uriHandlersRegistry: IRegistry<URIHandler>;
}) {
  if (!template) {
    throw new Error("No template loaded");
  }

  const toBeExported = records
    .map((record, idx) => {
      const rawValues = onGetRawTemplateInstanceValue(record, template);
      if (!rawValues) return null;
      return {
        filename: renderTemplateText(filenameFormat, {
          ...record,
          _index: idx,
        }),
        values: compileTemplateValues(rawValues, record),
        width: template.settings.canvas_width,
        height: template.settings.canvas_height,
      };
    })
    .filter(Boolean) as ExportInfo[];

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

  if (renderFilter) {
    renderer.setRenderLayerFilter(renderFilter);
  }

  const _exporter =
    typeof exporter === "object" ? exporter : exporter(renderer);
  const exports: ExportItem[] = [];

  for (const { values, filename, ...other } of toBeExported) {
    const output = await _exporter.export(template, values, exporterOptions);

    if ("url" in output) {
      const outputResponse = await fetch(output.url);
      const outputBlob = await outputResponse.blob();

      exports.push({
        filename,
        content: outputBlob,
        ...other,
      });
    } else {
      exports.push({
        filename,
        content: output.blob,
        ...other,
      });
    }
  }

  return exports;
}

export function constructLayoutInfo(
  exports: ExportItem[],
  paperSize: { width: number; height: number },
  spacing: number,
  imageScale: number,
) {
  if (exports.length === 0) {
    return {
      imagesPerPage: 0,
      heightPerRow: 0,
      imagesPerRow: 0,
      rowsPerPage: 0,
      pages: 1,
    };
  }

  const { height: finalHeight, width: finalWidth } = paperSize;

  let imagesPerRow = 0; // how many images can fit in a row
  let rowsPerPage = 0; // how many rows can fit in a page
  let heightPerRow = 0; // height of the row

  // let's see first how many images can fit in a row
  for (let i = 0; i < exports.length; i++) {
    const exportItem = exports[i];
    if (!("width" in exportItem) || !("height" in exportItem)) continue;

    const { width, height } = exportItem as ExportItem & {
      width: number;
      height: number;
    };

    const spacingMul = spacing * i;
    const accumulatedWidth = width * imageScale * (i + 1);
    const widthWithSpacing = accumulatedWidth + spacingMul;
    if (widthWithSpacing > finalWidth) {
      break;
    }

    imagesPerRow = i + 1;
    heightPerRow = height;
  }

  // now let's see how many rows can fit in a page
  for (let i = 1; ; i++) {
    if ((heightPerRow + spacing) * i > finalHeight) {
      rowsPerPage = i;
      break;
    }
  }

  const imagesPerPage = imagesPerRow * rowsPerPage;

  return {
    imagesPerPage,
    heightPerRow,
    imagesPerRow,
    rowsPerPage,
    pages: Math.max(Math.min(Math.ceil(exports.length / imagesPerPage), 0), 1),
  };
}

export async function generatePrintReadyExports({
  exports,
  scale = 1,
  showOutline,
  paperSize: _paperSize, // in pixels
  margin, // in pixels
  spacing = 0, // in pixels
}: {
  exports: ExportItem[];
  scale?: number;
  showOutline?: boolean;

  // the values are already in pixels. if you are using other units and
  //  use a different resolution, you need to convert them to pixels
  paperSize: { width: number; height: number };
  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  spacing?: number;
}) {
  const paperSize = {
    width: _paperSize.width - (margin.left + margin.right),
    height: _paperSize.height - (margin.top + margin.bottom),
  };

  const layoutInfo = constructLayoutInfo(exports, paperSize, spacing, scale);

  const chunks = [...Array(layoutInfo.pages).keys()].map((page) => {
    // per row
    return [...Array(layoutInfo.rowsPerPage).keys()].map((row) => {
      // per image
      return [...Array(layoutInfo.imagesPerRow).keys()]
        .map((imageIdx) => {
          const index =
            page * layoutInfo.imagesPerRow * layoutInfo.rowsPerPage +
            row * layoutInfo.imagesPerRow +
            imageIdx;
          return index;
        })
        .filter((index) => index < exports.length)
        .map((index) => exports[index]);
    });
  });

  const exportedPages: ExportItem[] = [];
  const fakeCanvas = document.createElement("div");
  const stage = new Konva.Stage({
    container: fakeCanvas,
    width: paperSize.width,
    height: paperSize.height,
  });

  const outputLayer = new Konva.Layer();
  stage.add(outputLayer);

  for (let pageIndex = 0; pageIndex < chunks.length; pageIndex++) {
    const pageChunk = chunks[pageIndex];

    for (let rowIndex = 0; rowIndex < pageChunk.length; rowIndex++) {
      const row = pageChunk[rowIndex];
      const rowGroup = new Konva.Group();

      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const exportItem = row[colIndex];
        const { width, height } = exportItem as ExportItem & {
          width: number;
          height: number;
        };

        const x = colIndex * (width * scale + spacing);
        const y = rowIndex * (height * scale + spacing);

        const loadedImage = await loadAsyncImage(
          Promise.resolve(exportItem.content),
        );
        const image = new Konva.Image({
          image: loadedImage,
          x: showOutline ? x + 5 : x,
          y: showOutline ? y + 5 : y,
          width: width * scale,
          height: height * scale,
          strokeEnabled: showOutline,
          stroke: "black",
          strokeWidth: 5,
        });

        rowGroup.add(image);
      }

      outputLayer.add(rowGroup);
    }

    outputLayer.draw();

    const pageBlob = await new Promise<Blob | null>((resolve) => {
      stage.toBlob({
        mimeType: "image/png",
        quality: 1,
        pixelRatio: 1,
        callback: resolve,
      });
    });

    outputLayer.destroyChildren();

    // Continue if the page is empty
    if (!pageBlob) continue;

    exportedPages.push({
      filename: `page-${pageIndex + 1}.png`,
      content: pageBlob,
      width: paperSize.width,
      height: paperSize.height,
    });
  }

  stage.destroy();
  return exportedPages;
}
