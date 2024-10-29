import { Plugin } from "@/core/plugin_system";
import textSchemaType from "./schema_types/text";
import numberSchemaType from "./schema_types/number";
import booleanSchemaType from "./schema_types/boolean";

const baseSchemaTypesPlugin: Plugin = {
  meta: {
    id: "base_schema_types",
    publisher: "imagen",
    version: "0.0.1",
    description: "Plugin for loading primitive schema types",
    name: "Base Schema Types",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerSchemaFieldType(textSchemaType);
    ctx.registerSchemaFieldType(numberSchemaType);
    ctx.registerSchemaFieldType(booleanSchemaType);
  },
};

export default baseSchemaTypesPlugin;
