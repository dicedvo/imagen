import { z } from "zod";
import { nanoid } from "nanoid";
import { snakeCase } from "change-case";

const FieldSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  key: z.string(),
  type: z.string(),
  required: z.boolean().default(false),
  primary_key: z.boolean(),
  options: z.record(z.unknown())
});

export type Field = z.infer<typeof FieldSchema>;

export default FieldSchema;

export class FieldSchemaValidationError extends Error {
  constructor(public errors: Partial<Record<keyof Field, string>>) {
    super("Field validation failed");
  }
}

export function checkPrimaryKey(field: Field | Field[], existingFields: Field[]): void {
  if (Array.isArray(field)) {
    field.forEach(f => checkPrimaryKey(f, existingFields));
    return;
  }

  if (field.primary_key && existingFields.some(f => f.primary_key)) {
    throw new FieldSchemaValidationError({ primary_key: "Only one primary key is allowed" });
  }
}

export function generateFieldKey(fieldName: string): string {
  return snakeCase(fieldName)
}

export function stringToField(names: string[]) {
  return names.map<Field>(f => ({
    id: nanoid(),
    key: f,
    name: f,
    options: {},
    primary_key: false,
    required: false,
    type: 'text'
  }));
}