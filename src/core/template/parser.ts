import JSZip from "jszip";
import fs from "./fs";
import { Template, TemplateElement } from "./types";

const excludeDirectories = [/^__MACOSX/, /^\.DS_Store/];

export default class TemplateFileParser {
  async parse(templateDataOrUrl: string | Blob): Promise<Template> {
    if (typeof templateDataOrUrl === "string") {
      const fetchedTemplateData =
        await this._fetchTemplateData(templateDataOrUrl);
      return this.parse(fetchedTemplateData);
    }

    // Clear
    fs.rm("*");

    const tZip = await JSZip.loadAsync(templateDataOrUrl);
    const rawTemplateFile = tZip.file("template.json");

    if (!rawTemplateFile) {
      throw new Error("No template.json found in template file");
    }

    const rawTemplate = await rawTemplateFile.async("text");
    const templateData = JSON.parse(rawTemplate) as Template;

    // Make sure that all elements have an id
    const mapTemplateEl = (
      element: TemplateElement,
      elementIdx: number,
    ): TemplateElement => {
      if (element.type === "group") {
        return {
          ...element,
          id: element.id || `element_${elementIdx}`,
          children: element.children.map(mapTemplateEl),
        };
      }

      return {
        ...element,
        id: element.id || `element_${elementIdx}`,
      };
    };

    const elementsWithId = templateData.elements.map(mapTemplateEl);

    // Load all assets
    const assetFiles = await Promise.all(
      Object.entries(tZip.files)
        .filter(([filename]) => filename.startsWith("assets/"))
        .map(
          ([initialFilename, file]) =>
            [initialFilename.substring("assets/".length), file] as const,
        )
        .filter(
          ([filename]) =>
            filename.length !== 0 &&
            excludeDirectories.every((regex) => !regex.test(filename)),
        )
        .map(async ([initialFilename, file]) => {
          const filename = initialFilename.replace(/^assets\//, "");
          const data = await file.async("blob");
          return { filename, data };
        }),
    );

    assetFiles.forEach((asset) => {
      fs.writeFile(asset.filename, asset.data);
    });

    return {
      ...templateData,
      elements: elementsWithId,
    };
  }

  async _fetchTemplateData(url: string): Promise<Blob> {
    const response = await fetch(url);
    return response.blob();
  }
}
