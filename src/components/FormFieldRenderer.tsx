import { Field } from "@/lib/schema";
import { ControllerRenderProps, FieldValues } from "react-hook-form";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

export default function FormFieldRenderer<T extends FieldValues = FieldValues>({
  field,
  ...props
}: {
  field: Field;
} & Omit<ControllerRenderProps<T>, "ref">) {
  const name = field.name;
  const placeholder = (field.options.placeholder as string | undefined) ?? "";

  // if (field.type === "select") {
  //   const labels = (field.options.labels as Record<string, string>) ?? {};
  //   const values = field.options.values as string[];

  //   if (Array.isArray(props.value)) {
  //     return <ComboBox labels={labels} values={values} {...props} />;
  //   }

  //   return (
  //     <Select
  //       name={name}
  //       onValueChange={props.onChange}
  //       defaultValue={props.value}
  //       disabled={props.disabled}
  //     >
  //       <SelectTrigger className="[&>*:first-child]:capitalize">
  //         <SelectValue
  //           placeholder={
  //             labels[values[0]] ?? values[0] ?? "Select..."
  //           }
  //         />
  //       </SelectTrigger>
  //       <SelectContent>
  //         {values.map((v) => (
  //           <SelectItem
  //             key={`registration_${name}_select_${v}`}
  //             value={v}
  //             className="capitalize"
  //           >
  //             {labels[v] ?? v}
  //           </SelectItem>
  //         ))}
  //       </SelectContent>
  //     </Select>
  //   );
  // }

  if (field.type === "bool") {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          defaultChecked={props.value}
          checked={props.value}
          onCheckedChange={props.onChange}
          id={name}
        />
        <label
          htmlFor={name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {(field.options.checkbox_label as string) ?? name}
        </label>
      </div>
    );
  }

  // TODO: file
  // if (field.type === "file") {
  //   return <FileFormRenderer field={field} {...props} />
  // }

  return <Input type="text" placeholder={placeholder} {...props} />;
}
