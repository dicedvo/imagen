import { z } from "zod";
import { nanoid } from "nanoid";
import { DataSourceRecord, transformRecordKey } from "@/core/data";
import { SchemaFieldType } from "@/core/schema";

const FieldSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  key: z.string(),
  type: z.string(),
  required: z.boolean().default(false),
  primary_key: z.boolean(),
  options: z.record(z.unknown()),
  value: z.unknown(),
});

export const SchemaSchema = z.object({
  fields: z.array(FieldSchema),
});

export type Field = z.infer<typeof FieldSchema>;

export type Schema = z.infer<typeof SchemaSchema>;

export class FieldSchemaValidationError extends Error {
  constructor(public errors: Partial<Record<keyof Field, string>>) {
    super("Field validation failed");
  }
}

export function checkPrimaryKey(
  field: Field | Field[],
  existingFields: Field[],
): void {
  if (Array.isArray(field)) {
    field.forEach((f) => checkPrimaryKey(f, existingFields));
    return;
  }

  if (field.primary_key && existingFields.some((f) => f.primary_key)) {
    throw new FieldSchemaValidationError({
      primary_key: "Only one primary key is allowed",
    });
  }
}

export function stringToField(names: string[]) {
  return names.map<Field>((f) => ({
    id: nanoid(),
    key: f,
    name: f,
    options: {},
    primary_key: false,
    required: false,
    type: "text",
    value: `{{${f}}}`,
  }));
}

export function inferSchemaType(
  value: unknown,
  schemaFieldTypes: SchemaFieldType[],
): SchemaFieldType {
  let lastDetectedType: SchemaFieldType | null = null;
  for (const schemaFieldType of schemaFieldTypes) {
    if (schemaFieldType.isValidValue(value)) {
      lastDetectedType = schemaFieldType;
    } else if (lastDetectedType) {
      break;
    }
  }

  if (lastDetectedType) {
    return lastDetectedType;
  }

  const fallbackSchemaFieldTypes = schemaFieldTypes.filter(
    (s) => s._isFallback,
  );
  if (fallbackSchemaFieldTypes.length === 0) {
    throw new Error(`No fallback schema field type found for value: ${value}`);
  }
  return fallbackSchemaFieldTypes[0];
}

export function inferSchema(
  records: DataSourceRecord[],
  schemaFieldTypes: SchemaFieldType[],
): Schema {
  const fields: Record<string, Field> = {};

  for (const record of records) {
    for (const key in record.data) {
      const inferredType = inferSchemaType(record.data[key], schemaFieldTypes);
      if (!fields[key]) {
        fields[key] = {
          id: nanoid(),
          key: transformRecordKey(key),
          name: key,
          options: inferredType.defaultSettings as Record<string, unknown>,
          primary_key: false,
          required: false,
          type: inferredType.type,
          value: `{{${transformRecordKey(key)}}}`,
        };
      } else if (fields[key].type !== inferredType.type) {
        throw new Error(
          `Inferred type mismatch for field "${key}": ${fields[key].type} != ${inferredType}`,
        );
      }
    }
  }

  return {
    fields: Object.values(fields),
  };
}

export default FieldSchema;
