import { Plugin, PluginInterface, PluginEvents } from "@/core/plugin_system";

export type IRegistryItem = { id: string } | { meta: { id: string } };

export interface IRegistry<T extends IRegistryItem, PredicateT = T> {
  items: T[];
  register(item: T): void;
  unregister(id: string): void;
  get(id: string): T | null;
  findAll(predicate: (item: PredicateT) => boolean): (PredicateT | T)[];
  find(predicate: (item: PredicateT) => boolean): T | PredicateT | null;
}

export type Tagged<T> = T & { id: string };

export interface IPluginRegistry
  extends Omit<IRegistry<Plugin, InstalledPlugin>, "items"> {
  plugins: InstalledPlugin[];
  enable(id: string): void;
  disable(id: string): void;
  load(plugins: Plugin[], __allowNonNamespaced?: boolean): void;
}

export interface InstalledPlugin {
  id: string;
  plugin: Plugin;
  enabled: boolean;
}

export function createPluginRegistry(
  get: () => IPluginRegistry,
  set: (cb: (state: IPluginRegistry) => void) => void,
  pInterface: (pluginId: string) => PluginInterface,
  emitter: <Key extends keyof PluginEvents>(
    type: Key,
    event: PluginEvents[Key],
  ) => void,
): IPluginRegistry {
  const _checkPluginId = (id: string) => {
    const namedSplitted = id.split(".");
    if (namedSplitted.length !== 2) {
      throw new Error(`Invalid plugin ID: ${id}`);
    }
  };

  return {
    plugins: [],
    register(plugin) {
      set((state) => {
        const namespace = plugin.meta.publisher;
        const id = plugin.meta.id;
        const fullPluginId = `${namespace}.${id}`;

        const installedPlugin = {
          plugin,
          id: fullPluginId,
          enabled: false,
        };

        state.plugins.push(installedPlugin);
        installedPlugin.plugin.activate(pInterface(fullPluginId));
      });
    },
    unregister(id) {
      return get().disable(id);
    },
    get(id) {
      return get().plugins.find((p) => p.id === id)?.plugin || null;
    },
    find(predicate) {
      return get().plugins.find(predicate)?.plugin || null;
    },
    findAll(predicate) {
      return get().plugins.filter(predicate);
    },
    enable(id) {
      set((state) => {
        const installedPlugin = state.plugins.find((p) => p.id === id);
        if (!installedPlugin) {
          throw new Error(`Plugin with id ${id} not found`);
        } else if (installedPlugin.enabled) {
          return;
        }

        installedPlugin.plugin.activate(pInterface(id));
        installedPlugin.enabled = true;
        emitter("onPluginChangeState", { id, enabled: true });
      });
    },
    disable(id) {
      _checkPluginId(id);

      set((state) => {
        const installedPlugin = state.plugins.find((p) => p.id === id);
        if (!installedPlugin) {
          throw new Error(`Plugin with id ${id} not found`);
        } else if (!installedPlugin.enabled) {
          return;
        }

        if (installedPlugin.plugin.deactivate) {
          installedPlugin.plugin.deactivate(pInterface(id));
        }

        installedPlugin.enabled = false;
        emitter("onPluginChangeState", { id, enabled: false });
      });
    },
    load(plugins, __allowNonNamespaced = false) {
      for (const plugin of plugins) {
        console.log(
          `[plugin_store] Registering ${plugin.meta.id} (${plugin.meta.version})`,
        );

        const nameSplitted = plugin.meta.id.split(".");
        const namespace = nameSplitted.length > 1 ? nameSplitted[0] : null;

        if (!__allowNonNamespaced && !namespace) {
          console.error(
            `[plugin_store] Plugin ${plugin.meta.id} is not namespaced`,
          );
          continue;
        }

        get().register(plugin);
      }
    },
  };
}

export function createRegistry<T extends IRegistryItem>(
  get: (state: IRegistry<T>) => IRegistry<T>,
  set: (cb: (state: IRegistry<T>) => void) => void,
): IRegistry<T> {
  const registry: IRegistry<T> = {
    items: [],
    register(item) {
      set((state) => {
        if (state.get("meta" in item ? item.meta.id : item.id)) {
          return;
        }
        state.items.push(item);
      });
    },
    unregister(id) {
      set((state) => {
        const item = state.get(id);
        if (!item) {
          return;
        }
        const index = state.items.indexOf(item);
        state.items.splice(index, 1);
      });
    },
    get(id) {
      return (
        get(registry).items.find((item) => {
          if ("meta" in item) {
            return item.meta.id === id;
          }
          return item.id === id;
        }) || null
      );
    },
    find(predicate) {
      return get(registry).items.find(predicate) || null;
    },
    findAll(predicate) {
      return get(registry).items.filter(predicate);
    },
  };
  return registry;
}
