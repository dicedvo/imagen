import { useImageGeneratorsStore } from "@/stores/registry_store";
import Konva from "konva";
import {
  FinalImageGeneratorValue,
  ImageGeneratorValue,
} from "../image_generator";
import { IRegistry } from "../registries";
import URIHandler from "../uri_handler";
import { AssetURIHandler } from "./assets";
import { emitter as fontLoadEmitter, isItalic, loadFont } from "./fonts";
import { autoFitText, loadAsyncImage } from "./konva-helpers";
import {
  editableElementTypes,
  ImageGeneratorTemplateElement,
  Template,
  TemplateElement,
  TemplateInstanceValues,
} from "./types";

// Used for deterministic hashing of template content
function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function checkLayer(layer: unknown): layer is Konva.Layer {
  if (!layer || !(layer instanceof Konva.Layer)) {
    throw new Error(
      "Stage is not set. Use setStage() to set the stage before rendering.",
    );
  }
  return true;
}

function _getTemplateId(template: Template) {
  return template.name + "_" + cyrb53(JSON.stringify(template));
}

export type RenderLayerFilter = "all" | "dynamic_only" | "static_only";

export default class TemplateRenderer {
  public layer: Konva.Layer | null = null;
  public uriRegistry: IRegistry<URIHandler> | null = null;
  public layerFilter: RenderLayerFilter = "all";
  private _shouldReset = false;

  _waitForAssetLoad = false;
  _fill: string | null = null;

  constructor(
    layer?: Konva.Layer,
    uriRegistry?: IRegistry<URIHandler>,
    private _currentTemplateId?: string | null,
  ) {
    if (uriRegistry) {
      this.uriRegistry = uriRegistry;
    }

    if (layer) {
      this.layer = layer;

      fontLoadEmitter.on("onFontLoaded", () => {
        if (!this.layer) return;
        this.layer.batchDraw();
      });
    }
  }

  setWaitForAssetLoad(wait: boolean) {
    this._waitForAssetLoad = wait;
  }

  setFill(fill: string | null) {
    this._fill = fill;
  }

  setRenderLayerFilter(newFilter: RenderLayerFilter) {
    if (newFilter === this.layerFilter) return;
    this.layerFilter = newFilter;
    this._shouldReset = true;
  }

  async _resolveUri(rawSrc: string): Promise<string> {
    const handler = AssetURIHandler.test(rawSrc)
      ? AssetURIHandler
      : (this.uriRegistry?.find((h) => h.test(rawSrc)) ?? null);

    if (!handler)
      throw new Error(`No asset locator handler found for uri "${rawSrc}"`);

    return handler.transform(rawSrc);
  }

  async _loadImageAsset(
    src: string,
    onload: (el: HTMLImageElement) => void,
  ): Promise<HTMLImageElement> {
    return loadAsyncImage(this._resolveUri(src), onload);
  }

  async _loadImageAssetInShape(
    shape: Konva.Shape | undefined | null,
    assetUrl: string,
    canvasWidth: number,
    canvasHeight: number,
  ) {
    console.log(
      "Loading asset",
      assetUrl.substring(0, 90),
      "for shape",
      shape?.getAttr("id") || "unknown",
    );

    if (!shape) {
      return;
    } else if (shape.getAttr("attached_asset") === assetUrl) {
      return;
    }

    const callback = (imgBg: HTMLImageElement) => {
      shape.setAttr("attached_asset", assetUrl);
      shape.setAttr("asset_load_state", "loaded");

      if (shape instanceof Konva.Image) {
        shape.image(imgBg);
      } else {
        shape.fill("");
        shape.fillPatternImage(imgBg);

        // Resize the image to fit the canvas
        shape.fillPatternScale({
          x: canvasWidth / imgBg.width,
          y: canvasHeight / imgBg.height,
        });
      }
    };

    shape.setAttr("asset_load_state", "loading");

    if (
      (!assetUrl || typeof assetUrl == "undefined") &&
      shape.getAttr("__fallback")
    ) {
      console.log("Loading fallback asset", shape.getAttr("__fallback"));

      await this._loadImageAsset(shape.getAttr("__fallback"), callback);
      return;
    }

    await this._loadImageAsset(assetUrl, callback);
  }

  _resetCanvas(
    canvasWidth: number,
    canvasHeight: number,
    newTemplateId: string,
  ) {
    if (!checkLayer(this.layer)) return;

    // resize the layer
    this.layer.setAttrs({
      "canvas-width": canvasWidth,
      "canvas-height": canvasHeight,
    });

    this.layer.destroyChildren();
    this._currentTemplateId = newTemplateId;
  }

