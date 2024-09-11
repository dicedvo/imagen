import { Plugin } from "@/core/plugin_system";

const URLHandler = {
  id: "base64",

  test(uri: string): boolean {
    return uri.startsWith("data:");
  },

  transform(uri: string): string {
    return uri;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stringify(_: unknown): string {
    throw new Error("Not implemented");
  },
};

const httpHandlerPlugin: Plugin = {
  meta: {
    id: "base64-uri",
    publisher: "imagen",
    version: "0.0.1",
    description: "Plugin for handling files in base64 format",
    name: "Base64",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerURIHandler(URLHandler);
  },
};

export default httpHandlerPlugin;
