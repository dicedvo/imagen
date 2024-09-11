import { OutputExporterFactory } from "@/core/output_exporter";
import imageExportOptionsSchema from "../schema";

const PngExporter: OutputExporterFactory<typeof imageExportOptionsSchema> = (
  renderer,
) => ({
  optionsSchema: imageExportOptionsSchema,
  async export(template, values, opts) {
    await renderer.render(template, values);

    console.log(renderer.layer);

    const image = await renderer.layer!.toBlob({
      mimeType: "image/png",
      quality: opts.quality,
      width: opts.width,
      height: opts.height,
    });

    return { blob: image as Blob };
  },
});

PngExporter.id = "png";
PngExporter.fileExtension = ".png";

export default PngExporter;
