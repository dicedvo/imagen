import { IPluginRegistry } from "@/core/registries";

// Source Providers
import filePlugin from "./source_providers/file_plugin";
import virtualPlugin from "./source_providers/virtual_plugin";

// Data Processors
import csvPlugin from "./data_processors/csv_plugin";
import jsonPlugin from "./data_processors/json_plugin";

// Image Generators
import qrCodePlugin from "./image_generators/qr_code_plugin/index";
import dynamicImagePlugin from "./image_generators/dynamic_image_plugin";

// URI Handlers
import httpHandlerPlugin from "./uri_handlers/http_handler_plugin";
import base64HandlerPlugin from "./uri_handlers/base64_handler_plugin";

// Output Exporters
import imageExporterPlugin from "./output_exporters/image_exporter_plugin";

// Schema Field Types
import baseSchemaTypesPlugin from "./schema_field_types/base_schema_types";

export function loadBasePlugins(load: IPluginRegistry["load"]) {
  load(
    [
      filePlugin,
      virtualPlugin,
      csvPlugin,
      jsonPlugin,
      qrCodePlugin,
      dynamicImagePlugin,
      httpHandlerPlugin,
      base64HandlerPlugin,
      imageExporterPlugin,
      baseSchemaTypesPlugin,
    ],
    true,
  );
}
