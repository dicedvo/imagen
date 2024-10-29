import { DataRecord, DataSource, toDataRecord } from "@/core/data";
import { ExportScope } from "@/schemas/OutputExportSettingsSchema";
import { create } from "zustand";
import useSearchStore from "./search_store";
import { Schema } from "@/lib/schema";
import fastDeepEqual from "fast-deep-equal";

export interface DataStoreState<
  SchemaType extends object = Record<string, unknown>,
> {
  // Data Sources
  sources: DataSource<SchemaType>[];
  addSources: (...records: DataSource<SchemaType>[]) => void;
  removeSource: (sourceId: string) => void;
  updateSource: (source: DataSource<SchemaType>) => void;
  sourceIndex: Map<string, number>;
  getSource: (sourceId: string) => DataSource<SchemaType> | null;

  // Data Source Records
  sourceRecordToDataSourceIndex: Map<string, string>;
  // updateSourceRecord: (sourceId: string, record: DataRecord) => void;

  // Data Records
  records: DataRecord[];
  selectedRecordIndices: number[];
  currentRecordIndex: number;
  addRecords: (...records: DataRecord[]) => void;
  updateRecord: (record: DataRecord) => void;
  removeRecord: (recordKey: string) => void;
  removeRecordsBySourceRecordIds(...sourceRecordIds: string[]): void;
  setCurrentRecordIndex: (index: number) => void;
  setSelectedRecordIndices: (...indices: number[]) => void;
  currentRecord(): DataRecord | null;
  selectedRecords(): DataRecord[];
  selectRecordsByScope(scope: ExportScope): DataRecord[];
}

export const RECORDS_SEARCH_KEY = Symbol();

export const useRecordsSearchIndex = () =>
  useSearchStore.getSearchInstance<DataRecord>(RECORDS_SEARCH_KEY);

