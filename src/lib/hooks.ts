import { useShallow } from "zustand/react/shallow";
import { DataRecord } from "@/core/data";
import { exportImages as _exportImages } from "@/core/template/export";
import { _OutputExporter } from "@/core/output_exporter";
import { ExportScope } from "@/schemas/OutputExportSettingsSchema";
import { useUriHandlersStore } from "@/stores/registry_store";
import useTemplateStore from "@/stores/template_store";
import useRecordsStore from "@/stores/records_store";
import { RenderLayerFilter } from "@/core/template/renderer";

export function useExport() {
  const [template, getTemplateInstanceValues] = useTemplateStore(
    useShallow((state) => [state.template, state.getTemplateInstanceValues]),
  );

  const selectRecordsByScope = useRecordsStore(
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
      onGetRawTemplateInstanceValue: getTemplateInstanceValues,
      uriHandlersRegistry,
    });
  };

  return {
    exportImages,
  };
}
