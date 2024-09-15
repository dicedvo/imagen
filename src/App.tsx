import DataList from "@/components/home-page/DataList";
import WorkArea from "@/components/home-page/WorkArea";
import { loadBasePlugins } from "@/lib/base-plugin-loader";
import usePluginStore from "@/stores/plugin_store";
import { useEffect } from "react";

function App() {
  const pluginRegistry = usePluginStore();

  useEffect(() => {
    loadBasePlugins(pluginRegistry.load);
  }, []);

  return (
    <main className="font-sans">
      <header className="px-4 border-b bg-white">
        <div className="py-3">
          <p>DICE ImaGen Tool</p>
        </div>
      </header>

      <section className="flex h-screen">
        <div className="w-1/2 border-r flex flex-col">
          <DataList />
        </div>

        <div className="w-1/2">
          <WorkArea />
        </div>
      </section>
    </main>
  );
}

export default App;
