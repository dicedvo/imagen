import {
  editableElementTypes,
  Template,
  TemplateInstanceValues,
} from "@/core/template/types";
import { Liquid, Tokenizer, Token, TokenKind } from "liquidjs";
import { IRegistry } from "@/core/registries";
import ImageGenerator from "@/core/image_generator";
import { DataRecord } from "../data";

const engine = new Liquid();

function getKind(val: Token) {
  return val ? val.kind : -1;
}

export function isTextDynamic(text: string): boolean {
  try {
    const tok = new Tokenizer(text);
    const tokens = tok.readTopLevelTokens();
    for (const token of tokens) {
      if (getKind(token) !== TokenKind.HTML) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

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

export function valuesFromTemplate(
  template: Template,
  imageGenerators: IRegistry<ImageGenerator>,
) {
  const data = template.elements
    .filter((te) => editableElementTypes[te.type] || te.type === "group")
    .reduce<TemplateInstanceValues>((pv, cv, idx) => {
      const key = cv.id ?? cv.name ?? `field_${idx}`;
      if (cv.type === "image_generator") {
        const generator = imageGenerators.get(cv.generator);
        pv[key] = {
          ...(typeof cv.value === "object"
            ? cv.value
            : (generator?.defaultOptions() ?? {})),
          outputUri: "",
        };
      } else if (cv.type === "group") {
        pv[key] = valuesFromTemplate(
          {
            ...template,
            elements: cv.children,
          },
          imageGenerators,
        );
      } else {
        pv[key] = cv.value;
      }
      return pv;
    }, {});
  return data;
}

export function compileDataRecordForTemplate(
  record: DataRecord,
  template: Template,
) {
  if (!record.templateValues[template.name]) {
    return null;
  }

  return compileTemplateValues(
    record.templateValues[template.name],
    record.data,
  );
}
