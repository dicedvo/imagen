import PrintPreviewer, {
  PRINT_SCALING_FACTOR,
} from "@/components/PrintPreviewer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
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
import {
  exportScope,
  taggedExportScope,
} from "@/schemas/OutputExportSettingsSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ExportScopeDropdown from "./ExportScopeDropdown";
import { useShallow } from "zustand/react/shallow";
import { useOutputExporterStore } from "@/stores/registry_store";
import { useExport } from "@/lib/hooks";
import { ExportItem } from "@/core/template/export";
import useRecordsStore from "@/stores/records_store";
import jsPDF from "jspdf";
import { pixels } from "@pacote/pixels";

const PaperConfigurationSchema = z.object({
  label: z.string().optional(),
  width: z.number(),
  height: z.number(),
});

type PaperTemplate = z.infer<typeof PaperConfigurationSchema>;

const PrintSettingsSchema = z.object({
  printScope: exportScope.or(taggedExportScope),
  renderFilter: z.enum(["all", "dynamic_only", "static_only"]),
  showOutline: z.boolean(),
  // in pixels
  imageSpacing: z.number(),
  scale: z.number(),

  paperSize: PaperConfigurationSchema,
  paperOrientation: z.enum(["portrait", "landscape"]),
  // in inches
  paperMargin: z.object({
    top: z.number(),
    right: z.number(),
    bottom: z.number(),
    left: z.number(),
  }),
});

// width and height in mm
const paperTemplates: PaperTemplate[] = [
  { label: "A0", width: 841, height: 1189 },
  { label: "A1", width: 594, height: 841 },
  { label: "A2", width: 420, height: 594 },
  { label: "A3", width: 297, height: 420 },
  { label: "A4", width: 210, height: 297 },
  { label: "A5", width: 148, height: 210 },
  { label: "A6", width: 105, height: 148 },
  { label: "B4", width: 250, height: 353 },
  { label: "B5", width: 176, height: 250 },
  { label: "Executive", width: 184, height: 267 },
  { label: "Folio", width: 210, height: 330 },
  { label: "Legal", width: 216, height: 356 },
  { label: "Letter", width: 216, height: 279 },
  { label: "Ledger", width: 279, height: 432 },
  { label: "Postcard", width: 100, height: 148 },
  { label: "Quarto", width: 215, height: 275 },
  { label: "Statement", width: 140, height: 216 },
  { label: "Tabloid", width: 279, height: 432 },
  { label: "US Government Letter", width: 203, height: 267 },
  { label: "US Government Legal", width: 216, height: 330 },
];

const paperOrientations: { label: string; value: string }[] = [
  { label: "Portrait", value: "portrait" },
  { label: "Landscape", value: "landscape" },
];

const paperTemplatesMap = paperTemplates.reduce(
  (acc, t) => {
    acc[t.label!] = t;
    return acc;
  },
  {} as Record<string, PaperTemplate>,
);

const a4size = paperTemplatesMap["A4"];

