import mitt from "mitt";

import { DataSource } from "@/core/data";
import { PluginEvents } from "@/core/plugin_system";
import { ReactNode } from "react";

export type Events = {
  openImporter: { id: string; settings: Record<string, unknown> };
  onImportFinished: { source: string; sources: DataSource[] };
  onTriggerAlertDialog: {
    title?: string;
    description: string | ReactNode;
    actions: {
      cancel?: {
        label?: string;
        onClick: () => void;
      };
      confirm: {
        label?: string;
        onClick: () => void;
      };
    };
  };
} & PluginEvents;

const emitter = mitt<Events>();

export default emitter;
