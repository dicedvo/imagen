import { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import emitter from "@/lib/event-bus";
import { useSourceProviderStore } from "@/stores/registry_store";
import { useShallow } from "zustand/react/shallow";

export default function ImportDataMenu({ children }: { children: ReactNode }) {
  const [sourceProviders, instances] = useSourceProviderStore(
    useShallow((state) => [state.registry.items, state.instances]),
  );

  const openImporter = (
    sourceId: string,
    settings: Record<string, unknown>,
  ) => {
    emitter.emit("openImporter", { id: sourceId, settings });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sourceProviders.map((source) =>
          source.reusable ? (
            instances
              .filter((inst) => inst.sourceId === source.id)
              .map((inst) => (
                <DropdownMenuItem
                  key={`importer_choice_${source.id}_${inst.id}`}
                  onSelect={() => openImporter(source.id, inst.settings)}
                >
                  <source.icon className="mr-2 h-4 w-4" />
                  <span>
                    {typeof source.importFromLabel === "function"
                      ? source.importFromLabel(inst.settings)
                      : source.importFromLabel}
                  </span>
                </DropdownMenuItem>
              ))
          ) : (
            <DropdownMenuItem
              key={`importer_choice_${source.id}`}
              onSelect={() => openImporter(source.id, {})}
            >
              <source.icon className="mr-2 h-4 w-4" />
              <span>
                {typeof source.importFromLabel === "function"
                  ? source.importFromLabel({})
                  : source.importFromLabel}
              </span>
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
