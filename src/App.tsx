import AddEntryDialog from "@/components/AddEntryDialog";
import { DataTable } from "@/components/data-table/DataTable";
import FieldEditorDialog from "@/components/FieldEditorDialog";
import ImportDataMenu from "@/components/ImportDataMenu";
import ManageFieldsDialog from "@/components/ManageFieldsDialog";
import MapFieldsDialog from "@/components/MapFieldsDialog";
import Preview from "@/components/Preview";
import TemplateEditor from "@/components/TemplateEditor";
import TemplateImportDialog from "@/components/TemplateImportDialog";
import { Button } from "@/components/ui/button";
import { DataRecord } from "@/core/data";
import { Field, stringToField } from "@/schemas/FieldSchema";
import useFieldsStore from "@/stores/fields_store";
import usePluginStore from "@/stores/plugin_store";
import useRecordsStore from "@/stores/records_store";
import useTemplateStore from "@/stores/template_store";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  Columns3,
  DownloadIcon,
  ImportIcon,
  PlugIcon,
  PlusIcon,
  PrinterIcon,
  SlidersHorizontalIcon,
  TagIcon,
  TagsIcon,
  UploadIcon,
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import emitter from "@/lib/event-bus";
import { compileTemplateValues, valuesFromTemplate } from "@/helpers/template";
import { loadBasePlugins } from "./lib/base-plugin-loader";
import InstalledPluginsDialog from "@/components/InstalledPluginsDialog";
import {
  useDataProcessorStore,
  useDataSourceStore,
} from "./stores/registry_store";
import ExportDialog from "@/components/ExportDialog";
import PrintDialog from "@/components/PrintDialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Checkbox } from "./components/ui/checkbox";

function determineColumns(fields: Field[]): ColumnDef<unknown, DataRecord>[] {
  if (fields.length === 0) {
    return [];
  }

  return fields.map(({ name, key }) => ({
    header: name,
    accessorKey: key,
  }));
}

