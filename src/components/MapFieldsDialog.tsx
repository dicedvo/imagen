import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Form, FormField } from "./ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Schema } from "@/lib/schema";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { DataSource } from "@/core/data";
import { Input } from "./ui/input";

const mapFieldSchema = z.record(
  z.object({
    option: z.string(),
    value: z.string().optional(),
  }),
);

export default function MapSchemaDialog({
  onSuccess,
  onClose,
  source,
  currentSchema,
}: {
  source: DataSource<Schema> | null; // DataSource to be mapped into the schema
  currentSchema: Schema;
  onSuccess: (mappings: Record<string, string>) => void;
  onClose?: () => void;
}) {
  const form = useForm<z.infer<typeof mapFieldSchema>>({
    resolver: zodResolver(mapFieldSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (!source) return;
    form.reset(
      currentSchema.fields.reduce<
        Record<string, { option: string; value: string }>
      >((pv, cv) => {
        const currentSystemSchemaValue = source.systemSchemaValues[cv.key];
        const currentOption =
          currentSystemSchemaValue &&
          typeof currentSystemSchemaValue === "string"
            ? currentSystemSchemaValue.replace("{{", "").replace("}}", "")
            : cv.key;

        pv[cv.key] = {
          option: source.schema.fields.find((f) => f.key === currentOption)
            ? currentOption
            : "--custom--",
          value: (currentSystemSchemaValue as string) || `{{${currentOption}}}`,
        };
        return pv;
      }, {}),
    );
  }, [currentSchema, source]);

  return (
    <Dialog
      open={!!source}
      onOpenChange={(state) => {
        if (!state && onClose) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Map Schema Fields</DialogTitle>
          <DialogDescription>
            Select the fields you want to map from the source schema to the
            target schema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex flex-col divide-y"
            onSubmit={form.handleSubmit((mappings) => {
              // setTimeout to 200ms to avoid any flickering
              setTimeout(() => {
                onSuccess(
                  Object.entries(mappings).reduce(
                    (pv, [field, { option, value }]) => ({
                      ...pv,
                      [field]: value ?? `{{${option}}}`,
                    }),
                    {},
                  ),
                );
              }, 200);
            })}
          >
            <div className="flex text-sm">
              <div className="w-1/2 pr-1 py-2">
                <p className="font-semibold text-muted-foreground">
                  Field Name
                </p>
              </div>

              <div className="w-1/2 pl-1 py-2">
                <p className="font-semibold text-muted-foreground">Options</p>
              </div>
            </div>

            {currentSchema.fields.map((column) => (
              <FormField
                control={form.control}
                name={column.key}
                key={`column_mapping_${column.key}`}
                render={({ field }) => (
                  <div className="flex py-2">
                    <div className="w-1/2 pr-1 text-sm flex items-center">
                      <p>{column.name}</p>
                    </div>

                    <div className="w-1/2 pl-1 space-y-2">
                      <Select
                        onValueChange={(v) =>
                          field.onChange({
                            ...field.value,
                            option: v,
                            value:
                              v === "--custom--"
                                ? `{{${field.value.option}}}`
                                : `{{${v}}}`,
                          })
                        }
                        defaultValue={field.value.option}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {source?.schema.fields.map((existingField) => (
                            <SelectItem
                              disabled={
                                field.value.option === existingField.key
                              }
                              key={`existing_field_${existingField.key}`}
                              value={existingField.key}
                            >
                              {existingField.name} ({existingField.key})
                            </SelectItem>
                          ))}
                          <SelectItem value="--custom--">
                            Custom Value
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {field.value.option === "--custom--" && (
                        <Input
                          type="text"
                          className="input"
                          placeholder="Custom Value"
                          value={field.value.value}
                          onChange={(e) => {
                            field.onChange({
                              ...field.value,
                              value: e.target.value,
                            });
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              />
            ))}

            <DialogFooter className="pt-2">
              <Button>Save</Button>
              {onClose && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="mr-2"
                >
                  Cancel
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
