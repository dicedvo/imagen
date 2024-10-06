import { PlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import usePluginStore from "@/stores/plugin_store";
import { useShallow } from "zustand/react/shallow";
import { Card } from "../ui/card";
import TabViewContainer from "./TabViewContainer";

export default function PluginsList() {
  const installedPlugins = usePluginStore(useShallow((state) => state.plugins));

  return (
    <TabViewContainer
      title="Plugins"
      actions={() => (
        <div>
          <Button size="sm" variant="ghost">
            <PlusIcon className="mr-2" size={16} />
            <span>Add</span>
          </Button>
        </div>
      )}
    >
      <div className="flex flex-col space-y-2 py-3 px-3 h-full">
        {installedPlugins.map(({ id, plugin }) => (
          <Card key={`plugin_${id}`} className="p-4">
            <div className="flex flex-col">
              <div className="flex justify-between">
                <div className="space-x-1 flex items-center">
                  <h2 className="text-lg font-semibold">{plugin.meta.name}</h2>
                  <span className="text-sm font-normal text-gray-400">
                    ({id})
                  </span>
                </div>
                <p className="text-sm text-gray-500">{plugin.meta.version}</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>{plugin.meta.description}</p>
                <p className="text-xs mt-2">
                  by {plugin.meta.author.name}
                  {plugin.meta.author.email && ` <${plugin.meta.author.email}>`}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </TabViewContainer>
  );
}
