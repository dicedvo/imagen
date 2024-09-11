import { Template, TemplateInstanceValues } from "@/core/template/types";
import { produce } from "immer";
import { create } from "zustand";

export interface TemplateState {
  template: Template | null;
  templateInstanceValues: Record<
    string,
    Record<string, TemplateInstanceValues>
  >;
  setTemplate: (template: Template) => void;
  updateTemplateInstanceValue: (
    recordId: string,
    templateName: string,
    values: TemplateInstanceValues,
  ) => void;
  getTemplateInstanceValues: (
    templateName: string,
    recordId: string,
  ) => TemplateInstanceValues | null;
}

const useTemplateStore = create<TemplateState>((set, get) => ({
  template: null,
  templateInstanceValues: {},
  setTemplate(template) {
    set({ template });
  },
  updateTemplateInstanceValue(recordId, templateName, values) {
    set(
      produce((draft) => {
        if (!draft.templateInstanceValues[recordId]) {
          draft.templateInstanceValues[recordId] = {};
        }

        draft.templateInstanceValues[recordId][templateName] = values;
      }),
    );
  },
  getTemplateInstanceValues(templateName, recordId) {
    if (recordId.length === 0 || templateName.length === 0) return null;
    return get().templateInstanceValues[recordId]?.[templateName] || null;
  },
}));

export default useTemplateStore;
