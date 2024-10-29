import { snakeCase } from "change-case";
import { nanoid } from "nanoid";
import { ReactNode } from "react";

export interface UploadProgress {
  update(progress: number, message: string): void;
}

export type SourceInput = File | string;

// DataSourceRecord is a record of data extracted from a data source.
// As much as possible, they are not supposed to be modified directly.
// Instead, DataRecord should be used to modify the data record.
export interface DataSourceRecord {
  id: string;
  sourceId: string; // The data source where this record came from
  data: Record<string, unknown>;
}

// DataSource is a group of records from a specific file
// imported from a data source provider.
export interface DataSource<
  SchemaType extends object = Record<string, unknown>,
> {
  id: string;
  name: string;
  sourceProviderId: string; // The source provider that imported this data
  schema: SchemaType;
  systemSchemaValues: Record<string, unknown>; // Source-specific values for the specific schema ("id" => '{{username}}')
  records: DataSourceRecord[];
}

// DataRecord is a virtual record that indirectly represents a DataSourceRecord.
// You can use this to modify the data record.
export interface DataRecord {
  id: string;
  sourceRecordId: string; // The data source record this data record is based on
  tags: string[];
  data: { original: Record<string, unknown> } & Record<string, unknown>; // Cached data from the data source record binded to system schema values
  templateValues: Record<string, Record<string, unknown>>; // Unevaluated/raw template values for the data record
}

export function toDataRecord(
  record: DataSourceRecord,
  onGenerateId = defaultIdGenerator,
): DataRecord {
  return {
    id: onGenerateId(),
    sourceRecordId: record.id,
    tags: [],
    data: {
      get original() {
        return record.data;
      },
    },
    templateValues: {},
  };
}

export interface SourceDialogProps {
  supportedFileTypes: string[];
  open: boolean;
  settings: Record<string, unknown>;
  process(files: SourceProcessedFile[]): Promise<void>;
  close(): void;
}

export interface InstanceSettingsProps {
  instance: SourceProviderInstance;
}

export type SourceProviderOptions<T extends object = Record<string, unknown>> =
  {
    progress: UploadProgress;
  } & T;

export interface SourceProcessedFile {
  contentType: string;
  filename: string;
  data: File | string;
}

// SourceProvider is used to import data from a source. It can be a file, a URL, etc.
// See DataProcessor for processing data from a SourceProvider.
export interface SourceProvider {
  // Unique identifier for the data source
  id: string;

  // Human-readable name of the data source
  name: string;

  // If reusable is true, the data source can have multiple instances
  reusable?: boolean;

  // Human-readable name of the data source
  importFromLabel: string | ((settings: Record<string, unknown>) => string);

  // Icon for the data source
  icon(props: { className?: string }): ReactNode;

  // Dialog element for the data source
  dialogElement?(props: SourceDialogProps): ReactNode;

  // Dialog element for the instance settings of the data source
  instanceSettingsDialogElement?(props: InstanceSettingsProps): ReactNode;

  // Preprocess the input data before processing it with a DataProcessor.
  // This is useful for converting the input data to a format that can be
  // processed by a DataProcessor.
  preprocess(
    input: SourceInput,
    options?: SourceProviderOptions,
  ): Promise<SourceProcessedFile>;
}

// DataSourceInstance is used to store settings for a specific
// instance of a data source. This is useful if a SourceProvider
// can have multiple instances with different settings. (e.g. API keys, etc.)
export interface SourceProviderInstance {
  id: string;
  sourceId: string; // SourceProvider.id
  settings: Record<string, unknown>; // SourceProvider-specific settings
}

// DataProcessor is used to process data from a data source.
export interface DataProcessor {
  id: string;
  supportedFileTypes: string[];
  process(data: SourceProcessedFile): Promise<Record<string, unknown>[]>;
}

export function defaultIdGenerator(): string {
  return nanoid();
}

export function transformRecordKey(key: string) {
  if (!/\s/.test(key)) {
    // Skip keys with no whitespace
    return key;
  }
  return snakeCase(key);
}

function transformRecord(record: DataSourceRecord) {
  const transformedRecord: DataSourceRecord = {
    ...record,
    data: {},
  };
  for (const [key, value] of Object.entries(record.data)) {
    transformedRecord.data[transformRecordKey(key)] = value;
  }
  return transformedRecord;
}

export function processFiles<
  SchemaType extends object = Record<string, unknown>,
>(
  files: SourceProcessedFile[],
  {
    processors,
    fromSourceId,
    onGenerateId = defaultIdGenerator,
    onGenerateSchema,
  }: {
    fromSourceId: string;
    processors: DataProcessor[];
    progress: (fileName: string) => UploadProgress;
    onGenerateId?: () => string;
    onGenerateSchema?: (records: DataSourceRecord[]) => SchemaType;
  },
): Promise<DataSource<SchemaType>[]> {
  return Promise.all(
    files.map(async (file) => {
      if (!file.contentType) {
        throw new Error("No content type found for file");
      }
      const importer = processors.find((importer) =>
        importer.supportedFileTypes.includes(file.contentType),
      );
      if (!importer) {
        throw new Error("No importer found for file");
      }
      return importer.process(file);
    }),
  )
    .then((dataGroups) =>
      // Convert data processor output to DataSourceRecord
      dataGroups.map((datum) =>
        datum.map<DataSourceRecord>((data) => ({
          id: onGenerateId(),
          sourceId: fromSourceId,
          data,
        })),
      ),
    )
    .then((recordGroups) =>
      recordGroups.map((records, index) => ({
        id: defaultIdGenerator(),
        name: files[index].filename,
        sourceProviderId: fromSourceId,
        schema: onGenerateSchema
          ? onGenerateSchema(records)
          : ({} as SchemaType),
        systemSchemaValues: {},
        records: records.map(transformRecord),
      })),
    );
}
