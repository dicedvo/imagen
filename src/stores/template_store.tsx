import { DataRecord } from "@/core/data";
import { Template, TemplateInstanceValues } from "@/core/template/types";
import { valuesFromTemplate } from "@/core/template/values";
import { produce } from "immer";
import { create } from "zustand";
import { useImageGeneratorsStore } from "./registry_store";

export interface TemplateStore {
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
    recordId: DataRecord | string,
    templateOrTemplateName?: Template | string | null,
  ) => TemplateInstanceValues | null;
}

const useTemplateStore = create<TemplateStore>((set, get) => ({
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
  getTemplateInstanceValues(recordOrRecordId, templateOrTemplateName) {
    const template = get().template;
    if (!template && !templateOrTemplateName) return null;

    if (
      (!recordOrRecordId ||
        (typeof recordOrRecordId !== "string" && !recordOrRecordId.__id)) &&
      template
    ) {
      return valuesFromTemplate(template, useImageGeneratorsStore.getState());
    }

    const finalTemplateName = template
      ? template.name
      : typeof templateOrTemplateName === "string"
        ? templateOrTemplateName
        : templateOrTemplateName!.name;

    const finalRecordId =
      typeof recordOrRecordId === "string"
        ? recordOrRecordId
        : recordOrRecordId.__id;

    const foundTemplateInstanceValue =
      get().templateInstanceValues[finalRecordId]?.[finalTemplateName];

    if (!foundTemplateInstanceValue && template) {
      if (
        templateOrTemplateName &&
        typeof templateOrTemplateName !== "string"
      ) {
        return valuesFromTemplate(
          templateOrTemplateName,
          useImageGeneratorsStore.getState(),
        );
      } else if (finalTemplateName === template.name) {
        return valuesFromTemplate(template, useImageGeneratorsStore.getState());
      }
    }
    return foundTemplateInstanceValue || null;
  },
}));

export default useTemplateStore;
