import { produce } from "immer";
import { create } from "zustand";

import { createRegistry, IRegistry } from "@/core/registries";
import { DataProcessor, DataSource } from "@/core/data";
import ImageGenerator from "@/core/image_generator";
import URIHandler from "@/core/uri_handler";
import { _OutputExporter } from "@/core/output_exporter";

export const useDataProcessorStore = create<IRegistry<DataProcessor>>(
  (set, get) =>
    createRegistry(get, (setter) => set(produce((state) => setter(state)))),
);

export const useDataSourceStore = create<IRegistry<DataSource>>((set, get) =>
  createRegistry(get, (setter) => set(produce((state) => setter(state)))),
);

export const useImageGeneratorsStore = create<IRegistry<ImageGenerator>>(
  (set, get) =>
    createRegistry(get, (setter) => set(produce((state) => setter(state)))),
);

export const useUriHandlersStore = create<IRegistry<URIHandler>>((set, get) =>
  createRegistry(get, (setter) => set(produce((state) => setter(state)))),
);

export const useOutputExporterStore = create<IRegistry<_OutputExporter>>(
  (set, get) =>
    createRegistry(get, (setter) => set(produce((state) => setter(state)))),
);