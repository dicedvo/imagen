import { Template } from "@/core/template/types";
import { create } from "zustand";

export interface TemplateStore {
  template: Template | null;
  setTemplate: (template: Template) => void;
}

const useTemplateStore = create<TemplateStore>((set) => ({
  template: null,
  setTemplate(template) {
    set({ template });
  },
}));

export default useTemplateStore;
