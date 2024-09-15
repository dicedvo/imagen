import PrintPreviewer from "@/components/PrintPreviewer";
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
import {
  exportScope,
  taggedExportScope,
} from "@/schemas/OutputExportSettingsSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const PaperConfigurationSchema = z.object({
  label: z.string().optional(),
  width: z.number(),
  height: z.number(),
});

type PaperTemplate = z.infer<typeof PaperConfigurationSchema>;

const PrintSettingsSchema = z.object({
  printScope: exportScope.or(taggedExportScope),
  printMode: z.enum(["all", "dynamic_only", "static_only"]),
  showOutline: z.boolean(),
  // in pixels
  printMargin: z.object({
    top: z.number(),
    right: z.number(),
    bottom: z.number(),
    left: z.number(),
  }),
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

const a4size = paperTemplates.find((t) => t.label === "A4")!;

export default function PrintDialog({ children }: { children: ReactNode }) {
  const [showIndividualPrintMargin, setShowIndividualPrintMargin] =
    useState(false);

  const form = useForm<z.infer<typeof PrintSettingsSchema>>({
    resolver: zodResolver(PrintSettingsSchema),
    defaultValues: {
      printMode: "all",
      printScope: "current",
      showOutline: false,
      printMargin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1,
      paperSize: a4size,
      paperOrientation: "portrait",
      paperMargin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },
  });

  const paperSize = form.watch("paperSize");

  // TODO: replace with actual tags from the database
  const tags = ["ready_for_print", "for_web", "for_email"];

  return (
    <Dialog open={false}>
      <DialogTrigger disabled asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="p-0 max-w-6xl">
        <div className="flex">
          <div className="w-2/3 h-[80vh] bg-gray-200 rounded-tl">
            <PrintPreviewer paperSize={paperSize} />
          </div>

          <div className="w-1/3 px-6 pb-6 overflow-y-auto h-[80vh]">
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
                  name="printMode"
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

                <div className="space-y-2">
                  <span className="text-sm font-medium">Print margins</span>
                  <div>
                    {showIndividualPrintMargin ? (
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          {["top", "right", "bottom", "left"].map((side) => (
                            <FormField
                              key={`printMargin[${side}]`}
                              control={form.control}
                              name={
                                `printMargin.${side}` as
                                  | "printMargin.top"
                                  | "printMargin.right"
                                  | "printMargin.bottom"
                                  | "printMargin.left"
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
                                      value={field.value}
                                      onChange={(event) =>
                                        field.onChange(
                                          event.target.valueAsNumber,
                                        )
                                      }
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="printMargin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Overall</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value.top}
                                onChange={(event) =>
                                  field.onChange({
                                    top: event.target.valueAsNumber,
                                    right: event.target.valueAsNumber,
                                    bottom: event.target.valueAsNumber,
                                    left: event.target.valueAsNumber,
                                  })
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-y-0">
                  <div className="space-y-0">
                    <Checkbox
                      id="show-indiv-print-margins"
                      checked={showIndividualPrintMargin}
                      onCheckedChange={(state) =>
                        setShowIndividualPrintMargin(
                          state === "indeterminate" ? false : state,
                        )
                      }
                    />
                  </div>
                  <div className="">
                    <label
                      htmlFor="show-indiv-print-margins"
                      className="text-sm leading-none font-medium"
                    >
                      Show individual print margins
                    </label>
                  </div>
                </div>

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
                            field.onChange(event.target.valueAsNumber)
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
                            field.onChange(
                              paperTemplates.find(
                                (pt) => pt.label === value,
                              ) ?? {
                                label: "Custom",
                                width: field.value.width,
                                height: field.value.height,
                              },
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {field.value.label ?? "Custom"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Custom">Custom...</SelectItem>
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
                                field.onChange(event.target.valueAsNumber)
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
                                field.onChange(event.target.valueAsNumber)
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
                                    value={field.value}
                                    onChange={(event) =>
                                      field.onChange(event.target.valueAsNumber)
                                    }
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
          <Button>Print</Button>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
