import { BinaryIcon } from "lucide-react";
import { createSchemaFieldType } from "@/core/schema";

export interface BooleanSchemaSettings {
  default: boolean;
}

const booleanSchemaType = createSchemaFieldType<BooleanSchemaSettings, boolean>(
  {
    type: "boolean",
    name: "Boolean",
    icon: BinaryIcon,
    settingsComponent: () => {
      return (
        <div>
          <h1>Boolean Settings</h1>
        </div>
      );
    },
    defaultSettings: {
      default: false,
    },
    validateSettings() {},
    render({ value, onChange }) {
      // Checkbox
      return (
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    },
    isValidValue(value) {
      switch (typeof value) {
        case "boolean":
          return true;
        case "string":
          return value === "true" || value === "false";
        case "number":
          return value === 0 || value === 1;
        default:
          return false;
      }
    },
  },
);

export default booleanSchemaType;
