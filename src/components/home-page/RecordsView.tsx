import AddEntryDialog from "@/components/AddEntryDialog";
import { DataTable } from "@/components/data-table/DataTable";
import ExportDialog from "@/components/ExportDialog";
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
import { Field, Schema } from "@/lib/schema";
import useSchemaStore from "@/stores/schema_store";
import useDataStore, {
  DataStoreState,
  RECORDS_SEARCH_KEY,
  useRecordsSearchIndex,
} from "@/stores/data_store";
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
import MapSchemaDialog from "../MapFieldsDialog";
import SourceProvidersDialog from "../SourceProvidersDialog";
import { renderTemplateText } from "@/core/template/values";
import { showAlertDialog } from "@/lib/utils";

function determineColumns<SchemaType extends object = Record<string, unknown>>(
  store: DataStoreState<SchemaType>,
  fields: Field[],
): ColumnDef<Partial<DataRecord>, DataRecord>[] {
  if (fields.length === 0) {
    return [];
  }

  return fields.map(({ name, key, value }) => ({
    header: name,
    accessorKey: key,
    cell: ({ row }) => {
      if (row.original.data && row.original.data[key]) {
        return row.original.data[key];
      }

      const sourceId = store.sourceRecordToDataSourceIndex.get(
        row.original.sourceRecordId!,
      );

      if (sourceId) {
        const source = store.getSource(sourceId);
        if (source) {
          const systemSchemaValue = source.systemSchemaValues[key];
          if (systemSchemaValue) {
            return renderTemplateText(
              systemSchemaValue! as string,
              row.original.data!.original,
            );
          }
        }
      }

      // Use fallback template text using original data
      return renderTemplateText(value! as string, row.original.data!.original);
    },
  }));
}

function satisfiesFilterFn(filters: Filter[]) {
  return <T extends object = Record<string, unknown>>(result: T) => {
    for (const filter of filters) {
      if (!("field" in filter)) {
        continue;
      }

      const field = filter.field;
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

function RecordsView({
  columns,
  records,
}: {
  columns: ColumnDef<Partial<DataRecord>, DataRecord>[];
  records: DataRecord[];
}) {
  const [fields] = useSchemaStore(
    useShallow((state) => [state.currentSchema.fields]),
  );

  const [updateRecord, setCurrentRecordIndex, setSelectedRecordIndices] =
    useDataStore(
      useShallow((state) => [
        state.updateRecord,
        state.setCurrentRecordIndex,
        state.setSelectedRecordIndices,
      ]),
    );

  const selectedRecordIndices = useDataStore(
    useShallow((state) => state.selectedRecordIndices),
  );

  const template = useTemplateStore(useShallow((state) => state.template));

  if (fields.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
        <p className="text-muted-foreground text-2xl">No data added yet.</p>

        <div className="space-x-2">
          <ImportDataMenu>
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
                  value={row.original.tags ?? []}
                  onChange={(newTags) => {
                    updateRecord({
                      ...(row.original as DataRecord),
                      tags: newTags,
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

  const dataStore = useDataStore(useShallow((state) => state));
  const records = useDataStore(useShallow((state) => state.records));
  const [addSources, updateSource, conformRecordsToSchema] = useDataStore(
    useShallow((state) => [
      state.addSources,
      state.updateSource,
      state.conformRecordsToSchema,
    ]),
  );

  const [addRecords, removeRecord, setSelectedRecordIndices, selectedRecords] =
    useDataStore(
      useShallow((state) => [
        state.addRecords,
        state.removeRecord,
        state.setSelectedRecordIndices,
        state.selectedRecords(),
      ]),
    );

  const [currentSchema, setSchema] = useSchemaStore(
    useShallow((state) => [state.currentSchema, state.setSchema]),
  );

  const columns = useMemo(
    () =>
      !currentSchema.fields
        ? []
        : determineColumns(dataStore, currentSchema.fields),
    [dataStore, currentSchema],
  );

  const shownColumns = useMemo(() => {
    if (columnsToShow.length === 0) {
      return columns;
    }
    return columns.filter(
      (c) => "accessorKey" in c && columnsToShow.includes(c.accessorKey),
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
        : records.filter((r) => results.includes(r.id)),
      filters,
    );
  }, [records, filters, searchQuery]);

  const [sourcesToMapStack, setColumnsToMapStack] = useState<
    DataSource<Schema>[]
  >([]);

  const handleImportFinished = ({
    sources,
  }: {
    source: string;
    sources: DataSource<Schema>[];
  }) => {
    addSources(...sources);

    if (currentSchema.fields.length === 0) {
      showAlertDialog({
        title: "Schema Warning",
        description:
          "You have not created a schema yet. The schema of your first imported source will be used instead.",
        actions: {
          confirm: {
            label: "Continue",
            onClick() {
              if (sources.length === 0) return;
              const firstSource = sources[0];

              if (firstSource.schema.fields.length === 0) return;
              setSchema(structuredClone(firstSource.schema));

              updateSource({
                ...firstSource,
                systemSchemaValues: firstSource.schema.fields
                  .map<[string, unknown]>((f) => [f.key, f.value!])
                  .reduce<Record<string, unknown>>(
                    (acc, [key, value]) => ({
                      ...acc,
                      [key]: value,
                    }),
                    {},
                  ),
              });

              conformRecordsToSchema(firstSource.id, firstSource.schema);

              if (sources.length > 1) {
                setColumnsToMapStack(sources.slice(1));
              }
            },
          },
        },
      });
    }
  };

  useEffect(() => {
    // MiniSearch does not support adding/removing fields to index
    // so we need to reinitialize the search instance
    useSearchStore.reinitializeSearchInstance(RECORDS_SEARCH_KEY, {
      fields: ["id", ...currentSchema.fields.map((f) => f.key)],
    });
  }, [currentSchema]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="h-full w-full">
        <div className="px-4 py-1 flex items-center justify-between">
          <p className="font-semibold text-sm">Records</p>

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

            <ImportDataMenu>
              <Button size="sm" variant="ghost">
                <ImportIcon className="mr-2" size={16} />
                <span>Import</span>
              </Button>
            </ImportDataMenu>

            <AddEntryDialog onSuccess={addRecords}>
              <Button
                size="sm"
                variant="ghost"
                disabled={currentSchema.fields.length === 0}
              >
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
                      removeRecord(record.id);
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

          <RecordsView columns={shownColumns} records={filteredRecords} />
        </div>
      </div>

      <MapSchemaDialog
        source={
          sourcesToMapStack.length > 0
            ? sourcesToMapStack[sourcesToMapStack.length - 1]
            : null
        }
        currentSchema={currentSchema}
        onSuccess={(mappings) => {
          // setTimeout to 200ms, pop the columnsToMapStack, and then set the mappings
          setTimeout(() => {
            const lastSource = sourcesToMapStack[sourcesToMapStack.length - 1];
            if (!lastSource) return;
            updateSource({
              ...lastSource,
              systemSchemaValues: mappings as Record<string, unknown>,
            });

            conformRecordsToSchema(lastSource.id, currentSchema);
            setColumnsToMapStack((prev) => prev.slice(0, -1));
          }, 200);
        }}
      />

      <SourceProvidersDialog onImportFinished={handleImportFinished} />
    </div>
  );
}