function ColumnsDropdown({
  children,
  columns,
  value: columnsToShow,
  onChange: setColumnsToShow,
}: {
  value: string[];
  children: ReactNode;
  columns: ColumnDef<unknown, DataRecord>[];
  onChange: (columnKeys: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const lastSelected = useRef<string | null>(null);
  const newlySelected = useRef<string | null>(null);

  const recordSelected = (colKey: string) => {
    lastSelected.current = newlySelected.current;
    newlySelected.current = colKey;
  };

  useEffect(() => {
    const firstThreeCols = columns
      .filter((c) => "accessorKey" in c)
      .map((c) => c.accessorKey)
      .slice(0, 3);

    setColumnsToShow(firstThreeCols);
    recordSelected(firstThreeCols[firstThreeCols.length - 1]);
  }, [columns]);

  useEffect(() => {
    if (columnsToShow.length < 3) {
      // to avoid accidentally removing the last selected column
      // even if the length is less than 3
      lastSelected.current = null;
    }

    if (columnsToShow.length <= 3) {
      return;
    }

    let newColumnsToShow = columnsToShow;
    if (lastSelected.current) {
      newColumnsToShow = columnsToShow.filter(
        (k) => k !== lastSelected.current,
      );
    }

    setColumnsToShow(
      newColumnsToShow.length <= 3
        ? newColumnsToShow
        : newColumnsToShow.slice(0, 3),
    );
  }, [columnsToShow]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Columns to show</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns
          .filter((c) => "accessorKey" in c)
          .map((c) => (
            <DropdownMenuCheckboxItem
              key={`column-${c.accessorKey}`}
              checked={columnsToShow.includes(c.accessorKey)}
              onSelect={(ev) => {
                ev.preventDefault();
              }}
              onCheckedChange={(checked) => {
                if (checked) {
                  setColumnsToShow([...columnsToShow, c.accessorKey]);
                } else {
                  setColumnsToShow(
                    columnsToShow.filter((k) => k !== c.accessorKey),
                  );
                }

                recordSelected(c.accessorKey);
              }}
            >
              {typeof c.header === "string" ? c.header : c.accessorKey}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

  const [records, currentRecord] = useRecordsStore(
    useShallow((state) => [state.records, state.currentRecord()]),
  );

  const [addRecords, setCurrentRecordIndex] = useRecordsStore(
    useShallow((state) => [state.addRecords, state.setCurrentRecordIndex]),
  );

  const [columnsToShow, setColumnsToShow] = useState<string[]>([]);

  const columns = useMemo(
    () => (!fields ? [] : determineColumns(fields)),
    [fields],
  );

  const shownColumns = useMemo(() => {
    if (columnsToShow.length === 0) {
      return columns;
    }
    return columns.filter(
      (c) => "accessorKey" in c && columnsToShow.includes(c.accessorKey),
    );
  }, [columns, columnsToShow]);

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

  const isExportable = useMemo(() => {
    return records.length > 0 && template;
  }, [records, template]);

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

  const dataSources = useDataSourceStore((state) => state.items);
  const dataProcessors = useDataProcessorStore((state) => state.items);
  const pluginRegistry = usePluginStore();

  useEffect(() => {
    loadBasePlugins(pluginRegistry.load);
  }, []);

  useEffect(() => {
    emitter.on("onImportFinished", handleImportFinished);
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
            <div className="px-4 py-1 flex items-center justify-between">
              <p className="font-semibold text-sm">Data List</p>

              <div>
                <ColumnsDropdown
                  columns={columns}
                  value={columnsToShow}
                  onChange={setColumnsToShow}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={columns.length === 0}
                  >
                    <Columns3 className="mr-2" size={16} />
                    <span>Columns</span>
                  </Button>
                </ColumnsDropdown>

                <Button size="sm" variant="ghost">
                  <TagsIcon className="mr-2" size={16} />
                  <span>Tags</span>
                </Button>

                <ManageFieldsDialog>
                  <Button size="sm" variant="ghost">
                    <SlidersHorizontalIcon className="mr-2" size={16} />
                    <span>Manage Fields</span>
                  </Button>
                </ManageFieldsDialog>

                <ImportDataMenu sources={dataSources}>
                  <Button size="sm" variant="ghost">
                    <ImportIcon className="mr-2" size={16} />
                    <span>Import</span>
                  </Button>
                </ImportDataMenu>

                <AddEntryDialog onSuccess={addRecords}>
                  <Button
                    disabled={fields.length === 0}
                    size="sm"
                    variant="ghost"
                  >
                    <PlusIcon className="mr-2" size={16} />
                    <span>Add Entry</span>
                  </Button>
                </AddEntryDialog>
              </div>
            </div>

            <div className="flex-1 overflow-y-hidden">
              {fields.length !== 0 ? (
                <DataTable
                  className="border-y"
                  onRowSelectionChange={(state) => {
                    console.log("onRowSelectionChange", state);
                  }}
                  columns={[
                    {
                      id: "select",
                      header: ({ table }) => (
                        <Checkbox
                          checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() &&
                              "indeterminate")
                          }
                          onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                          }
                          aria-label="Select all"
                        />
                      ),
                      cell: ({ row }) => (
                        <Checkbox
                          checked={row.getIsSelected()}
                          onCheckedChange={(value) =>
                            row.toggleSelected(!!value)
                          }
                          aria-label="Select row"
                        />
                      ),
                      enableSorting: false,
                      enableHiding: false,
                    },
                    // get the first 3 columns only
                    ...shownColumns.slice(0, 3),
                    {
                      header: "Actions",
                      size: 5,
                      enableSorting: false,
                      enableResizing: false,
                      enableHiding: false,
                      enablePinning: true,
                      cell({ row }) {
                        return (
                          <div className="flex items-center space-x-2">
                            <Button
                              disabled={template == null}
                              size="sm"
                              variant="ghost"
                              onClick={() => {}}
                            >
                              <TagIcon />
                            </Button>

                            <Button
                              disabled={template == null}
                              size="sm"
                              variant="ghost"
                              onClick={() => setCurrentRecordIndex(row.index)}
                            >
                              <ArrowRight />
                            </Button>
                          </div>
                        );
                      },
                    },
                  ]}
                  data={records}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                  <p className="text-muted-foreground text-2xl">
                    No data added yet.
                  </p>

                  <div className="space-x-2">
                    <FieldEditorDialog onSave={addFields}>
                      <Button variant="secondary">
                        <PlusIcon className="mr-2" />
                        <span>Add field</span>
                      </Button>
                    </FieldEditorDialog>

                    <ImportDataMenu sources={dataSources}>
                      <Button variant="secondary">
                        <ImportIcon className="mr-2" />
                        <span>Import Data</span>
                      </Button>
                    </ImportDataMenu>
                  </div>
                </div>
              )}
            </div>
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
                    <Button size="sm" variant="ghost" disabled={!isExportable}>
                      <PrinterIcon className="mr-2" />
                      <span>Print</span>
                    </Button>
                  </PrintDialog>

                  <ExportDialog onSuccess={() => {}}>
                    <Button size="sm" variant="ghost" disabled={!isExportable}>
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
                    // console.log(record
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
              const newRecord: DataRecord = {};
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

      {dataSources
        .filter((source) => source.preElement)
        .map((source) => {
          const DataSourcePreElement = source.preElement!;
          return (
            <DataSourcePreElement
              processors={dataProcessors}
              onImportFinished={handleImportFinished}
              key={`importer_${source.id}`}
            />
          );
        })}

      <TemplateImportDialog onUpload={setTemplate} />
    </>
  );
}

export default App;
