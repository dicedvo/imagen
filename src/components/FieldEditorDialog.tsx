import { ReactNode, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import FieldSchema, { Field, FieldSchemaValidationError } from "@/lib/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useSchemaFieldTypeStore } from "@/stores/schema_store";
import { transformRecordKey } from "@/core/data";

export default function FieldEditorDialog({
  field,
  onSave,
  children,
}: {
  field?: Field | null;
  children: ReactNode;
  onSave: (field: Field) => void;
}) {
  const [open, setOpen] = useState(false);
  const [autoGenerateKey, setAutoGenerateKey] = useState(false);
  const schemaFieldTypes = useSchemaFieldTypeStore((state) => state.items);

  const form = useForm<Field>({
    resolver: zodResolver(FieldSchema),
    defaultValues: {
      key: "",
      name: "",
      type: "text",
      primary_key: false,
      required: false,
      options: {},
    },
  });

  const [propertyKey, propertyName, primaryKey] = form.watch(
    ["key", "name", "primary_key"],
    {
      key: undefined,
      name: undefined,
      primary_key: false,
    },
  );

  useEffect(() => {
    if (!field) {
      return;
    }

    form.reset(field);
    if (field.key.length === 0 || /\s/.test(field.key)) {
      setAutoGenerateKey(true);
    }
  }, [field]);

  useEffect(() => {
    if (primaryKey) {
      form.setValue("required", true);
    }
  }, [primaryKey]);

  useEffect(() => {
    if (
      typeof propertyKey === "undefined" &&
      typeof propertyName === "undefined"
    ) {
      return;
    }

    if (propertyKey.length !== 0) {
      const isKeyDirty = form.getFieldState("key").isDirty;
      if (isKeyDirty || !autoGenerateKey) {
        if (isKeyDirty && autoGenerateKey) {
          setAutoGenerateKey(false);
        }
        return;
      }
    } else {
      setAutoGenerateKey(true);
    }

    form.setValue("key", transformRecordKey(propertyName), {
      shouldDirty: false,
    });
  }, [propertyName, propertyKey, autoGenerateKey]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {field ? `Edit Field "${field.name}"` : "Add Field"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (updatedField) => {
                try {
                  console.log("Saving field", updatedField);
                  onSave(updatedField);
                  setOpen(false);
                } catch (e) {
                  if (e instanceof FieldSchemaValidationError) {
                    for (const [key, message] of Object.entries(e.errors)) {
                      form.setError(key as keyof Field, { message });
                    }
                  }

                  console.error(e);
                }
              },
              (errors) => {
                console.log(errors);
              },
            )}
          >
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Property Key</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {schemaFieldTypes.map((type) => (
                            <SelectItem
                              key={`field_editor_schema_field_type_${type.id}`}
                              value={type.id}
                            >
                              <div className="flex flex-row items-center">
                                <type.icon className="w-5 h-5 mr-2" />
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required"
                disabled={primaryKey}
                render={({ field }) => (
                  <FormItem className="flex flex-row space-x-3 items-center">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={field.disabled}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This field is required</FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primary_key"
                render={({ field }) => (
                  <FormItem className="flex flex-row space-x-3 items-center">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={field.disabled}
                      />
                    </FormControl>
                    <div>
                      <FormLabel>Mark this field as primary key</FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
