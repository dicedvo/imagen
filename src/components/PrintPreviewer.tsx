import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Stage as KStage, Layer as KLayer, Text as KText } from "react-konva";

const SCALE_PADDING = 0.05;

export default function PrintPreviewer({
  className,
}: {
  className?: string;
  paperSize: { width: number; height: number };
}) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const stage = useRef<Konva.Stage | null>(null);

  const handleResize = () => {
    if (!stage.current) return;

    const parent = stage.current?.container().parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    setContainerSize({ width, height });
    resizeScale();
  };

  const size = useMemo(
    () => ({
      width: 0,
      height: 0,
    }),
    [],
  );

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

  return (
    <div className="shadow bg-white">
      <KStage
        ref={stage}
        className={className}
        scale={{ x: scale, y: scale }}
        width={containerSize.width}
        height={containerSize.height}
      >
        <KLayer>
          <KText
            text="Hello World!"
            fontSize={30}
            x={positions.x}
            y={positions.y}
          />
        </KLayer>
      </KStage>
    </div>
  );
}
