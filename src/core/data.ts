import { UploadProgress } from "@/lib/progress";
import { ReactNode } from "react";

export type SourceInput = File | string;

export type DataRecord = {
  __id?: string;
  __tags?: string[];
  [key: string]: unknown;
};

export interface DataSourcePreElementProps {
  processors: DataProcessor[];
  onImportFinished?: (event: { source: string; data: DataRecord[] }) => void;
}

export interface DataSourceElementProps {
  processors: DataProcessor[];
  children: ReactNode;
}

export interface DataSource {
  id: string;
  importFromLabel: string;
  icon(props: { className?: string }): ReactNode;
  preElement?(props: DataSourcePreElementProps): ReactNode;
  element?(props: DataSourceElementProps): ReactNode;
  import(
    input: SourceInput,
    progress: UploadProgress,
    dataProcessors: DataProcessor[],
  ): Promise<DataRecord[]>;
}

export interface DataProcessor {
  id: string;
  supportedFileTypes: string[];
  process(data: SourceInput, progress: UploadProgress): Promise<DataRecord[]>;
}
