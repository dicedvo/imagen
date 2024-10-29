import { createSchemaFieldType, SchemaValidationError } from "@/core/schema";
import { Input } from "@/components/ui/input";

export interface NumberSchemaSettings {
  placeholder: string;
  min: number | null;
  max: number | null;
  step: number;
}

const numberSchemaType = createSchemaFieldType<NumberSchemaSettings, number>({
  type: "number",
  name: "Number",
  icon: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m3 10l2-2v8m4-8h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h3m4-8h2.5A1.5 1.5 0 0 1 21 9.5v1a1.5 1.5 0 0 1-1.5 1.5H18h1.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H17"
      ></path>
    </svg>
  ),
  settingsComponent: () => {
    return (
      <div>
        <h1>Number Settings</h1>
      </div>
    );
  },
  defaultSettings: {
    placeholder: "Enter a value",
    min: null,
    max: null,
    step: 1,
  },
  validateSettings(value) {
    if (typeof value.min !== "number" && value.min !== null) {
      throw new SchemaValidationError("min", "Min must be a number or null");
    }
    if (typeof value.max !== "number" && value.max !== null) {
      throw new SchemaValidationError("max", "Max must be a number or null");
    }
    if (typeof value.step !== "number") {
      throw new SchemaValidationError("step", "Step must be a number");
    }
  },
  render({ value, onChange }) {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
    );
  },
  isValidValue(value) {
    switch (typeof value) {
      case "number":
        return true;
      case "string":
        return !isNaN(parseFloat(value));
      default:
        return false;
    }
  },
});

export default numberSchemaType;
