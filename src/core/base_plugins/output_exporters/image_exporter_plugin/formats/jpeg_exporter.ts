import { OutputExporterFactory } from "@/core/output_exporter";
import imageExportOptionsSchema from "../schema";

const JpegExporter: OutputExporterFactory<typeof imageExportOptionsSchema> = (
  renderer,
) => ({
  optionsSchema: imageExportOptionsSchema,
  async export(template, values, opts) {
    renderer.setFill("white");
    await renderer.render(template, values);

    const image = await renderer.layer!.toBlob({
      mimeType: "image/jpeg",
      quality: opts.quality,
      width: opts.width,
      height: opts.height,
    });

    return {
      blob: image as Blob,
    };
  },
});

JpegExporter.id = "jpeg";
JpegExporter.fileExtension = ".jpg";

export default JpegExporter;
