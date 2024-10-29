import { TypeIcon } from "lucide-react";
import { createSchemaFieldType, SchemaValidationError } from "@/core/schema";
import { Input } from "@/components/ui/input";

export interface TextSchemaSettings {
  placeholder: string;
  minLength: number;
  maxLength: number;
  regexPattern: null | string;
}

const textSchemaType = createSchemaFieldType<TextSchemaSettings, string>({
  type: "text",
  name: "Text",
  icon: TypeIcon,
  _isFallback: true,
  settingsComponent: () => {
    return (
      <div>
        <h1>Text Settings</h1>
      </div>
    );
  },
  defaultSettings: {
    placeholder: "Enter text here",
    minLength: 0,
    maxLength: 999999,
    regexPattern: null,
  },
  validateSettings(value) {
    if (value.minLength < 0) {
      throw new SchemaValidationError(
        "minLength",
        "Minimum length must be greater than or equal to 0",
      );
    }
    if (value.maxLength < 0) {
      throw new SchemaValidationError(
        "maxLength",
        "Maximum length must be greater than or equal to 0",
      );
    }
    if (value.minLength > value.maxLength) {
      throw new SchemaValidationError(
        "minLength",
        "Minimum length must be less than or equal to maximum length",
      );
    }
    if (value.regexPattern) {
      try {
        new RegExp(value.regexPattern);
      } catch (e) {
        throw new SchemaValidationError(
          "regexPattern",
          "Invalid regex pattern",
        );
      }
    }
  },
  render({ value, onChange, settings }) {
    return (
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={settings.placeholder}
        minLength={settings.minLength}
        maxLength={settings.maxLength}
      />
    );
  },
  isValidValue(value) {
    return typeof value === "string";
  },
});

export default textSchemaType;
