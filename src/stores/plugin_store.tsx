import { create } from "zustand";
import { produce } from "immer";
import { createPluginRegistry, IPluginRegistry } from "@/core/registries";
import emitter from "@/lib/event-bus";
import {
  useDataProcessorStore,
  useDataSourceStore,
  useImageGeneratorsStore,
  useOutputExporterStore,
  useUriHandlersStore,
} from "./registry_store";
import ImageGenerator from "@/core/image_generator";
import { PluginEvents } from "@/core/plugin_system";
import { Handler } from "mitt";

const usePluginStore = create<IPluginRegistry>((set, get) =>
  createPluginRegistry(
    get,
    (setter) => set(produce(setter)),
    (pluginId) => ({
      registerDataProcessor(processor) {
        console.log(`[registerDataProcessor] Registering ${processor.id}`);
        useDataProcessorStore.getState().register(processor);

        const handler: Handler<PluginEvents["onPluginChangeState"]> = ({
          id,
          enabled,
        }) => {
          if (id === pluginId && !enabled) {
            useDataProcessorStore.getState().unregister(processor.id);
            emitter.off("onPluginChangeState", handler);
          }
        };

        emitter.on("onPluginChangeState", handler);
      },
      registerDataSource(source) {
        console.log(`[registerDataSource] Registering ${source.id}`);
        useDataSourceStore.getState().register(source);

        const handler: Handler<PluginEvents["onPluginChangeState"]> = ({
          id,
          enabled,
        }) => {
          if (id === pluginId && !enabled) {
            useDataSourceStore.getState().unregister(source.id);
            emitter.off("onPluginChangeState", handler);
          }
        };

        emitter.on("onPluginChangeState", handler);
      },
      registerImageGenerator(generator) {
        useImageGeneratorsStore
          .getState()
          .register(generator as unknown as ImageGenerator);

        const handler: Handler<PluginEvents["onPluginChangeState"]> = ({
          id,
          enabled,
        }) => {
          if (id === pluginId && !enabled) {
            useImageGeneratorsStore.getState().unregister(generator.id);
            emitter.off("onPluginChangeState", handler);
          }
        };

        emitter.on("onPluginChangeState", handler);
      },
      registerURIHandler(handler) {
        useUriHandlersStore.getState().register(handler);

        const handlerr: Handler<PluginEvents["onPluginChangeState"]> = ({
          id,
          enabled,
        }) => {
          if (id === pluginId && !enabled) {
            useUriHandlersStore.getState().unregister(handler.id);
            emitter.off("onPluginChangeState", handlerr);
          }
        };

        emitter.on("onPluginChangeState", handlerr);
      },
      registerOutputExporter(exporter) {
        console.log(`[registerOutputExporter] Registering ${exporter.id}`);
        useOutputExporterStore.getState().register(exporter);

        const handler: Handler<PluginEvents["onPluginChangeState"]> = ({
          id,
          enabled,
        }) => {
          if (id === pluginId && !enabled) {
            useOutputExporterStore.getState().unregister(exporter.id);
            emitter.off("onPluginChangeState", handler);
          }
        };

        emitter.on("onPluginChangeState", handler);
      },
    }),
    emitter.emit,
  ),
);

export default usePluginStore;
