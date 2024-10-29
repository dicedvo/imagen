import { createRegistry, IRegistry } from "@/core/registries";
import { SchemaFieldType } from "@/core/schema";
import { checkPrimaryKey, Field, Schema } from "@/lib/schema";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { create } from "zustand";

export const useSchemaFieldTypeStore = create<
  IRegistry<{ id: string } & SchemaFieldType>
>((set, get) =>
  createRegistry(get, (setter) => set(produce((state) => setter(state)))),
);

interface SchemaState {
  currentSchema: Schema;
  setSchema: (schema: Schema) => void;
  addFields: (...fields: Field[]) => void;
  updateField: (field: Field) => void;
  removeField: (fieldKey: string) => void;
}

const useSchemaStore = create<SchemaState>((set) => ({
  currentSchema: {
    fields: [],
  },
  setSchema: (schema) => {
    set((state) => {
      checkPrimaryKey(schema.fields, state.currentSchema.fields);
      return { currentSchema: schema };
    });
  },
  addFields: (...fields: Field[]) => {
    set((state) => {
      checkPrimaryKey(fields, state.currentSchema.fields);
      const newFields = fields.filter(
        (field) => !state.currentSchema.fields.some((f) => f.key === field.key),
      );
      return {
        currentSchema: {
          ...state.currentSchema,
          fields: [...state.currentSchema.fields, ...newFields],
        },
      };
    });
  },
  updateField: (field: Field) => {
    set((state) => {
      if (!field.id) {
        field.id = nanoid();
        return { fields: [...state.currentSchema.fields, field] };
      }

      const index = state.currentSchema.fields.findIndex(
        (f) => f.id === field.id,
      );
      if (index === -1) {
        throw new Error(`Field with key ${field.key} not found`);
      }

      // Update the value of the field if it's the same as the key
      // Example:
      // old key: "name"
      // old value: "{{name}}"
      // new key: "naMe""
      // expected value: "{{naMe}}"
      if (
        field.value === state.currentSchema.fields[index].value &&
        field.value === `{{${state.currentSchema.fields[index].key}}}`
      ) {
        field.value = `{{${field.key}}}`;
      }

      const newFields = [...state.currentSchema.fields];
      newFields[index] = field;

      return {
        currentSchema: {
          ...state.currentSchema,
          fields: newFields,
        },
      };
    });
  },
  removeField: (fieldKey: string) => {
    set((state) => {
      const index = state.currentSchema.fields.findIndex(
        (f) => f.key === fieldKey,
      );
      if (index === -1) {
        throw new Error(`Field with key ${fieldKey} not found`);
      }

      const newFields = [...state.currentSchema.fields];
      newFields.splice(index, 1);

      return {
        currentSchema: {
          ...state.currentSchema,
          fields: newFields,
        },
      };
    });
  },
}));

export default useSchemaStore;
