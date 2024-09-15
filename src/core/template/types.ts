import { ImageGeneratorValue } from "../image_generator";

export type TemplateInstanceValues = Record<string, unknown>;

export interface Template {
  $version: string;
  name: string;
  settings: {
    canvas_width: number;
    canvas_height: number;
    canvas_background_image: string;
  };
  variables: {
    [key: string]: {
      type: string;
      default: string;
    };
  };
  elements: TemplateElement[];
}

export type TemplateElement =
  | TextTemplateElement
  | ImageTemplateElement
  | ImageGeneratorTemplateElement
  | GroupedTemplateElement;

export type BaseTemplateElement = {
  id?: string;
  type: string;
  exportable?: boolean;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextTemplateElement = BaseTemplateElement & {
  type: "text";
  value: string;
  font_size: number;
  font_family: string;
  font_style: string;
  font_weight: number;
  text_align: string;
  vertical_align: string;
  color: string;
  blend_mode?: string;
};

export type ImageTemplateElement = BaseTemplateElement & {
  type: "image";
  value: string;
  blend_mode?: string;
};

export type ImageGeneratorTemplateElement = BaseTemplateElement & {
  type: "image_generator";
  value: ImageGeneratorValue;
  generator: string;
  placeholder?: string;
  blend_mode?: string;
};

export type GroupedTemplateElement = BaseTemplateElement & {
  type: "group";
  value: never;
  children: TemplateElement[];
};

export const editableElementTypes: Record<string, boolean> = {
  image_generator: true,
  text: true,
};
