import { useShallow } from "zustand/react/shallow";
import useTagsStore from "@/stores/tags_store";
import TagDisplay from "./TagDisplay";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ExportScope } from "@/schemas/OutputExportSettingsSchema";

export default function ExportScopeDropdown({
  className,
  defaultValue,
  onChange,
}: {
  className?: string;
  defaultValue: ExportScope;
  onChange: (v: ExportScope) => void;
}) {
  const tags = useTagsStore(useShallow((state) => state.tags));

  return (
    <Select defaultValue={defaultValue} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select records to export..." />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectItem value="current">Current record</SelectItem>
          <SelectItem value="selected">Selected records</SelectItem>
          <SelectItem value="all">All records</SelectItem>
        </SelectGroup>

        {tags.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Records tagged with</SelectLabel>
            {tags.map((tag) => (
              <SelectItem
                key={`tag_${tag.name}`}
                value={`tagged:${encodeURIComponent(tag.name)}`}
              >
                <TagDisplay tag={tag} />
              </SelectItem>
            ))}
          </SelectGroup>
        ) : (
          <SelectGroup>
            <SelectLabel>Records tagged with</SelectLabel>
            <SelectItem value="disabled" disabled>
              No tags to show
            </SelectItem>
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
