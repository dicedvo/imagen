import mitt from "mitt";

import { DataRecord } from "@/core/data";
import { PluginEvents } from "@/core/plugin_system";

type Events = {
  openImporter: { id: string };
  onImportFinished: { source: string; data: DataRecord[] };
} & PluginEvents;

const emitter = mitt<Events>();

export default emitter;
