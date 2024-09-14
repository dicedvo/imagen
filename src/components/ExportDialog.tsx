import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  useOutputExporterStore,
  useUriHandlersStore,
} from "@/stores/registry_store";
import { useShallow } from "zustand/react/shallow";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { _OutputExporter } from "@/core/output_exporter";
import useRecordsStore from "@/stores/records_store";
import useTemplateStore from "@/stores/template_store";
import { DataRecord } from "@/core/data";
import {
  compileTemplateValues,
  renderTemplateText,
  valuesFromTemplate,
} from "@/helpers/template";
import { Template, TemplateInstanceValues } from "@/core/template/types";
import Konva from "konva";
import TemplateRenderer from "@/core/template/renderer";
import JSZip from "jszip";

// Export Scope
// - current: export the current record
// - selected: export the selected records
// - tagged: export the tagged records
// - all: export all records
export const exportScope = z.enum(["current", "selected", "all"]);
export const taggedExportScope = z
  .string()
  .startsWith("tagged:")
  .and(z.custom<`tagged:${string}`>());

const outputExportSettingsSchema = z.object({
  exporterId: z.string(),
  exportScope: exportScope.or(taggedExportScope),
  filenameFormat: z.string(),
  settings: z.record(z.any()),
});

function recordsForExport(
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
      // TODO: implement tagged records
      // const tag = exportScope.replace(/^tagged:/, "");
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

  return valuesFromTemplate(template);
}

interface ExportInfo {
  filename: string;
  values: TemplateInstanceValues;
  width: number; // TODO: replace width with the opts.width setting
  height: number; // TODO: replace height with the opts.height setting
}

interface ExportItem {
  filename: string;
  content: Blob;
}

function getPrimaryExportInfo(
  template: Template,
  filenameFormat: string,
  exportScope: z.infer<typeof outputExportSettingsSchema>["exportScope"],
): ExportInfo[] {
  const records = recordsForExport(exportScope);
  if (!records) return [];

  return records
    .map((record) => {
      const rawValues = getRawTemplateInstanceValue(template, record);
      if (!rawValues) return null;
      return {
        filename: renderTemplateText(filenameFormat, record),
        values: compileTemplateValues(rawValues, record),
        width: template.settings.canvas_width,
        height: template.settings.canvas_height,
      };
    })
    .filter(Boolean) as ExportInfo[];
}

async function exportRecords(
  _exporter: _OutputExporter,
  opts: z.infer<typeof outputExportSettingsSchema>,
) {
  const template = useTemplateStore.getState().template;
  if (!template) {
    throw new Error("No template loaded");
  }

  const toBeExported = getPrimaryExportInfo(
    template,
    opts.filenameFormat,
    opts.exportScope,
  );
  if (toBeExported.length === 0) {
    throw new Error("No records to export");
  }

  const fakeCanvas = document.createElement("div");
  const stage = new Konva.Stage({
    container: fakeCanvas,
    width: 0,
    height: 0,
  });

  const outputLayer = new Konva.Layer();
  stage.add(outputLayer);

  const renderer = new TemplateRenderer(
    outputLayer,
    useUriHandlersStore.getState(),
  );
  renderer.setWaitForAssetLoad(true);

  const exporter =
    typeof _exporter === "object" ? _exporter : _exporter(renderer);
  const exports: ExportItem[] = [];

  for (const { values, filename } of toBeExported) {
    const output = await exporter.export(template, values, opts.settings);

    if ("url" in output) {
      const outputResponse = await fetch(output.url);
      const outputBlob = await outputResponse.blob();

      exports.push({
        filename,
        content: outputBlob,
      });
    } else {
      exports.push({
        filename,
        content: output.blob,
      });
    }
  }

  // outputLayer.destroy();
  // stage.destroy();

  if (exports.length === 1) {
    const [exported] = exports;
    return {
      filename: exported.filename,
      url: URL.createObjectURL(exported.content),
    };
  } else {
    const zip = new JSZip();
    for (const { filename, content } of exports) {
      zip.file(filename, content);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    return {
      filename: "export.zip",
      url: URL.createObjectURL(blob),
    };
  }
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

  // TODO: replace with actual tags from the database
  const tags = ["ready_for_print", "for_web", "for_email"];

  const [outputExporters, getExporter] = useOutputExporterStore(
    useShallow((state) => [state.items, state.get]),
  );

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
  const currentExporter = useMemo(() => getExporter(exporterId), [exporterId]);

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
      <DialogTrigger asChild>{children}</DialogTrigger>

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
                              <SelectItem key={tag} value={`tagged:${tag}`}>
                                {tag}
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
              exportRecords(currentExporter, form.getValues()).then(
                ({ filename, url }) => {
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = filename;
                  a.click();

                  onSuccess();
                  setOpen(false);
                },
              );
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
