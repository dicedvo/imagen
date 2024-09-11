import { Plugin } from "@/core/plugin_system";
import DynamicImageGeneratorSettings from "./DynamicImageGeneratorSettings";

const dynamicImagePlugin: Plugin = {
  meta: {
    id: "dynamic_image",
    publisher: "imagen",
    version: "0.0.1",
    description: "Plugin for loading images from data records or from URLs.",
    name: "Dynamic Image",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerImageGenerator({
      id: "dynamic_image",
      generate: async ({ options: opts }) => {
        const src = opts["src"] as string;
        if (!src) {
          const fallback = opts["fallback"] as string;
          if (fallback) {
            return fallback;
          }
          return "";
        }
        return src;
      },
      defaultOptions: () => {
        return {
          src: "",
          fallback: "",
        };
      },
      Component: DynamicImageGeneratorSettings,
    });
  },
};

export default dynamicImagePlugin;
