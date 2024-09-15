import { Tag } from "@/stores/tags_store";

export default function TagDisplay({ tag }: { tag: Tag }) {
  return (
    <div className="flex items-center space-x-2">
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      <span>{tag.name}</span>
    </div>
  );
}
