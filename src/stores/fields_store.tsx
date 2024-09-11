import { checkPrimaryKey, Field } from "@/schemas/FieldSchema";
import { nanoid } from "nanoid";
import { create } from "zustand";

export interface FieldsState {
  fields: Field[];
  addFields: (...fields: Field[]) => void;
  updateField: (field: Field) => void;
  removeField: (fieldKey: string) => void;
}

const useFieldsStore = create<FieldsState>((set) => ({
  fields: [] as Field[],
  addFields: (...fields: Field[]) => {
    set(state => {
      checkPrimaryKey(fields, state.fields);
      const newFields = fields.filter(field => !state.fields.some(f => f.key === field.key));
      return { fields: [...state.fields, ...newFields] };
    });
  },
  updateField: (field: Field) => {
    set(state => {
      if (!field.id) {
        field.id = nanoid();
        return { fields: [...state.fields, field] };
      }

      const index = state.fields.findIndex(f => f.id === field.id);
      if (index === -1) {
        throw new Error(`Field with key ${field.key} not found`);
      }

      const newFields = [...state.fields];
      newFields[index] = field;
      return { fields: newFields };
    });
  },
  removeField: (fieldKey: string) => {
    set(state => {
      const index = state.fields.findIndex(f => f.key === fieldKey);
      if (index === -1) {
        throw new Error(`Field with key ${fieldKey} not found`);
      }

      const newFields = [...state.fields];
      newFields.splice(index, 1);
      return { fields: newFields };
    });
  },
}));

export default useFieldsStore;