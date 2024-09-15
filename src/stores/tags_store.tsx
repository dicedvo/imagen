import { create } from "zustand";
import useSearchStore from "./search_store";

export interface Tag {
  name: string;
  color: string;
}

export interface TagState {
  tags: Tag[];
  addTags: (...tags: Tag[]) => void;
  removeTags: (...tags: string[]) => void;
  updateTag: (tagName: string, tag: Tag) => void;
}

const TAGS_SEARCH_INDEX_KEY = Symbol();

export const useTagsSearchIndex = () =>
  useSearchStore.getSearchInstance<Tag>(TAGS_SEARCH_INDEX_KEY);

const useTagsStore = create<TagState>((set) => {
  const searchIndex = useSearchStore.createSearchInstance<Tag>(
    TAGS_SEARCH_INDEX_KEY,
    {
      fields: ["name"],
      idField: "name",
    },
  );

  return {
    tags: [],
    addTags: (...tags) =>
      set((state) => {
        // update tags with no __id and set it to the value of key
        const newTags = tags.map((tag) => {
          if (!tag.color) {
            return {
              ...tag,
              color: "#E5E7EB",
            };
          }
          return tag;
        });

        searchIndex.addAll(newTags);
        return { tags: [...state.tags, ...newTags] };
      }),
    removeTags: (...tagNames) =>
      set((state) => {
        const newTags = [...state.tags];

        for (const tagName of tagNames) {
          const tagIndex = newTags.findIndex((t) => t.name === tagName);
          console.log(tagName, tagIndex);
          if (tagIndex === -1) {
            continue;
          }

          const oldTag = newTags[tagIndex];
          searchIndex.remove(oldTag);
          newTags.splice(tagIndex, 1);
        }

        return { tags: newTags };
      }),
    updateTag: (tagName, tag) =>
      set((state) => {
        const tagIndex = state.tags.findIndex((t) => t.name === tagName);
        if (tagIndex === -1) {
          return state;
        }

        const newTags = [...state.tags];

        const oldTag = newTags[tagIndex];
        searchIndex.remove(oldTag);

        newTags[tagIndex] = tag;
        searchIndex.add(tag);

        return { tags: newTags };
      }),
  };
});

export default useTagsStore;
