import Header from "@/components/Header";
import DataList from "@/components/home-page/DataList";
import WorkArea from "@/components/home-page/WorkArea";
import { loadBasePlugins } from "@/core/base_plugins";
import usePluginStore from "@/stores/plugin_store";
import {
  DatabaseIcon,
  PlugIcon,
  SlidersHorizontalIcon,
  TagsIcon,
} from "lucide-react";
import { useEffect } from "react";
import Tabs from "./components/home-page/Tabs";
import FieldsList from "./components/home-page/FieldsList";
import TagsList from "./components/home-page/TagsList";
import PluginsList from "./components/home-page/PluginsList";

function App() {
  const pluginRegistry = usePluginStore();

  useEffect(() => {
    loadBasePlugins(pluginRegistry.load);
  }, []);

  return (
    <main className="font-sans">
      <Header />

      <section className="flex h-screen">
        <div className="w-1/2 border-r">
          <Tabs
            items={[
              {
                title: "Data",
                icon: DatabaseIcon,
                Component: DataList,
              },
              {
                title: "Fields",
                icon: SlidersHorizontalIcon,
                Component: FieldsList,
              },
              {
                title: "Tags",
                icon: TagsIcon,
                Component: TagsList,
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
  );
}

export default App;
