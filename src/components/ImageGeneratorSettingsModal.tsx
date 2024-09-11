import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import { Form } from "./ui/form";
import { useImageGeneratorsStore } from "@/stores/registry_store";
import { ImageGeneratorValue } from "@/core/image_generator";
import { TemplateElement } from "@/core/template/types";
import { compileTemplateValues } from "@/helpers/template";
import useRecordsStore from "@/stores/records_store";

const formSettingsSchema = z.record(z.unknown());

export default function ImageGeneratorSettingsModal({
  generator: generatorId,
  children,
  element,
  value,
  onChange,
}: {
  generator: string;
  element: TemplateElement;
  value: ImageGeneratorValue;
  onChange: (v: ImageGeneratorValue) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const [generatedImage, setGeneratedImage] = useState<string | Blob | null>(
    null,
  );

  const generator = useImageGeneratorsStore((state) => state.get(generatorId));

  const form = useForm<z.infer<typeof formSettingsSchema>>({
    resolver: zodResolver(formSettingsSchema),
    defaultValues: value,
  });

  const generatePreview = async () => {
    const generator = useImageGeneratorsStore.getState().get(generatorId);
    if (!generator) {
      return;
    }

    const rawOptions = form.getValues();
    const { options } = compileTemplateValues(
      {
        options: rawOptions,
      },
      useRecordsStore.getState().currentRecord() ?? {},
    );

    console.log(options);

    const output = await generator.generate({
      options: options as ImageGeneratorValue,
      element,
    });
    setGeneratedImage(output);
  };

  const previewUrl = useMemo(() => {
    if (element.type !== "image_generator") return null;

    if (generatedImage) {
      if (typeof generatedImage === "string") {
        return generatedImage;
      } else {
        return URL.createObjectURL(generatedImage);
      }
    } else if (element.placeholder) {
      return element.placeholder as string;
    }
    return null;
  }, [generatedImage, element]);

  useEffect(() => {
    form.reset(value);
  }, [value]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogTitle>"{generator?.id ?? generatorId}" Settings</DialogTitle>

        {!generator && (
          <div>
            <p>Generator ID provided is invalid or not found</p>
          </div>
        )}

        {generator && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((newOpts) => {
                onChange({
                  ...newOpts,
                  outputUri: "",
                });
                setOpen(false);
              })}
            >
              <div className="flex">
                <div className="w-1/2 pr-2">
                  <generator.Component form={form} generator={generator} />
                </div>

                <div className="w-1/2 flex items-center pl-2">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto shadow"
                    />
                  ) : (
                    <p className="text-gray-500 text-center w-full">
                      No preview available
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="flex flex-col space-x-2 justify-end pt-4">
                <Button type="button" onClick={generatePreview}>
                  Generate
                </Button>
                <Button type="submit">Save</Button>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
