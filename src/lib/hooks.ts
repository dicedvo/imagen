import { useShallow } from "zustand/react/shallow";
import { DataRecord } from "@/core/data";
import { exportImages as _exportImages } from "@/core/template/export";
import { _OutputExporter } from "@/core/output_exporter";
import { ExportScope } from "@/schemas/OutputExportSettingsSchema";
import { useUriHandlersStore } from "@/stores/registry_store";
import useTemplateStore from "@/stores/template_store";
import useDataStore from "@/stores/data_store";
import { RenderLayerFilter } from "@/core/template/renderer";
import emitter, { Events } from "./event-bus";

export function useExport() {
  const template = useTemplateStore(useShallow((state) => state.template));
  const selectRecordsByScope = useDataStore(
    useShallow((state) => state.selectRecordsByScope),
  );

  const uriHandlersRegistry = useUriHandlersStore();

  const exportImages = ({
    exporter,
    exporterOptions,
    exportScope,
    recordsForExport,
    renderFilter,
    filenameFormat,
  }: {
    exporter: _OutputExporter;
    exporterOptions: Record<string, unknown>;
    exportScope?: ExportScope;
    recordsForExport?: DataRecord[];
    renderFilter?: RenderLayerFilter;
    filenameFormat?: string;
  }) => {
    const finalFilenameFormat =
      filenameFormat || `{{_index}}.${exporter.fileExtension}`;

    return _exportImages({
      exporter,
      template,
      records: recordsForExport
        ? recordsForExport
        : exportScope
          ? selectRecordsByScope(exportScope)
          : [],
      filenameFormat: finalFilenameFormat,
      renderFilter,
      exporterOptions,
      uriHandlersRegistry,
    });
  };

  return {
    exportImages,
  };
}