const useDataStore = create<DataStoreState<Schema>>((set, get) => {
  const dataRecordSearchIndexer =
    useSearchStore.createSearchInstance<DataRecord>(
      RECORDS_SEARCH_KEY,
      {
        fields: ["tags"],
        idField: "id",
        extractField(document, fieldName) {
          if (fieldName === "tags") {
            return (document.tags ?? []).join(" ");
          } else if (fieldName === "id") {
            return document.id;
          }
          return document.data[fieldName] as unknown as string;
        },
      },
      {
        onReinitialize() {
          return useDataStore.getState().records;
        },
      },
    );

  return {
    sources: [],
    sourceIndex: new Map<string, number>(),
    addSources: (...sources) => {
      set((state) => {
        const newSources = sources.filter(
          (src) => !state.sources.some((s) => s.id === src.id),
        );

        // Add new sources to the store
        const newSourceList = [...state.sources, ...newSources];

        // Add records from the new sources
        const newRecords = sources.flatMap((source) =>
          source.records.map((r) => toDataRecord(r)),
        );

        state.addRecords(...newRecords);
        return {
          sources: newSourceList,
          sourceRecordToDataSourceIndex: [
            ...state.sourceRecordToDataSourceIndex,
            ...newSources.flatMap((source) =>
              source.records.map((record) => [record.id, source.id]),
            ),
          ].reduce(
            (acc, [recordId, sourceId]) => acc.set(recordId, sourceId),
            new Map<string, string>(),
          ),
          sourceIndex: sources.reduce(
            (acc, cv, idx) => acc.set(cv.id, state.sources.length + idx),
            new Map([...state.sourceIndex]),
          ),
        };
      });
    },
    removeSource: (sourceId) => {
      set((state) => {
        const index = state.sources.findIndex((r) => r.id === sourceId);
        if (index === -1) {
          throw new Error(`Record with key ${sourceId} not found`);
        }

        // Get all record ids from the source
        const recordIds: string[] = [];
        recordIds.push(...state.sources[index].records.map((r) => r.id));

        const newSources = [...state.sources];
        newSources.splice(index, 1);

        // Remove records from the store
        state.removeRecordsBySourceRecordIds(...recordIds);

        return {
          sources: newSources,
          sourceRecordToDataSourceIndex: recordIds.reduce((acc, recordId) => {
            acc.delete(recordId);
            return acc;
          }, state.sourceRecordToDataSourceIndex),
          sourceIndex: newSources.reduce(
            (acc, cv, idx) => acc.set(cv.id, idx),
            new Map<string, number>(),
          ),
        };
      });
    },
    updateSource: (source) => {
      set((state) => {
        if (!source.id) {
          return state;
        }

        const index = state.sources.findIndex((r) => r.id === source.id);
        if (index === -1) {
          throw new Error(`Record with key ${source.id} not found`);
        }

        const newSources = [...state.sources];
        newSources[index] = source;

        if (fastDeepEqual(state.sources[index].records, source.records)) {
          return {
            sources: newSources,
          };
        }

        // Remove existing records from the store
        state.removeRecordsBySourceRecordIds(
          ...state.sources[index].records.map((r) => r.id),
        );

        // Add new records to the store
        source.records.forEach((record) =>
          state.addRecords(toDataRecord(record)),
        );

        // Add new records to the store (if any)
        return {
          sources: newSources,
          sourceRecordToDataSourceIndex: [
            ...state.sourceRecordToDataSourceIndex,
            ...source.records.map((record) => [record.id, source.id]),
          ].reduce(
            (acc, [recordId, sourceId]) => acc.set(recordId, sourceId),
            new Map<string, string>(),
          ),
        };
      });
    },
    getSource: (sourceId) => {
      const idx = get().sourceIndex.get(sourceId);
      if (!idx) {
        return null;
      }
      return get().sources[idx];
    },

    sourceRecordToDataSourceIndex: new Map<string, string>(),

    records: [],
    currentRecordIndex: -1,
    addRecords: (...records) => {
      set((state) => {
        const newRecords = records.filter(
          (record) => !state.records.some((r) => r.id === record.id),
        );
        dataRecordSearchIndexer.addAll(newRecords);
        return { records: [...state.records, ...newRecords] };
      });
    },
    updateRecord: (record) => {
      set((state) => {
        if (!record.id) {
          return state;
        }

        const index = state.records.findIndex((r) => r.id === record.id);
        if (index === -1) {
          throw new Error(`Record with key ${record.id} not found`);
        }

        // "It is possible to re-index a single document if
        // you temporarily keep the old version, by first removing
        // the old version, then adding the new one".
        // - https://github.com/lucaong/minisearch/issues/106
        dataRecordSearchIndexer.remove(state.records[index]);

        const newRecords = [...state.records];
        newRecords[index] = record;

        dataRecordSearchIndexer.add(record);
        return { records: newRecords };
      });
    },
    removeRecordsBySourceRecordIds: (...sourceRecordIds: string[]) => {
      set((state) => {
        state.records
          .filter((r) => sourceRecordIds.includes(r.sourceRecordId))
          .forEach((recordId) => {
            dataRecordSearchIndexer.remove(recordId);
          });

        return {
          records: state.records.filter(
            (r) => !sourceRecordIds.includes(r.sourceRecordId),
          ),
        };
      });
    },
    removeRecord: (recordId: string) => {
      set((state) => {
        const index = state.records.findIndex((r) => r.id === recordId);
        if (index === -1) {
          throw new Error(`Record with key ${recordId} not found`);
        }

        const oldRecord = state.records[index];
        const newRecords = [...state.records];
        newRecords.splice(index, 1);

        dataRecordSearchIndexer.remove(oldRecord);
        return { records: newRecords };
      });
    },
    setCurrentRecordIndex: (index: number) => {
      set({ currentRecordIndex: index });
    },
    currentRecord: () => {
      const recordIdx = get().currentRecordIndex;
      const records = get().records;
      if (
        recordIdx === -1 ||
        records.length === 0 ||
        recordIdx >= records.length
      ) {
        return null;
      }
      return records[recordIdx];
    },
    selectedRecordIndices: [],
    setSelectedRecordIndices: (...indices: number[]) => {
      set({ selectedRecordIndices: indices });
    },
    selectedRecords: () => {
      const indices = get().selectedRecordIndices;
      const records = get().records;
      return indices
        .filter((index) => index < records.length)
        .map((index) => records[index]);
    },
    selectRecordsByScope(exportScope: ExportScope) {
      switch (exportScope) {
        case "current": {
          const currentRecord = get().currentRecord();
          if (!currentRecord) return [];
          return [currentRecord];
        }
        case "selected":
          return get().selectedRecords();
        case "all":
          return get().records;
        default:
          if (exportScope.startsWith("tagged:")) {
            const tag = decodeURIComponent(exportScope.replace(/^tagged:/, ""));
            const taggedRecords = get().records.filter((record) => {
              return record.tags && record.tags.indexOf(tag) !== -1;
            });
            return taggedRecords;
          }
          return get().records;
      }
    },
  };
});

export default useDataStore;
