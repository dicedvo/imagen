import Header from "@/components/Header";
import PluginsList from "@/components/home-page/PluginsList";
import RecordsView from "@/components/home-page/RecordsView";
import SchemaEditor from "@/components/home-page/SchemaEditor";
import SourcesList from "@/components/home-page/SourcesList";
import Tabs from "@/components/home-page/Tabs";
import TagsList from "@/components/home-page/TagsList";
import WorkArea from "@/components/home-page/WorkArea";
import { loadBasePlugins } from "@/core/base_plugins";
import usePluginStore from "@/stores/plugin_store";
import {
  DatabaseIcon,
  FilesIcon,
  PlugIcon,
  SlidersHorizontalIcon,
  TagsIcon,
} from "lucide-react";
import { useEffect } from "react";
import EBAlertDialog from "./components/EBAlertDialog";

function App() {
  const pluginRegistry = usePluginStore();

  useEffect(() => {
    loadBasePlugins(pluginRegistry.load);
  }, []);

  return (
    <>
      <main className="font-sans flex flex-col h-screen">
        <Header />

        <section className="flex flex-1 items-stretch overflow-hidden">
          <div className="w-1/2 border-r">
            <Tabs
              items={[
                {
                  title: "Records",
                  icon: FilesIcon,
                  Component: RecordsView,
                },
                {
                  title: "Tags",
                  icon: TagsIcon,
                  Component: TagsList,
                },
                {
                  title: "Sources",
                  icon: DatabaseIcon,
                  Component: SourcesList,
                },
                {
                  title: "Schema",
                  icon: SlidersHorizontalIcon,
                  Component: SchemaEditor,
                },
                {
                  title: "Plugins",
                  icon: PlugIcon,
                  Component: PluginsList,
                },
              ]}
            />
          </div>

          <div className="w-1/2">
            <WorkArea />
          </div>
        </section>
      </main>
      <EBAlertDialog />
    </>
  );
}

export default App;
