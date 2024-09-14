import { DataRecord } from "@/core/data";
import { create } from "zustand";

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

const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [] as DataRecord[],
  currentRecordIndex: -1,
  addRecords: (...records: DataRecord[]) => {
    set((state) => {
      const newRecords = records.filter(
        (record) => !state.records.some((r) => r.key === record.key),
      );
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

      const newRecords = [...state.records];
      newRecords[index] = record;
      return { records: newRecords };
    });
  },
  removeRecord: (recordKey: string) => {
    set((state) => {
      const index = state.records.findIndex((r) => r.__id === recordKey);
      if (index === -1) {
        throw new Error(`Record with key ${recordKey} not found`);
      }

      const newRecords = [...state.records];
      newRecords.splice(index, 1);
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
}));

export default useRecordsStore;
