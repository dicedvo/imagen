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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportItem } from "@/core/template/export";
import {
  ExportScope,
  outputExportSettingsSchema,
} from "@/schemas/OutputExportSettingsSchema";
import useRecordsStore from "@/stores/records_store";
import { useOutputExporterStore } from "@/stores/registry_store";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import ExportScopeDropdown from "./ExportScopeDropdown";
import JSZip from "jszip";
import { useExport } from "@/lib/hooks";
import { isTextDynamic } from "@/core/template/values";

async function processExports(exports: ExportItem[]) {
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
  scope?: ExportScope;
  onSuccess: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { exportImages } = useExport();

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

  const [exporterId, exportScope, filenameFormat] = form.watch([
    "exporterId",
    "exportScope",
    "filenameFormat",
  ]);
  const currentExporter = useMemo(() => getExporter(exporterId), [exporterId]);
  const forExportCount = useRecordsStore(
    useShallow((state) => state.selectRecordsByScope(exportScope).length),
  );

  useEffect(() => {
    if (outputExporters.length === 0) return;
    form.setValue("exporterId", outputExporters[0]?.id);
  }, [outputExporters]);

  useEffect(() => {
    if (forExportCount > 1 && !isTextDynamic(filenameFormat)) {
      form.setValue("filenameFormat", `${filenameFormat}_{{_index}}`, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [forExportCount, filenameFormat]);

  useEffect(() => {
    form.setValue("exportScope", scope, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [scope]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger disabled={forExportCount === 0} asChild>
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
                    <FormLabel>Output format</FormLabel>
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
                      <ExportScopeDropdown
                        defaultValue={field.value}
                        onChange={field.onChange}
                      />
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
                      <div className="flex">
                        <Input
                          {...field}
                          placeholder="Enter a filename"
                          className="flex-1 rounded-r-none"
                        />
                        <div className="rounded-r-md border-y border-r px-4 py-1 bg-gray-50">
                          <span className="mt-0.5 block">
                            {currentExporter?.fileExtension}
                          </span>
                        </div>
                      </div>
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
              exportImages({
                exporter: currentExporter,
                exportScope,
                filenameFormat:
                  form.getValues().filenameFormat +
                  currentExporter.fileExtension,
                exporterOptions: form.getValues().settings,
              })
                .then(processExports)
                .then(({ filename, url }) => {
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
