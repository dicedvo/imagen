import TagDisplay from "@/components/TagDisplay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataRecord } from "@/core/data";
import { exportRecords } from "@/core/template/export";
import { Template } from "@/core/template/types";
import { valuesFromTemplate } from "@/core/template/values";
import { outputExportSettingsSchema } from "@/schemas/OutputExportSettingsSchema";
import useRecordsStore from "@/stores/records_store";
import {
  useImageGeneratorsStore,
  useOutputExporterStore,
  useUriHandlersStore,
} from "@/stores/registry_store";
import useTagsStore from "@/stores/tags_store";
import useTemplateStore from "@/stores/template_store";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";

function getRecordsForExport(
  exportScope: z.infer<typeof outputExportSettingsSchema>["exportScope"],
) {
  switch (exportScope) {
    case "current": {
      const currentRecord = useRecordsStore.getState().currentRecord();
      if (!currentRecord) return;
      return [currentRecord];
    }
    case "selected":
      return useRecordsStore.getState().selectedRecords();
    case "all":
      return useRecordsStore.getState().records;
    default:
      if (exportScope.startsWith("tagged:")) {
        const tag = decodeURIComponent(exportScope.replace(/^tagged:/, ""));
        const taggedRecords = useRecordsStore
          .getState()
          .records.filter((record) => {
            return record.__tags && record.__tags.indexOf(tag) !== -1;
          });
        return taggedRecords;
      }
      return useRecordsStore.getState().records;
  }
}

function getRawTemplateInstanceValue(
  template: Template | null,
  record: DataRecord,
) {
  if (!record.__id || !template) return null;

  const templateInstanceValues = useTemplateStore
    .getState()
    .getTemplateInstanceValues(template.name, record.__id);
  if (templateInstanceValues) {
    return templateInstanceValues;
  }

  return valuesFromTemplate(template, useImageGeneratorsStore.getState());
}

export default function ExportDialog({
  scope = "current",
  onSuccess,
  children,
}: {
  scope?: z.infer<typeof outputExportSettingsSchema>["exportScope"];
  onSuccess: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tags = useTagsStore(useShallow((state) => state.tags));

  const [outputExporters, getExporter] = useOutputExporterStore(
    useShallow((state) => [state.items, state.get]),
  );

  const template = useTemplateStore(useShallow((state) => state.template));

  const form = useForm<z.infer<typeof outputExportSettingsSchema>>({
    resolver: zodResolver(outputExportSettingsSchema),
    defaultValues: {
      exporterId: "",
      exportScope: scope,
      filenameFormat: "image",
      settings: {},
    },
  });

  const exporterId = form.watch("exporterId");
  const exportScope = form.watch("exportScope");
  const currentExporter = useMemo(() => getExporter(exporterId), [exporterId]);
  const recordsForExport = useMemo(
    () => getRecordsForExport(exportScope) ?? [],
    [exportScope],
  );

  const isExportable = useMemo(() => {
    return recordsForExport.length > 0 && !!template;
  }, [recordsForExport, template]);

  useEffect(() => {
    if (outputExporters.length === 0) return;
    form.setValue("exporterId", outputExporters[0]?.id);
  }, [outputExporters]);

  useEffect(() => {
    if (!currentExporter || typeof currentExporter === "undefined") return;

    const filenameFormat = form.getValues("filenameFormat");
    if (filenameFormat.endsWith(`.${currentExporter.fileExtension}`)) return;

    // remove old file extension
    const trimmed = filenameFormat.replace(/\.[^.]+$/, "");

    // Set file extension to filename
    form.setValue("filenameFormat", trimmed + currentExporter.fileExtension);
  }, [exporterId, currentExporter]);

  useEffect(() => {
    form.setValue("exportScope", scope, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [scope]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger disabled={!isExportable} asChild>
        {children}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
        </DialogHeader>

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => {})} className="space-y-4">
              <FormField
                control={form.control}
                name="exporterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exporter</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an exporter..." />
                        </SelectTrigger>

                        <SelectContent>
                          {outputExporters.map((exporter) => (
                            <SelectItem key={exporter.id} value={exporter.id}>
                              {exporter.id}
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
                name="exportScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Records to export</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select records to export..." />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="current">
                              Current record
                            </SelectItem>
                            <SelectItem value="selected">
                              Selected records
                            </SelectItem>
                            <SelectItem value="all">All records</SelectItem>
                          </SelectGroup>

                          <SelectGroup>
                            <SelectLabel>Records tagged with</SelectLabel>
                            {tags.map((tag) => (
                              <SelectItem
                                key={`tag_${tag.name}`}
                                value={`tagged:${encodeURIComponent(tag.name)}`}
                              >
                                <TagDisplay tag={tag} />
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="filenameFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filename</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter a filename" />
                    </FormControl>
                    <FormDescription>
                      You may use template tags such as <code>{`{{id}}`}</code>{" "}
                      to generate dynamic filenames.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              if (!currentExporter) return;
              exportRecords({
                exporter: currentExporter,
                template,
                records: recordsForExport,
                filenameFormat: form.getValues().filenameFormat,
                exporterOptions: form.getValues().settings,
                onGetRawTemplateInstanceValue: getRawTemplateInstanceValue,
                uriHandlersRegistry: useUriHandlersStore.getState(),
              }).then(({ filename, url }) => {
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();

                onSuccess();
                setOpen(false);
              });
            }}
          >
            Export
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
