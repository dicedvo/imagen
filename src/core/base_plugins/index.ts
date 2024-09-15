import { IPluginRegistry } from "@/core/registries";

// Data Importers
import csvPlugin from "./data_processors/csv_plugin";
import filePlugin from "./data_sources/file_plugin";
import jsonPlugin from "./data_processors/json_plugin";

// Image Generators
import qrCodePlugin from "./image_generators/qr_code_plugin/index";
import dynamicImagePlugin from "./image_generators/dynamic_image_plugin";

// URI Handlers
import httpHandlerPlugin from "./uri_handlers/http_handler_plugin";
import base64HandlerPlugin from "./uri_handlers/base64_handler_plugin";

// Output Exporters
import imageExporterPlugin from "./output_exporters/image_exporter_plugin";

export function loadBasePlugins(load: IPluginRegistry["load"]) {
  load(
    [
      csvPlugin,
      filePlugin,
      jsonPlugin,
      qrCodePlugin,
      dynamicImagePlugin,
      httpHandlerPlugin,
      base64HandlerPlugin,
      imageExporterPlugin,
    ],
    true,
  );
}
