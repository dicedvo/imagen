import usePluginStore from "@/stores/plugin_store";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { useShallow } from "zustand/react/shallow";

export default function InstalledPluginsDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const installedPlugins = usePluginStore(useShallow((state) => state.plugins));

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogTitle>Installed Plugins</DialogTitle>
        <div className="-mx-6 -mb-6">
          <ScrollArea className="h-96 px-6">
            <div className="flex flex-col space-y-2 pb-6">
              {installedPlugins.map(({ id, plugin }) => (
                <Card key={`plugin_${id}`} className="p-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between -mt-1">
                      <div className="space-x-1 flex items-center">
                        <h2 className="text-lg font-semibold">
                          {plugin.meta.name}
                        </h2>
                        <span className="text-sm font-normal text-gray-400">
                          ({id})
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {plugin.meta.version}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>{plugin.meta.description}</p>
                      <p className="text-xs mt-2">
                        by {plugin.meta.author.name}
                        {plugin.meta.author.email &&
                          ` <${plugin.meta.author.email}>`}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
