import { FC } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { TemplateElement } from "./template/types";

export type ImageGeneratorValue = Record<string, unknown>;

export type FinalImageGeneratorValue = {
  outputUri: string;
} & ImageGeneratorValue;

export type ImageGeneratorFn = (cfg: {
  options: ImageGeneratorValue;
  element: TemplateElement;
}) => Promise<string | Blob>;

export type ImageGeneratorProps<T extends FieldValues = ImageGeneratorValue> = {
  generator: ImageGenerator;
  form: UseFormReturn<T>;
};

export default interface ImageGenerator<
  T extends FieldValues = ImageGeneratorValue,
> {
  id: string;
  generate: ImageGeneratorFn;
  defaultOptions(): ImageGeneratorValue;
  Component: FC<ImageGeneratorProps<T>>;
}
