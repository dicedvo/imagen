import { IPluginRegistry } from "@/core/registries";

// Data Importers
import csvPlugin from "@/base_plugins/data_processors/csv_plugin";
import filePlugin from "@/base_plugins/data_sources/file_plugin";
import jsonPlugin from "@/base_plugins/data_processors/json_plugin";

// Image Generators
import qrCodePlugin from "@/base_plugins/image_generators/qr_code_plugin/index";
import dynamicImagePlugin from "@/base_plugins/image_generators/dynamic_image_plugin";

// URI Handlers
import httpHandlerPlugin from "@/base_plugins/uri_handlers/http_handler_plugin";
import base64HandlerPlugin from "@/base_plugins/uri_handlers/base64_handler_plugin";

// Output Exporters
import imageExporterPlugin from "@/base_plugins/output_exporters/image_exporter_plugin";

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
