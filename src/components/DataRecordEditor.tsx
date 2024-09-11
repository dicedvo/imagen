import { DataRecord } from "@/core/data";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import useFieldsStore from "@/stores/fields_store";
import { cn } from "@/lib/utils";
import FormFieldRenderer from "./FormFieldRenderer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import deepEqual from "deep-eql";

const dataRecordSchema = z.record(z.unknown());

export default function DataRecordEditor({
  record = null,
  onChange,
  className,
}: {
  record: DataRecord | null;
  onChange: (record: DataRecord) => void;
  className?: string;
}) {
  const form = useForm<z.infer<typeof dataRecordSchema>>({
    resolver: zodResolver(dataRecordSchema),
    defaultValues: record ?? {},
    mode: "onChange",
  });

  const fields = useFieldsStore((state) => state.fields);
  // const updatedRecord = form.watch();

  useEffect(() => {
    if (!record) {
      form.reset(
        Object.values(fields)
          .map((field) => field.key)
          .reduce<DataRecord>((pv, cv) => {
            pv[cv] = "";
            return pv;
          }, {}),
      );
    } else {
      form.reset(record);
    }
  }, [record, fields]);

  useEffect(() => {
    try {
      if (
        !record ||
        !form.formState.isValid ||
        deepEqual(record, form.getValues())
      ) {
        // console.log(record, form.getValues(), deepEqual(record, form.getValues()));
        return;
      }
      onChange(form.getValues());
    } catch (e) {
      console.error(e);
    }
  }, [record, form.formState]);

  if (fields.length === 0 || !record) {
    return (
      <div
        className={cn(
          className,
          "flex items-center justify-center text-center",
        )}
      >
        <p>None selected.</p>
      </div>
    );
  }

  return (
    <div className={cn(className, "text-left w-full flex flex-col space-y-3")}>
      <Form {...form}>
        {fields.map((recordField) => (
          <FormField
            key={`field_${recordField.key}`}
            control={form.control}
            name={recordField.key}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{recordField.name}</FormLabel>
                <FormControl>
                  <FormFieldRenderer field={recordField} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </Form>
    </div>
  );
}
