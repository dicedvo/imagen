import { FieldValues } from "react-hook-form";
import { DataProcessor, DataSource } from "./data";
import ImageGenerator, { ImageGeneratorValue } from "./image_generator";
import { _OutputExporter } from "./output_exporter";
import URIHandler from "./uri_handler";

export interface PluginMeta {
  id: string;
  name: string;
  publisher: string;
  version: string;
  description: string;
  author: {
    name: string;
    email?: string;
  };
}

export interface Plugin {
  meta: PluginMeta;
  activate(ctx: PluginInterface): void;
  deactivate?(ctx: PluginInterface): void;
}

export interface PluginInterface {
  registerDataProcessor(importer: DataProcessor): void;
  registerDataSource(source: DataSource): void;
  registerImageGenerator<T extends FieldValues = ImageGeneratorValue>(
    generator: ImageGenerator<T>,
  ): void;
  registerURIHandler(handler: URIHandler): void;
  registerOutputExporter(exporter: _OutputExporter): void;
}

export type PluginEvents = {
  onPluginRegistered: Plugin;
  onPluginChangeState: { id: string; enabled: boolean };
};