  async _injectValues(
    values: TemplateInstanceValues,
    layer: Konva.Layer | Konva.Group,
  ) {
    // Avoid unnecessary injection of values
    // if they are not going to be rendered
    if (this.layerFilter === "static_only") {
      return;
    }

    let needsRedraw = false;

    for (const element of layer.children) {
      if (!element.getAttr("__editable")) {
        if (!(element instanceof Konva.Group)) {
          continue;
        }
      }

      const value = values[element.id() ?? element.name() ?? ""];
      if (!value || value == "undefined") {
        continue;
      }

      if (!needsRedraw) {
        needsRedraw = true;
      }

      if (element instanceof Konva.Group) {
        await this._injectValues(value as TemplateInstanceValues, element);
      } else if (element instanceof Konva.Text) {
        if (value) {
          element.text(value as string);
        }

        const prevHeight = element.height();
        autoFitText(element);

        // move text element up
        element.y(element.y() - Math.abs(element.height() - prevHeight));
      } else if (element instanceof Konva.Image) {
        let uri = "";

        if (typeof value === "object") {
          if (
            "outputUri" in value &&
            typeof value.outputUri === "string" &&
            value.outputUri
          ) {
            uri = value.outputUri;
          } else if (element.getAttr("__element")) {
            const tElement = element.getAttr(
              "__element",
            ) as ImageGeneratorTemplateElement;
            const generator = useImageGeneratorsStore
              .getState()
              .get(tElement.generator);

            if (generator) {
              const generated = await generator.generate({
                options: value as ImageGeneratorValue,
                element: tElement,
              });
              uri =
                typeof generated === "string"
                  ? generated
                  : URL.createObjectURL(generated);
            }
          }
        }

        try {
          await this._loadImageAssetInShape(
            element,
            uri,
            element.width(),
            element.height(),
          );
        } catch (e) {
          console.error(e);

          // check if __fallback is set
          if (element.getAttr("__fallback")) {
            await this._loadImageAssetInShape(
              element,
              element.getAttr("__fallback") as string,
              element.width(),
              element.height(),
            );
          }
        }
      }
    }

    if (!needsRedraw) {
      return;
    } else if (layer instanceof Konva.Layer) {
      layer.batchDraw();
    } else {
      const parentLayer = layer.getLayer();
      if (parentLayer) {
        parentLayer.batchDraw();
      }
    }
  }

  _findLayer<T extends Konva.Shape>(
    id: string,
    fallback: T,
    parent?: Konva.Layer | Konva.Group,
  ): T {
    if (!checkLayer(this.layer)) return fallback;

    if (!parent) {
      parent = this.layer;
    }

    const layer = parent.findOne<T>(`#${id}`);
    if (!layer) {
      fallback.id(id);
      parent.add(fallback);
      return fallback;
    }

    return layer;
  }

