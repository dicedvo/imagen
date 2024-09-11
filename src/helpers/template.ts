import { Template, TemplateInstanceValues } from "@/core/template/types";
import { useImageGeneratorsStore } from "@/stores/registry_store";
import { Liquid } from "liquidjs";

const engine = new Liquid();

export function renderTemplateText(
  text: string,
  data: Record<string, unknown>,
): string {
  return engine.parseAndRenderSync(text, data);
}

export function compileTemplateValues(
  values: TemplateInstanceValues,
  data: Record<string, unknown>,
): TemplateInstanceValues {
  const compiledValues: TemplateInstanceValues = {};

  for (const key in values) {
    try {
      if (typeof values[key] === "object") {
        compiledValues[key] = compileTemplateValues(
          values[key] as TemplateInstanceValues,
          data,
        );
      } else {
        compiledValues[key] = renderTemplateText(values[key] as string, data);
      }
    } catch (e) {
      console.error(e);
      compiledValues[key] = values[key];
    }
  }

  return compiledValues;
}

export const editableElementTypes: Record<string, boolean> = {
  image_generator: true,
  text: true,
};

export function valuesFromTemplate(template: Template) {
  const data = template.elements
    .filter((te) => editableElementTypes[te.type] || te.type === "group")
    .reduce<TemplateInstanceValues>((pv, cv, idx) => {
      const key = cv.id ?? cv.name ?? `field_${idx}`;
      if (cv.type === "image_generator") {
        const generator = useImageGeneratorsStore
          .getState()
          .get(cv.generator as string);
        pv[key] = {
          ...(cv.value ?? generator?.defaultOptions() ?? {}),
          outputUri: "",
        };
      } else if (cv.type === "group") {
        pv[key] = valuesFromTemplate({
          ...template,
          elements: cv.children,
        });
      } else {
        pv[key] = cv.value;
      }
      return pv;
    }, {});
  return data;
}
