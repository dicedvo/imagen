import { useShallow } from "zustand/react/shallow";
import { ReactNode, useMemo, useState } from "react";
import TabViewContainer from "./TabViewContainer";
import { useSourceProviderStore } from "@/stores/registry_store";
import { Button } from "../ui/button";
import { FileIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import useDataStore from "@/stores/data_store";
import { showAlertDialog } from "@/lib/utils";
import MapSchemaDialog from "../MapFieldsDialog";
import { DataSource } from "@/core/data";
import { Schema } from "@/lib/schema";
import useSchemaStore from "@/stores/schema_store";

function ListGroup({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="bg-slate-50 px-4 py-2 text-slate-800 border-b">
        <h3 className="uppercase text-xs font-semibold">{title}</h3>
      </div>

      <div className="flex flex-col">{children}</div>
    </div>
  );
}

export default function SourcesList() {
  const [sourceToMap, setSourceToMap] = useState<DataSource<Schema> | null>(
    null,
  );

  const currentSchema = useSchemaStore((state) => state.currentSchema);

  const [dataSources, removeSource, updateSource, conformRecordsToSchema] =
    useDataStore((state) => [
      state.sources,
      state.removeSource,
      state.updateSource,
      state.conformRecordsToSchema,
    ]);

  const [dataSourceProviders, dataSourceProviderInstances] =
    useSourceProviderStore(
      useShallow((state) => [state.registry.items, state.instances]),
    );

  const reusableDataSources = useMemo(
    () => dataSourceProviders.filter((src) => src.reusable),
    [dataSourceProviders],
  );

  return (
    <>
      <TabViewContainer
        title="Data Sources"
        actions={() => (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={reusableDataSources.length === 0}
                asChild
              >
                <Button size="sm" variant="ghost">
                  <PlusIcon className="mr-2" size={16} />
                  <span>Add New Provider</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {reusableDataSources.map((src) => (
                  <DropdownMenuItem
                    key={`importer_${src.id}`}
                    onSelect={() => {
                      // TODO: Implement create source instance modal
                      console.log("importing", src);
                    }}
                  >
                    <src.icon className="mr-2 h-4 w-4" />
                    <span>
                      {typeof src.importFromLabel === "function"
                        ? src.importFromLabel({})
                        : src.importFromLabel}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      >
        <div className="flex flex-col divide-y">
          <div className="flex flex-col flex-1">
            {dataSources.length > 0 ? (
              dataSources.map((source) => {
                const SourceIcon =
                  dataSourceProviders.find(
                    (src) => src.id === source.sourceProviderId,
                  )?.icon ?? FileIcon;
                return (
                  <div
                    key={`instance_${source.id}`}
                    className="px-4 py-2 hover:bg-slate-200/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <SourceIcon />
                        <div className="text-sm font-semibold">
                          {source.name}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="icon"
                          onClick={() => setSourceToMap(source)}
                          variant="secondary"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>

                        <Button
                          size="icon"
                          onClick={() => {
                            showAlertDialog({
                              title: "Delete Source",
                              description: `Are you sure you want to delete the source "${source.name}"?`,
                              actions: {
                                confirm: {
                                  onClick: () => {
                                    removeSource(source.id);
                                  },
                                },
                              },
                            });
                          }}
                          variant="destructive"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-48 flex flex-col items-center justify-center">
                <p className="text-sm text-slate-500">No source added yet.</p>
              </div>
            )}
          </div>

          <ListGroup className="flex-1" title="Source Providers">
            {dataSourceProviders.length > 0 ? (
              dataSourceProviders.map((src) =>
                src.reusable ? (
                  dataSourceProviderInstances
                    .filter((srcInst) => srcInst.sourceId === src.id)
                    .map((srcInst) => (
                      <div
                        key={`src_instance_${srcInst.id}`}
                        className="px-4 py-2"
                      >
                        <div className="flex items-center space-x-2">
                          <src.icon />
                          <div className="text-sm font-semibold">
                            {srcInst.id}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div
                    key={`src_${src.id}`}
                    className="flex items-center px-4 py-2 space-x-2 hover:bg-slate-200/40"
                  >
                    <src.icon />
                    <div className="text-sm font-semibold">{src.name}</div>
                  </div>
                ),
              )
            ) : (
              <div className="h-48 flex flex-col items-center justify-center">
                <p className="text-sm text-slate-500">
                  No source providers added yet.
                </p>
              </div>
            )}
          </ListGroup>
        </div>
      </TabViewContainer>

      <MapSchemaDialog
        source={sourceToMap}
        currentSchema={currentSchema}
        onClose={() => setSourceToMap(null)}
        onSuccess={(mappings) => {
          if (!sourceToMap) return;

          // setTimeout to 200ms, pop the columnsToMapStack, and then set the mappings
          setTimeout(() => {
            updateSource({
              ...sourceToMap,
              systemSchemaValues: mappings as Record<string, unknown>,
            });
            conformRecordsToSchema(sourceToMap.id, currentSchema);
            setSourceToMap(null);
          }, 200);
        }}
      />
    </>
  );
}
