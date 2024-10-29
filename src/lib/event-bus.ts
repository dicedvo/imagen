import mitt from "mitt";

import { DataSource } from "@/core/data";
import { PluginEvents } from "@/core/plugin_system";

type Events = {
  openImporter: { id: string; settings: Record<string, unknown> };
  onImportFinished: { source: string; sources: DataSource[] };
} & PluginEvents;

const emitter = mitt<Events>();

export default emitter;
