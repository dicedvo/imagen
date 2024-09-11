import { Template, TemplateInstanceValues } from "@/core/template/types";
import TemplateRenderer from "@/core/template/renderer";
import { valuesFromTemplate } from "@/helpers/template";
import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Stage as KStage, Layer as KLayer, Rect as KRect } from "react-konva";
import { useUriHandlersStore } from "@/stores/registry_store";

const SCALE_PADDING = 0.05;

export default function Preview({
  template,
  values,
}: {
  className?: string;
  template?: Template | null;
  values: TemplateInstanceValues | null;
}) {
  const uriHandlerStore = useUriHandlersStore();

  const [renderState, setRenderState] = useState<
    "unloaded" | "loading" | "done"
  >("unloaded");
  const size = useMemo(
    () => ({
      width: template?.settings.canvas_width ?? 0,
      height: template?.settings.canvas_height ?? 0,
    }),
    [template],
  );
  const [templateRenderer, setTemplateRenderer] = useState(
    new TemplateRenderer(),
  );

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const stage = useRef<Konva.Stage | null>(null);
  const [scale, setScale] = useState(1);
  const previewLayer = stage.current?.findOne<Konva.Layer>("#preview");
  const positions = useMemo(() => {
    return {
      x:
        size.width !== 0
          ? (containerSize.width - size.width * scale) / 2
          : containerSize.width / 2,
      y:
        containerSize.width / 2
          ? (containerSize.height - size.height * scale) / 2
          : containerSize.height * (SCALE_PADDING / 2),
    };
  }, [scale, size, containerSize]);

  const handleResize = () => {
    if (!stage.current) return;

    const parent = stage.current?.container().parentElement!.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    setContainerSize({ width, height });
    resizeScale();
  };

  const resizeScale = () => {
    if (!stage.current) return;
    const scale =
      Math.min(
        stage.current.width() / size.width,
        stage.current.height() / size.height,
      ) *
      (1 - SCALE_PADDING);
    if (isNaN(scale)) return;
    setScale(scale);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [size]);

  // useEffect(() => {
  //   console.log(values);
  // }, [values]);

  useEffect(() => {
    if (!previewLayer || !template) return;

    if (!templateRenderer.layer || !templateRenderer.uriRegistry) {
      setTemplateRenderer(new TemplateRenderer(previewLayer, uriHandlerStore));
    }

    if (!templateRenderer.layer) return;

    console.log("rendering...");
    setRenderState("loading");
    templateRenderer.render(template, values ?? valuesFromTemplate(template));
    resizeScale();
    setRenderState("done");
  }, [template, templateRenderer, uriHandlerStore, values]);

  useEffect(() => {
    console.log("renderState", renderState);
  }, [renderState]);

  return (
    <div className="relative">
      {renderState === "loading" && (
        <div
          className="z-50 bg-white/80 absolute top-0 left-0 flex items-center justify-center"
          style={{ width: containerSize.width, height: containerSize.height }}
        >
          <p>Rendering...</p>
        </div>
      )}

      <KStage
        ref={stage}
        className="relative"
        scale={{ x: scale, y: scale }}
        width={containerSize.width}
        height={containerSize.height}
        x={isNaN(positions.x) ? 0 : positions.x}
        y={isNaN(positions.y) ? 0 : positions.y}
      >
        <KLayer>
          <KRect
            listening={false}
            width={size.width}
            height={size.height}
            shadowBlur={20}
            shadowEnabled
            shadowOpacity={0.15}
            shadowColor="black"
            fill="white"
          />
        </KLayer>

        <KLayer id="preview"></KLayer>
      </KStage>
    </div>
  );
}
