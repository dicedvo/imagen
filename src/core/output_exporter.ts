import { z } from "zod";
import TemplateRenderer from "./template/renderer";
import { Template, TemplateInstanceValues } from "./template/types";

export interface DefaultExportOptions {
  scale: number;
  height: number;
  width: number;
}

export type ExportOptions<Opts extends z.ZodTypeAny> = DefaultExportOptions &
  z.infer<Opts>;

export type ExportOutput = { blob: Blob } | { url: string };

export interface OutputExporter<Opts extends z.ZodTypeAny = z.ZodTypeAny> {
  optionsSchema: Opts;
  id: string;
  fileExtension: string;
  export(
    template: Template,
    values: TemplateInstanceValues,
    opts: ExportOptions<Opts>,
  ): Promise<ExportOutput>;
}

export interface OutputExporterFactory<Opts extends z.ZodTypeAny> {
  id: string;
  fileExtension: string;
  (
    renderer: TemplateRenderer,
  ): Omit<OutputExporter<Opts>, "id" | "fileExtension">;
}

export type _OutputExporter<Opts extends z.ZodTypeAny = z.ZodTypeAny> =
  | OutputExporter<Opts>
  | OutputExporterFactory<Opts>;
