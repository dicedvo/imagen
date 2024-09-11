import { Plugin } from "@/core/plugin_system";
import JpegExporter from "./formats/jpeg_exporter";
import PngExporter from "./formats/png_exporter";

const imageExportPlugin: Plugin = {
  meta: {
    id: "image_exporter",
    name: "Image Exporter",
    publisher: "imagen",
    version: "0.1",
    description: "Exports the current canvas as an image",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerOutputExporter(JpegExporter);
    ctx.registerOutputExporter(PngExporter);
  },
};

export default imageExportPlugin;
