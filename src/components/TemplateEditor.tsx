import TemplateElementFieldRenderer from "@/components/TemplateElementRenderer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  editableElementTypes,
  Template,
  TemplateInstanceValues,
} from "@/core/template/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const templateEditorSchema = z.record(z.unknown());

export default function TemplateEditor({
  template,
  values,
  className,
  onChange,
}: {
  template: Template | null;
  values: TemplateInstanceValues | null;
  onChange: (record: TemplateInstanceValues) => void;
  className?: string;
}) {
  const form = useForm<z.infer<typeof templateEditorSchema>>({
    resolver: zodResolver(templateEditorSchema),
    defaultValues: {},
    mode: "onBlur",
  });

  useEffect(() => {
    if (values) {
      form.reset(values);
    }
  }, [values]);

  useEffect(() => {
    const subscription = form.watch((newValues) => {
      if (!values) return;
      onChange(newValues);
    });
    return () => subscription.unsubscribe();
  }, [values, form.watch]);

  if (!values || !template) {
    return (
      <div
        className={cn(
          className,
          "flex items-center justify-center text-center",
        )}
      >
        <p>None selected. {JSON.stringify([!!values, !!template])}</p>
      </div>
    );
  }

  return (
    <div className={cn(className, "text-left w-full flex flex-col space-y-3")}>
      <Form {...form}>
        {template.elements
          .filter((te) => editableElementTypes[te.type] || te.type === "group")
          .map((templateElement, idx) =>
            templateElement.type === "group" ? (
              <Fragment key={`element_field_${idx}`}>
                {templateElement.children.map(
                  (childTemplateElement, childElIdx) => (
                    <FormField
                      key={`element_field_${idx}_${childElIdx}`}
                      control={form.control}
                      name={`${templateElement.id ?? `field_${idx}`}.${childTemplateElement.id ?? `field_${idx}`}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{childTemplateElement.name}</FormLabel>
                          <FormControl>
                            <TemplateElementFieldRenderer
                              element={childTemplateElement}
                              {...field}
                              ref={() => {}}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ),
                )}
              </Fragment>
            ) : (
              <FormField
                key={`element_field_${idx}`}
                control={form.control}
                name={templateElement.id ?? `field_${idx}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{templateElement.name}</FormLabel>
                    <FormControl>
                      <TemplateElementFieldRenderer
                        element={templateElement}
                        {...field}
                        ref={() => {}}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ),
          )}
      </Form>
    </div>
  );
}
