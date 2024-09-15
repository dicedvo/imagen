import MapFieldsDialog from "@/components/MapFieldsDialog";
import Preview from "@/components/Preview";
import TemplateEditor from "@/components/TemplateEditor";
import TemplateImportDialog from "@/components/TemplateImportDialog";
import { Button } from "@/components/ui/button";
import { DataRecord } from "@/core/data";
import { stringToField } from "@/schemas/FieldSchema";
import useFieldsStore from "@/stores/fields_store";
import usePluginStore from "@/stores/plugin_store";
import useRecordsStore, { RECORDS_SEARCH_KEY } from "@/stores/records_store";
import useTemplateStore from "@/stores/template_store";
import { DownloadIcon, PlugIcon, PrinterIcon, UploadIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import emitter from "@/lib/event-bus";
import { compileTemplateValues, valuesFromTemplate } from "@/helpers/template";
import { loadBasePlugins } from "./lib/base-plugin-loader";
import InstalledPluginsDialog from "@/components/InstalledPluginsDialog";
import ExportDialog from "@/components/ExportDialog";
import PrintDialog from "@/components/PrintDialog";
import useSearchStore from "./stores/search_store";
import DataList from "@/components/home-page/DataList";

function App() {
  const template = useTemplateStore((state) => state.template);
  const templateInstanceValues = useTemplateStore(
    useShallow((state) => state.templateInstanceValues),
  );
  const [setTemplate, updateTemplateInstanceValue, getTemplateInstanceValues] =
    useTemplateStore(
      useShallow((state) => [
        state.setTemplate,
        state.updateTemplateInstanceValue,
        state.getTemplateInstanceValues,
      ]),
    );

  const [fields, addFields] = useFieldsStore(
    useShallow((state) => [state.fields, state.addFields]),
  );

  const currentRecord = useRecordsStore(
    useShallow((state) => state.currentRecord()),
  );

  const addRecords = useRecordsStore(useShallow((state) => state.addRecords));

  const editableTemplateInstanceValues = useMemo(() => {
    if (!template) {
      return null;
    } else if (currentRecord && currentRecord.__id) {
      const gotValues = getTemplateInstanceValues(
        template.name,
        currentRecord.__id,
      );

      if (gotValues) {
        return gotValues;
      }
    }
    return valuesFromTemplate(template);
  }, [template, currentRecord]);

  const previewTemplateInstanceValues = useMemo(() => {
    if (
      template &&
      currentRecord &&
      currentRecord.__id &&
      editableTemplateInstanceValues
    ) {
      const values = getTemplateInstanceValues(
        template.name,
        currentRecord.__id,
      );

      return compileTemplateValues(
        values ?? editableTemplateInstanceValues,
        currentRecord,
      );
    }
    return editableTemplateInstanceValues;
  }, [template, templateInstanceValues, currentRecord]);

  const [columnsToMap, setColumnsToMap] = useState<string[]>([]);
  const [dataToImport, setDataToImport] = useState<DataRecord[]>([]);

  const handleImportFinished = ({ data }: { data: DataRecord[] }) => {
    const forMap: Record<string, boolean> = {};
    const existingFields = fields
      .map((f) => f.key)
      .reduce<Record<string, boolean>>((pv, cv) => {
        pv[cv] = true;
        return pv;
      }, {});

    for (const record of data) {
      for (const fieldName in record) {
        if (
          fieldName === "__id" ||
          existingFields[fieldName] ||
          forMap[fieldName]
        ) {
          continue;
        }
        forMap[fieldName] = true;
      }
    }

    let shouldMap = true;
    if (Object.keys(forMap).length === 0 || fields.length === 0) {
      shouldMap = false;
    }

    if (shouldMap) {
      setColumnsToMap(Object.keys(forMap));
      setDataToImport(data);
    } else {
      addRecords(...data);
      addFields(...stringToField(Object.keys(forMap)));
    }
  };
  const pluginRegistry = usePluginStore();

  useEffect(() => {
    loadBasePlugins(pluginRegistry.load);
  }, []);

  useEffect(() => {
    emitter.on("onImportFinished", handleImportFinished);

    // MiniSearch does not support adding/removing fields to index
    // so we need to reinitialize the search instance
    useSearchStore.reinitializeSearchInstance(RECORDS_SEARCH_KEY, {
      fields: ["__id", ...fields.map((f) => f.key)],
    });

    return () => {
      emitter.off("onImportFinished", handleImportFinished);
    };
  }, [fields]);

  return (
    <>
      <main className="font-sans">
        <header className="px-4 border-b bg-white">
          <div className="py-3">
            <p>DICE ImaGen Tool</p>
          </div>
        </header>

        <section className="flex h-screen">
          <div className="w-1/2 border-r flex flex-col">
            <DataList onImportFinished={handleImportFinished} />
          </div>

          <div className="w-1/2">
            {/* canvas area */}
            <div className="bg-slate-200 w-full h-1/2">
              <Preview
                className="shadow"
                template={template}
                values={previewTemplateInstanceValues}
              />
            </div>

            {/* control options */}
            <div className="bg-white border-t h-1/2 flex flex-col">
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="font-semibold text-sm">Editor</p>

                <div className="space-x flex items-center">
                  <InstalledPluginsDialog>
                    <Button size="sm" variant="ghost">
                      <PlugIcon className="mr-2" />
                      <span>Plugins</span>
                    </Button>
                  </InstalledPluginsDialog>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      emitter.emit("openImporter", { id: "template-import" })
                    }
                  >
                    <UploadIcon className="mr-2" />
                    <span>Import Template</span>
                  </Button>

                  <PrintDialog>
                    <Button size="sm" variant="ghost">
                      <PrinterIcon className="mr-2" />
                      <span>Print</span>
                    </Button>
                  </PrintDialog>

                  <ExportDialog onSuccess={() => {}}>
                    <Button size="sm" variant="ghost">
                      <DownloadIcon className="mr-2" />
                      <span>Export</span>
                    </Button>
                  </ExportDialog>
                </div>
              </div>

              <div className="px-4 text-sm flex-1">
                <TemplateEditor
                  template={template}
                  values={editableTemplateInstanceValues}
                  onChange={(newValues) => {
                    if (!template || !currentRecord || !currentRecord.__id)
                      return;

                    updateTemplateInstanceValue(
                      currentRecord.__id,
                      template.name,
                      newValues,
                    );
                  }}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <MapFieldsDialog
        open={columnsToMap.length > 0}
        onOpenChange={() => {}}
        columns={columnsToMap}
        existingFields={fields}
        onSuccess={(mappings) => {
          // Create fields first
          const fieldsToCreate = Object.entries(mappings)
            .filter((en) => en[1] === "--create--")
            .map((en) => en[0]);
          addFields(...stringToField(fieldsToCreate));

          // Now map the entries
          addRecords(
            ...dataToImport.map((record) => {
              const newRecord: DataRecord = { __id: "" };
              for (const oldField in record) {
                const newField =
                  mappings[oldField] !== "--create--"
                    ? mappings[oldField]
                    : oldField;
                newRecord[newField] = record[oldField];
              }
              return newRecord;
            }),
          );

          setDataToImport([]);
          setColumnsToMap([]);
        }}
      />

      <TemplateImportDialog onUpload={setTemplate} />
    </>
  );
}

export default App;
