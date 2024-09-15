import MiniSearch, { Options } from "minisearch";

interface CreateSearchInstanceOptions<T = unknown> {
  onReinitialize?: () => T[];
}

interface SearchInstance {
  __instance: MiniSearch;
  readonly instance: MiniSearch;
  instanceOptions: Options;
  options: CreateSearchInstanceOptions;
}

function createSearchStore() {
  const store: Map<symbol, SearchInstance> = new Map();

  return {
    getStore: () => store,
    getSearchInstance: <T = unknown,>(key: symbol) =>
      store.get(key)?.instance as MiniSearch<T>,
    createSearchInstance: <T = unknown,>(
      key: symbol,
      options: Options<T>,
      searchInstanceOptions?: CreateSearchInstanceOptions<T>,
    ) => {
      if (store.has(key)) {
        return store.get(key)!.instance as MiniSearch<T>;
      }

      const instance = new MiniSearch(options);
      store.set(key, {
        __instance: instance,
        get instance() {
          return this.__instance;
        },
        instanceOptions: options,
        options: searchInstanceOptions ?? {},
      });

      return instance;
    },
    removeSearchInstance: (key: symbol) => store.delete(key),
    reinitializeSearchInstance: <T = unknown,>(
      key: symbol,
      options: Partial<Options<T>>,
    ) => {
      const searchInstance = store.get(key);
      if (!searchInstance) {
        return;
      }

      const {
        __instance: oldInstance,
        instanceOptions,
        options: createOptions,
      } = searchInstance;

      oldInstance.removeAll();

      const newOptions = { ...instanceOptions, ...options };
      const newInstance = new MiniSearch<T>(newOptions);
      newInstance.addAll(
        (createOptions as CreateSearchInstanceOptions<T>).onReinitialize?.() ??
          [],
      );

      store.set(key, {
        __instance: newInstance,
        get instance() {
          return this.__instance;
        },
        instanceOptions: newOptions,
        options: createOptions,
      });
    },
  };
}

const useSearchStore = createSearchStore();

export default useSearchStore;
