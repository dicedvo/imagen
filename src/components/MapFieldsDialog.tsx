import { z } from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Form, FormField } from "./ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "@/schemas/FieldSchema";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";

const mapFieldSchema = z.record(z.string().min(1));

export default function MapFieldsDialog({ open, onOpenChange, onSuccess, columns, existingFields }: {
  columns: string[]
  existingFields: Field[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (mappings: Record<string, string>) => void
}) {
  const form = useForm<z.infer<typeof mapFieldSchema>>({
    resolver: zodResolver(mapFieldSchema),
    defaultValues: {}
  });

  const values = form.watch();

  useEffect(() => {
    form.reset(columns.reduce<Record<string, string>>((pv, cv) => {
      pv[cv] = '--create--'
      return pv;
    }, {}));
  }, [columns]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Map Fields</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex flex-col divide-y"
            onSubmit={form.handleSubmit((mappings) => {
              onSuccess(mappings);
              onOpenChange(false);
            })}>

            <div className="flex text-sm">
              <div className="w-1/2 pr-1 py-2">
                <p className="font-semibold text-muted-foreground">Field Name</p>
              </div>

              <div className="w-1/2 pl-1 py-2">
                <p className="font-semibold text-muted-foreground">Options</p>
              </div>
            </div>

            {columns.map(column => (
              <FormField
                control={form.control}
                name={column}
                key={`column_mapping_${column}`}
                render={({ field }) => (
                  <div className="flex py-2">
                    <div className="w-1/2 pr-1 text-sm flex items-center">
                      <p>{column}</p>
                    </div>

                    <div className="w-1/2 pl-1">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {existingFields.map(existingField => (
                            <SelectItem
                              disabled={values[column] === existingField.key || Object.values(values).includes(existingField.key)}
                              key={`existing_field_${existingField.key}`}
                              value={existingField.key}>
                              {existingField.name} ({existingField.key})
                            </SelectItem>
                          ))}
                          <SelectItem value="--create--">Create column</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )} />
            ))}

            <DialogFooter className="pt-2">
              <Button>Save</Button>
            </DialogFooter>
          </form>
        </Form>

      </DialogContent>
    </Dialog>
  );
}