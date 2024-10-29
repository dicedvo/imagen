import { DataSourceRecord } from "@/core/data";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import useSchemaStore, { useSchemaFieldTypeStore } from "@/stores/schema_store";
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
import { Schema } from "@/lib/schema";

const dataRecordSchema = z.object({
  data: z.record(z.unknown()),
});

export default function DataSourceRecordEditor({
  record = null,
  schema,
  onChange,
  className,
}: {
  schema: Schema;
  record: Pick<DataSourceRecord, "data"> | null;
  onChange: (record: Pick<DataSourceRecord, "data">) => void;
  className?: string;
}) {
  const form = useForm<z.infer<typeof dataRecordSchema>>({
    resolver: zodResolver(dataRecordSchema),
    defaultValues: record ?? { data: {} },
    mode: "onChange",
  });

  const getSchemaFieldType = useSchemaFieldTypeStore((state) => state.get);

  useEffect(() => {
    if (!record) {
      form.reset(
        Object.values(schema.fields)
          .map((field) => field.key)
          .reduce<Pick<DataSourceRecord, "data">>(
            (pv, cv) => {
              pv.data[cv] = "" as string;
              return pv;
            },
            { data: {} },
          ),
      );
    } else {
      form.reset(record);
    }
  }, [record, schema]);

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
      onChange(form.getValues() as DataSourceRecord);
    } catch (e) {
      console.error(e);
    }
  }, [record, form.formState]);

  if (schema.fields.length === 0 || !record) {
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
        {schema.fields.map((recordField) => (
          <FormField
            key={`field_${recordField.key}`}
            control={form.control}
            name={`data.${recordField.key}`}
            render={({ field }) => {
              const schemaFieldType = getSchemaFieldType(recordField.type);
              const Component = schemaFieldType?.render;
              return (
                <FormItem>
                  <FormLabel>{recordField.name}</FormLabel>
                  <FormControl>
                    {schemaFieldType && Component ? (
                      <Component settings={recordField.options} {...field} />
                    ) : (
                      <FormFieldRenderer field={recordField} {...field} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        ))}
      </Form>
    </div>
  );
}
