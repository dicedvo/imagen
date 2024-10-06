import AddEntryDialog from "@/components/AddEntryDialog";
import { DataTable } from "@/components/data-table/DataTable";
import ExportDialog from "@/components/ExportDialog";
import FieldEditorDialog from "@/components/FieldEditorDialog";
import ImportDataMenu from "@/components/ImportDataMenu";
import SearchBox from "@/components/SearchBox";
import TagDisplay from "@/components/TagDisplay";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataRecord, DataSource } from "@/core/data";
import emitter from "@/lib/event-bus";
import { Field, stringToField } from "@/schemas/FieldSchema";
import useFieldsStore from "@/stores/fields_store";
import useRecordsStore, {
  RECORDS_SEARCH_KEY,
  useRecordsSearchIndex,
} from "@/stores/records_store";
import {
  useDataProcessorStore,
  useDataSourceStore,
} from "@/stores/registry_store";
import useSearchStore from "@/stores/search_store";
import useTagsStore from "@/stores/tags_store";
import useTemplateStore from "@/stores/template_store";
import { Filter } from "@nedpals/pbf";
import { ColumnDef } from "@tanstack/react-table";
import { getProperty, hasProperty } from "dot-prop";
import {
  ArrowRight,
  Columns3,
  DownloadIcon,
  ImportIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
  X,
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import MapFieldsDialog from "../MapFieldsDialog";

function determineColumns(
  fields: Field[],
): ColumnDef<Partial<DataRecord>, DataRecord>[] {
  if (fields.length === 0) {
    return [];
  }

  return fields.map(({ name, key }) => ({
    header: name,
    accessorKey: key,
  }));
}

function satisfiesFilterFn(filters: Filter[]) {
  return <T extends object = Record<string, unknown>>(result: T) => {
    for (const filter of filters) {
      if (!("field" in filter)) {
        continue;
      }

      let field = filter.field;
      if (field === "tags") {
        field = "__tags";
      }

      if (!hasProperty(result, field)) {
        return false;
      }

      const gotValue = getProperty(result, field) as unknown;
      const expected = filter.value;

      switch (filter.op) {
        case "eq": {
          if (gotValue !== expected) {
            return false;
          }
          break;
        }
        case "neq": {
          if (gotValue === expected) {
            return false;
          }
          break;
        }
        case "gt": {
          if (
            typeof gotValue !== "number" ||
            typeof expected !== "number" ||
            gotValue <= expected
          ) {
            return false;
          }
          break;
        }
        case "gte": {
          if (
            typeof gotValue !== "number" ||
            typeof expected !== "number" ||
            gotValue < expected
          ) {
            return false;
          }
          break;
        }
        case "lt": {
          if (
            typeof gotValue !== "number" ||
            typeof expected !== "number" ||
            gotValue >= expected
          ) {
            return false;
          }
          break;
        }
        case "lte": {
          if (
            typeof gotValue !== "number" ||
            typeof expected !== "number" ||
            gotValue > expected
          ) {
            return false;
          }
          break;
        }
        case "like": {
          if (
            typeof gotValue !== "string" ||
            typeof expected !== "string" ||
            !gotValue.includes(expected)
          ) {
            return false;
          }
          break;
        }
        case "nlike": {
          if (
            typeof gotValue !== "string" ||
            typeof expected !== "string" ||
            gotValue.includes(expected)
          ) {
            return false;
          }
          break;
        }
        case "any": {
          if (
            !Array.isArray(gotValue) ||
            !gotValue.some((v) => v === expected)
          ) {
            return false;
          }
          break;
        }
      }
    }
    return true;
  };
}

function filterResultsByFilter<T extends object = Record<string, unknown>>(
  results: T[],
  filters: Filter[],
): T[] {
  const satisfiesFilter = satisfiesFilterFn(filters);
  return results.filter(satisfiesFilter);
}

function ColumnsDropdown<TData = unknown, TValue = unknown>({
  children,
  columns,
  value: columnsToShow,
  onChange: setColumnsToShow,
}: {
  value: string[];
  children: ReactNode;
  columns: ColumnDef<TData, TValue>[];
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
      .map((c) =>
        typeof c.accessorKey === "string"
          ? c.accessorKey
          : c.accessorKey.toString(),
      )
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
          .map((c) => {
            const accessorKey =
              typeof c.accessorKey === "string"
                ? c.accessorKey
                : c.accessorKey.toString();

            return (
              <DropdownMenuCheckboxItem
                key={`column-${accessorKey}`}
                checked={columnsToShow.includes(accessorKey)}
                onSelect={(ev) => {
                  ev.preventDefault();
                }}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setColumnsToShow([...columnsToShow, accessorKey]);
                  } else {
                    setColumnsToShow(
                      columnsToShow.filter((k) => k !== accessorKey),
                    );
                  }

                  recordSelected(accessorKey);
                }}
              >
                {typeof c.header === "string" ? c.header : accessorKey}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TagsDropdown({
  children,
  value,
  onChange,
}: {
  value: string[];
  children: ReactNode;
  onChange: (columnKeys: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const tags = useTagsStore((state) => state.tags);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger disabled={tags.length === 0} asChild>
        {children}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Tagged as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tags.map((tag) => (
          <DropdownMenuCheckboxItem
            key={`tag-${tag.name}`}
            checked={value.includes(tag.name)}
            onSelect={(ev) => {
              ev.preventDefault();
            }}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange([...value, tag.name]);
              } else {
                onChange(value.filter((k) => k !== tag.name));
              }
            }}
          >
            <TagDisplay tag={tag} />
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DataView({
  columns,
  records,
  dataSources,
}: {
  columns: ColumnDef<Partial<DataRecord>, DataRecord>[];
  records: DataRecord[];
  dataSources: DataSource[];
}) {
  const [fields, addFields] = useFieldsStore(
    useShallow((state) => [state.fields, state.addFields]),
  );

  const [updateRecord, setCurrentRecordIndex, setSelectedRecordIndices] =
    useRecordsStore(
      useShallow((state) => [
        state.updateRecord,
        state.setCurrentRecordIndex,
        state.setSelectedRecordIndices,
      ]),
    );

  const selectedRecordIndices = useRecordsStore(
    useShallow((state) => state.selectedRecordIndices),
  );

  const template = useTemplateStore(useShallow((state) => state.template));

  if (fields.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
        <p className="text-muted-foreground text-2xl">No data added yet.</p>

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
    );
  }

  return (
    <DataTable
      className="border-y"
      data={records}
      rowSelection={selectedRecordIndices
        .map((idx) => idx)
        .reduce((pv, cv) => ({ ...pv, [cv]: true }), {})}
      onRowSelectionChange={(state) => {
        const indices = Object.keys(state).map(Number);
        setSelectedRecordIndices(...indices);
      }}
      columns={[
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
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
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
        // get the first 3 columns only
        ...columns,
        {
          id: "actions",
          size: 5,
          enableSorting: false,
          enableResizing: false,
          enableHiding: false,
          enablePinning: true,
          cell({ row }) {
            return (
              <div className="flex items-center space-x-1">
                <TagsDropdown
                  value={row.original.__tags ?? []}
                  onChange={(newTags) => {
                    updateRecord({
                      ...(row.original as DataRecord),
                      __tags: newTags,
                    });
                  }}
                >
                  <Button size="sm" variant="ghost">
                    <TagIcon size={20} />
                  </Button>
                </TagsDropdown>

                <Button
                  disabled={!template}
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentRecordIndex(row.index)}
                >
                  <ArrowRight size={20} />
                </Button>
              </div>
            );
          },
        },
      ]}
    />
  );
}

export default function DataList() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const recordsSearchIndex = useRecordsSearchIndex();
  const [columnsToShow, setColumnsToShow] = useState<string[]>([]);

  const [fields, addFields] = useFieldsStore(
    useShallow((state) => [state.fields, state.addFields]),
  );
  const records = useRecordsStore(useShallow((state) => state.records));

  const dataSources = useDataSourceStore((state) => state.items);
  const dataProcessors = useDataProcessorStore((state) => state.items);

  const [addRecords, removeRecord, setSelectedRecordIndices, selectedRecords] =
    useRecordsStore(
      useShallow((state) => [
        state.addRecords,
        state.removeRecord,
        state.setSelectedRecordIndices,
        state.selectedRecords(),
      ]),
    );

  const columns = useMemo(
    () => (!fields ? [] : determineColumns(fields)),
    [fields],
  );

  const shownColumns = useMemo(() => {
    if (columnsToShow.length === 0) {
      return columns;
    }
    return columns.filter(
      (c) =>
        "accessorKey" in c &&
        columnsToShow.includes(
          typeof c.accessorKey === "string"
            ? c.accessorKey
            : c.accessorKey.toString(),
        ),
    );
  }, [columns, columnsToShow]);

  const filteredRecords = useMemo(() => {
    if (searchQuery.length === 0 && filters.length === 0) {
      return records;
    }

    const results = recordsSearchIndex.search(searchQuery).map((r) => r.id);
    return filterResultsByFilter(
      results.length === 0
        ? records
        : records.filter((r) => results.includes(r.__id)),
      filters,
    );
  }, [records, filters, searchQuery]);

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
    <div className="flex flex-col h-full w-full">
      <div className="h-full w-full">
        <div className="px-4 py-1 flex items-center justify-between">
          <p className="font-semibold text-sm">Data List</p>

          <div>
            <ColumnsDropdown
              columns={columns}
              value={columnsToShow}
              onChange={setColumnsToShow}
            >
              <Button size="sm" variant="ghost" disabled={columns.length === 0}>
                <Columns3 className="mr-2" size={16} />
                <span>Columns</span>
              </Button>
            </ColumnsDropdown>

            <ImportDataMenu sources={dataSources}>
              <Button size="sm" variant="ghost">
                <ImportIcon className="mr-2" size={16} />
                <span>Import</span>
              </Button>
            </ImportDataMenu>

            <AddEntryDialog onSuccess={addRecords}>
              <Button disabled={fields.length === 0} size="sm" variant="ghost">
                <PlusIcon className="mr-2" size={16} />
                <span>Add Entry</span>
              </Button>
            </AddEntryDialog>
          </div>
        </div>

        <div className="h-full w-full flex-1 overflow-y-hidden">
          {selectedRecords.length !== 0 && (
            <div className="bg-white border-y p-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 py-1 rounded-full"
                  onClick={() => setSelectedRecordIndices()}
                >
                  <X size={20} />
                </Button>

                <span className="text-sm">
                  {selectedRecords.length} selected
                </span>
              </div>

              <div className="flex space-x-2 items-center">
                <ExportDialog scope="selected" onSuccess={() => {}}>
                  <Button size="sm" variant="ghost">
                    <DownloadIcon className="mr-2" size={20} />
                    <span>Export</span>
                  </Button>
                </ExportDialog>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    for (const record of selectedRecords) {
                      removeRecord(record.__id);
                    }
                    setSelectedRecordIndices();
                  }}
                >
                  <TrashIcon className="mr-2" size={20} />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          )}

          <div className="border-y">
            <SearchBox
              value={{
                filters: filters,
                query: searchQuery,
              }}
              onChange={({ filters, query }) => {
                setFilters(filters);
                setSearchQuery(query);
              }}
            />
          </div>

          <DataView
            columns={shownColumns}
            records={filteredRecords}
            dataSources={dataSources}
          />
        </div>
      </div>

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
    </div>
  );
}
