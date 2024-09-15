import { create } from "zustand";

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

const useTagsStore = create<TagState>((set) => ({
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

      return { tags: [...state.tags, ...newTags] };
    }),
  removeTags: (tags) =>
    set((state) => ({
      tags: state.tags.filter((tag) => !tags.includes(tag.name)),
    })),
  updateTag: (tagName, tag) =>
    set((state) => ({
      tags: state.tags.map((t) => (t.name === tagName ? tag : t)),
    })),
}));

export default useTagsStore;
