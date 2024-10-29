import { FC } from "react";

export interface SchemaFieldType<Settings = unknown, Value = unknown> {
  type: string;
  name: string;
  _isFallback?: boolean; // used internally to indicate that this is a fallback type
  icon: FC<{ className?: string }>;
  settingsComponent: FC<{
    value: Settings;
    onChange: (value: Settings) => void;
  }>;
  defaultSettings: Settings;
  validateSettings: (value: Settings) => void; // throws error if invalid
  render: FC<{
    value: Value;
    onChange: (value: Value) => void;
    settings: Settings;
  }>;
  isValidValue: (value: unknown) => boolean; // for type inference during schema generation
}

// This is a type-safe helper function to create a schema field type.
export function createSchemaFieldType<Settings = unknown, Value = unknown>(
  cfg: SchemaFieldType<Settings, Value>,
): SchemaFieldType<Settings, Value> {
  return cfg;
}

export class SchemaValidationError extends Error {
  public field: string;

  constructor(field: string, message: string) {
    super(message);

    this.field = field;
    this.name = "SchemaValidationError";
  }

  toJSON() {
    return {
      field: this.field,
      message: this.message,
    };
  }
}
