import { DataRecord } from "@/core/data";
import { create } from "zustand";
import useSearchStore from "./search_store";

export interface RecordsState {
  records: DataRecord[];
  selectedRecordIndices: number[];
  currentRecordIndex: number;
  addRecords: (...records: DataRecord[]) => void;
  updateRecord: (record: DataRecord) => void;
  removeRecord: (recordKey: string) => void;
  setCurrentRecordIndex: (index: number) => void;
  setSelectedRecordIndices: (...indices: number[]) => void;
  currentRecord(): DataRecord | null;
  selectedRecords(): DataRecord[];
}

export const RECORDS_SEARCH_KEY = Symbol();

export const useRecordsSearchIndex = () =>
  useSearchStore.getSearchInstance<DataRecord>(RECORDS_SEARCH_KEY);

const useRecordsStore = create<RecordsState>((set, get) => {
  const searchIndexer = useSearchStore.createSearchInstance<DataRecord>(
    RECORDS_SEARCH_KEY,
    {
      fields: ["tags"],
      idField: "__id",
      extractField(document, fieldName) {
        if (fieldName === "tags") {
          return (document.__tags ?? []).join(" ");
        }
        return document[fieldName] as unknown as string;
      },
    },
    {
      onReinitialize() {
        return useRecordsStore.getState().records;
      },
    },
  );

  return {
    records: [] as DataRecord[],
    index: new Map<string, number>(),
    currentRecordIndex: -1,
    addRecords: (...records: DataRecord[]) => {
      set((state) => {
        const newRecords = records.filter(
          (record) => !state.records.some((r) => r.key === record.key),
        );

        searchIndexer.addAll(newRecords);
        return { records: [...state.records, ...newRecords] };
      });
    },
    updateRecord: (record: DataRecord) => {
      set((state) => {
        if (!record.__id) {
          return state;
        }

        const index = state.records.findIndex((r) => r.__id === record.__id);
        if (index === -1) {
          throw new Error(`Record with key ${record.key} not found`);
        }

        // "It is possible to re-index a single document if
        // you temporarily keep the old version, by first removing
        // the old version, then adding the new one".
        // - https://github.com/lucaong/minisearch/issues/106
        searchIndexer.remove(state.records[index]);

        const newRecords = [...state.records];
        newRecords[index] = record;

        searchIndexer.add(record);
        return { records: newRecords };
      });
    },
    removeRecord: (recordId: string) => {
      set((state) => {
        const index = state.records.findIndex((r) => r.__id === recordId);
        if (index === -1) {
          throw new Error(`Record with key ${recordId} not found`);
        }

        const oldRecord = state.records[index];
        const newRecords = [...state.records];
        newRecords.splice(index, 1);

        searchIndexer.remove(oldRecord);
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
  };
});

export default useRecordsStore;