  async waitForAssetLoad() {
    if (!this._waitForAssetLoad || !checkLayer(this.layer)) return;

    while (this._waitForAssetLoad) {
      // check for "asset_load_state" attr for all children if it's set to "loaded"
      let loaded = true;

      for (const element of this.layer.children) {
        if (typeof element.getAttr("asset_load_state") === "undefined") {
          continue;
        }

        if (element.getAttr("asset_load_state") !== "loaded") {
          loaded = false;
          break;
        }
      }

      if (loaded) {
        break;
      }

      // wait for 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async _renderElement(
    element: TemplateElement,
    parent: Konva.Layer | Konva.Group,
  ) {
    if (!checkLayer(this.layer)) return;

    if (this.layerFilter !== "all") {
      if (
        (this.layerFilter === "dynamic_only" &&
          element.type !== "group" &&
          !editableElementTypes[element.type]) ||
        (this.layerFilter === "static_only" &&
          editableElementTypes[element.type])
      ) {
        return;
      }
    }

    if (element.type === "text") {
      const textElement = this._findLayer<Konva.Text>(
        element.id!,
        new Konva.Text({
          name: element.name,
          text: element.value as string,
          fill: "black",
          fontSize: 40,
          align: "center",
          verticalAlign: "top",
        }),
        parent,
      );

      textElement.position({
        x: element.x,
        y: element.y,
      });

      textElement.size({
        width: element.width,
        height: element.height,
      });

      textElement.fontFamily(element.font_family);

      textElement.fontStyle(
        `${element.font_weight}${isItalic(element.font_style) ? " italic" : ""}`,
      );

      await loadFont(
        element.font_family,
        element.font_style,
        element.font_weight,
      );

      for (const field in element) {
        switch (field) {
          case "font_size":
            // font size exported from figma is in device-independent pixels (DIP)
            // we need to find a way to calculate the actual pixel size for this
            textElement.fontSize(element[field] as number);
            break;
          case "text_align":
            textElement.align(element[field]);
            break;
          case "vertical_align":
            textElement.verticalAlign(
              element[field] === "center" ? "middle" : element[field],
            );
            break;
          case "value":
            textElement.text(element[field]);
            textElement.setAttr("__editable", true);
            break;
          case "color":
            textElement.fill(element[field]);
            break;
          case "blend_mode":
            textElement.globalCompositeOperation(
              element[field] as Exclude<
                Konva.NodeConfig["globalCompositeOperation"],
                undefined
              >,
            );
            break;
        }
      }

      // const prevHeight = textElement.height();
      autoFitText(textElement);

      // move text element up
      // textElement.y(
      //   textElement.y() - Math.abs(textElement.height() - prevHeight),
      // );
    } else if (element.type === "image") {
      const imageElement = this._findLayer<Konva.Image>(
        element.id!,
        new Konva.Image({
          id: element.id,
          name: element.name,
          image: undefined,
          height: element.height,
          width: element.width,
        }),
        parent,
      );

      imageElement.position({
        x: element.x,
        y: element.y,
      });

      if ("blend_mode" in element) {
        imageElement.globalCompositeOperation(
          element.blend_mode as Exclude<
            Konva.NodeConfig["globalCompositeOperation"],
            undefined
          >,
        );
      }
      await this._loadImageAssetInShape(
        imageElement,
        element.value as string,
        element.width,
        element.height,
      );
    } else if (element.type === "image_generator") {
      const generator = useImageGeneratorsStore
        .getState()
        .get(element.generator as string);
      if (!generator) return;

      const imageGenLayer = this._findLayer(
        element.id!,
        new Konva.Image({
          id: element.id,
          name: element.name,
          image: undefined,
          height: element.height,
          width: element.width,
        }),
        parent,
      );

      imageGenLayer.setAttr("__element", element);

      if (typeof imageGenLayer.getAttr("__editable") === "undefined") {
        imageGenLayer.setAttr("__editable", true);
      }

      imageGenLayer.position({
        x: element.x,
        y: element.y,
      });

      if (element.placeholder) {
        imageGenLayer.setAttr("__fallback", element.placeholder as string);
      }

      try {
        let genValue: FinalImageGeneratorValue = {
          outputUri: "",
          ...generator.defaultOptions(),
        };

        if (element.value && typeof element.value === "object") {
          genValue = element.value as FinalImageGeneratorValue;
        }

        if (!genValue.outputUri) {
          const generated = await generator.generate({
            options: genValue,
            element,
          });

          genValue.outputUri =
            typeof generated === "string"
              ? generated
              : URL.createObjectURL(generated);
        }

        await this._loadImageAsset(genValue.outputUri, (img) => {
          imageGenLayer.image(img);
          imageGenLayer.scale({
            x: element.width / imageGenLayer.width(),
            y: element.height / imageGenLayer.height(),
          });
          imageGenLayer.draw();
        });
      } catch (e) {
        // Use placeholder
        if (element.placeholder) {
          await this._loadImageAsset(
            imageGenLayer.getAttr("__fallback"),
            (img) => {
              imageGenLayer.image(img);
              imageGenLayer.scale({
                x: element.width / imageGenLayer.width(),
                y: element.height / imageGenLayer.height(),
              });
              imageGenLayer.draw();
            },
          );
        }
      }
    } else if (element.type === "group") {
      let groupElement = parent.findOne<Konva.Group>(`#${element.id!}`);
      if (!groupElement) {
        groupElement = new Konva.Group({
          id: element.id,
          name: element.name,
        });

        parent.add(groupElement);
      }

      groupElement.position({
        x: element.x,
        y: element.y,
      });

      for (const child of element.children) {
        await this._renderElement(child, groupElement);
      }
    }
  }

  async render(template: Template, values: TemplateInstanceValues) {
    if (!checkLayer(this.layer)) return;

    const templateId = _getTemplateId(template);
    if (this._currentTemplateId !== templateId) {
      this._shouldReset = true;
    }

    const { canvas_width: canvasWidth, canvas_height: canvasHeight } =
      template.settings;

    if (!this._shouldReset) {
      await this._injectValues(values, this.layer);
      await this.waitForAssetLoad();
      return;
    }

    this._resetCanvas(canvasWidth, canvasHeight, templateId);

    if (this._fill) {
      // Create a Rect to fill the canvas with a color
      const fallbackBgRect = new Konva.Rect({
        width: canvasWidth,
        height: canvasHeight,
        fill: this._fill,
      });

      this.layer.add(fallbackBgRect);
      fallbackBgRect.moveToBottom();
    }

    if (template.settings.canvas_background_image) {
      const bgLayer = this._findLayer<Konva.Image>(
        "canvas-background",
        new Konva.Image({
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          image: undefined,
        }),
      );

      await this._loadImageAssetInShape(
        bgLayer,
        template.settings.canvas_background_image,
        canvasWidth,
        canvasHeight,
      );
    }

    for (const element of template.elements) {
      await this._renderElement(element, this.layer);
    }

    this._shouldReset = false;

    await this._injectValues(values, this.layer);
    await this.waitForAssetLoad();

    this.layer.batchDraw();
  }
}
