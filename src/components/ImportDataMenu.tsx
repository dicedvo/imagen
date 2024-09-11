import { DataSource } from "@/core/data";
import { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import emitter from "@/lib/event-bus";

export default function ImportDataMenu({
  sources,
  children,
}: {
  sources: DataSource[];
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sources.map((source) => (
          <DropdownMenuItem
            key={`importer_${source.id}`}
            onSelect={() => emitter.emit("openImporter", { id: source.id })}
          >
            <source.icon className="mr-2 h-4 w-4" />
            <span>{source.importFromLabel}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
