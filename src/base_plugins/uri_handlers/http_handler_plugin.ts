import { Plugin } from "@/core/plugin_system";

const URLHandler = {
  id: "http",

  test(uri: string): boolean {
    return uri.startsWith("http://") || uri.startsWith("https://");
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
    id: "http",
    publisher: "imagen",
    version: "0.0.1",
    description: "Plugin for handling files in HTTP/HTTPs",
    name: "HTTP",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerURIHandler(URLHandler);
  },
};

export default httpHandlerPlugin;