export default function PrintDialog({ children }: { children: ReactNode }) {
  const [open, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof PrintSettingsSchema>>({
    resolver: zodResolver(PrintSettingsSchema),
    defaultValues: {
      renderFilter: "all",
      printScope: "current",
      showOutline: false,
      imageSpacing: 0.25,
      scale: 1,
      paperSize: a4size,
      paperOrientation: "landscape",
      paperMargin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },
  });

  const previousPaperOrientation = useRef<string | null>(null);
  const [
    printScope,
    paperMargin,
    paperSize,
    paperOrientation,
    imageSpacing,
    imageScale,
    renderFilter,
    showOutline,
  ] = form.watch([
    "printScope",
    "paperMargin",
    "paperSize",
    "paperOrientation",
    "imageSpacing",
    "scale",
    "renderFilter",
    "showOutline",
  ]);

  const selectedRecords = useRecordsStore(
    useShallow((state) => state.selectRecordsByScope(printScope)),
  );
  const { exportImages } = useExport();

  const jpegExporter = useOutputExporterStore(
    useShallow((state) => state.get("jpeg")!),
  );

  const [exports, setExports] = useState<ExportItem[]>([]);
  const [printReadyExports, setPrintReadyExports] = useState<ExportItem[]>([]);

  const printExports = () => {
    if (printReadyExports.length === 0) return;

    const finalPaperSize = {
      width: pixels(`${paperSize.width}mm`) * PRINT_SCALING_FACTOR,
      height: pixels(`${paperSize.height}mm`) * PRINT_SCALING_FACTOR,
    };

    const margin = {
      x:
        pixels(
          typeof paperMargin.left === "string"
            ? paperMargin.left
            : `${paperMargin.left}in`,
        ) * PRINT_SCALING_FACTOR,
      y:
        pixels(
          typeof paperMargin.top === "string"
            ? paperMargin.top
            : `${paperMargin.top}in`,
        ) * PRINT_SCALING_FACTOR,
    };

    const pdf = new jsPDF(paperOrientation, "px", [
      finalPaperSize.width,
      finalPaperSize.height,
    ]);

    for (let i = 0; i < printReadyExports.length; i++) {
      const exportItem = printReadyExports[i];
      const img = new Image();
      img.src = URL.createObjectURL(exportItem.content);
      pdf.addImage(
        img,
        "PNG",
        margin.x,
        margin.y,
        finalPaperSize.width,
        finalPaperSize.height,
      );
      if (i < printReadyExports.length - 1) {
        pdf.addPage();
      }
    }

    pdf.autoPrint();
    window.open(URL.createObjectURL(pdf.output("blob")));
  };

  useEffect(() => {
    if (previousPaperOrientation.current === paperOrientation) {
      return;
    }

    if (
      (paperOrientation === "landscape" &&
        paperSize.height < paperSize.width) ||
      (paperOrientation === "portrait" && paperSize.width < paperSize.height)
    ) {
      return;
    }

    previousPaperOrientation.current = paperOrientation;

    form.setValue("paperSize", {
      width: paperSize.height,
      height: paperSize.width,
    });
  }, [paperOrientation, paperSize]);

  useEffect(() => {
    if (!jpegExporter) return;
    exportImages({
      exporter: jpegExporter,
      exporterOptions: {},
      recordsForExport: selectedRecords,
      renderFilter,
    }).then(setExports);
  }, [jpegExporter, selectedRecords, renderFilter]);

  return (
    <Dialog open={open} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="p-0 max-w-6xl">
        <div className="flex">
          <div className="w-2/3 h-[80vh] bg-gray-200 rounded-tl">
            <PrintPreviewer
              className="overflow-x-hidden overflow-y-auto rounded-tl"
              paperSize={paperSize}
              margin={paperMargin}
              exports={exports ?? []}
              spacing={imageSpacing}
              scale={imageScale}
              showOutline={showOutline}
              onGenerateExports={setPrintReadyExports}
            />
          </div>

          <div className="w-1/3 px-6 pb-6 overflow-y-auto h-[80vh] overflow-x-hidden">
            <DialogTitle className="pt-6 pb-6">Print</DialogTitle>

            <Form {...form}>
              <form className="space-y-3">
                <FormField
                  control={form.control}
                  name="printScope"
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
                  name="renderFilter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Print mode</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select print mode..." />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="dynamic_only">
                              Dynamic only
                            </SelectItem>
                            <SelectItem value="static_only">
                              Static only
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showOutline"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="leading-none">
                        <FormLabel>Show outline</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageSpacing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Spacing (in)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={0}
                          step={0.25}
                          onChange={(event) => {
                            field.onChange(
                              Number.isFinite(event.target.valueAsNumber)
                                ? event.target.valueAsNumber
                                : 0,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        The spacing between images in centimeters.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scale</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={0.25}
                          min={0.25}
                          {...field}
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(
                              Number.isFinite(event.target.valueAsNumber)
                                ? event.target.valueAsNumber
                                : 0,
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paperSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paper Size</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value.label ?? "Custom"}
                          onValueChange={(value) => {
                            field.onChange({
                              ...(paperTemplatesMap[value] ?? {
                                label: "Custom",
                                width: field.value.width,
                                height: field.value.height,
                              }),
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {field.value.label ?? "Custom"}
                            </SelectValue>
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="Custom">
                              Custom size...
                            </SelectItem>

                            {paperTemplates.map((pt) => (
                              <SelectItem
                                key={`paper_${pt.label!}`}
                                value={pt.label!}
                              >
                                {pt.label!}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {paperSize.label === "Custom" && (
                  <>
                    <FormField
                      control={form.control}
                      name="paperSize.width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paper Width (in px)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value}
                              onChange={(event) =>
                                field.onChange(
                                  Number.isFinite(event.target.valueAsNumber)
                                    ? event.target.valueAsNumber
                                    : 0,
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paperSize.height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paper Height (in px)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value}
                              onChange={(event) =>
                                field.onChange(
                                  Number.isFinite(event.target.valueAsNumber)
                                    ? event.target.valueAsNumber
                                    : 0,
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="paperOrientation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paper Orientation</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {
                                paperOrientations.find(
                                  (po) => po.value === field.value,
                                )!.label
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {paperOrientations.map((po) => (
                              <SelectItem key={po.label} value={po.value}>
                                {po.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <span className="text-sm font-medium">Page margins</span>
                  <div>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        {["top", "right", "bottom", "left"].map((side) => (
                          <FormField
                            key={`paperMargin[${side}]`}
                            control={form.control}
                            name={
                              `paperMargin.${side}` as
                                | "paperMargin.top"
                                | "paperMargin.right"
                                | "paperMargin.bottom"
                                | "paperMargin.left"
                            }
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {side[0].toUpperCase() + side.substring(1)}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    step={0.25}
                                    min={0}
                                    onChange={(event) => {
                                      field.onChange(
                                        Number.isFinite(
                                          event.target.valueAsNumber,
                                        )
                                          ? event.target.valueAsNumber
                                          : 0,
                                      );
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter className="px-6 pb-4 space-x-3">
          <Button onClick={printExports} disabled={exports.length === 0}>
            Print
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
