import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { pixels } from "@pacote/pixels";
import {
  constructLayoutInfo,
  ExportItem,
  generatePrintReadyExports,
} from "@/core/template/export";

const SCALE_PADDING = 0.1;
const DEFAULT_SCALE = 1 - SCALE_PADDING;
const PRINT_PPI = 300;
const DEFAULT_PPI = 96;
export const PRINT_SCALING_FACTOR = PRINT_PPI / DEFAULT_PPI;

export default function PrintPreviewer({
  className,
  paperSize: _paperSize, // in mm!
  margin, // in number, margin is measured in inches
  exports,
  spacing: _spacing = 0, // in number, spacing is measured in inches
  scale: _imageScale = 1,
  showOutline = false,
  onGenerateExports,
}: {
  className?: string;
  paperSize: { width: number; height: number };
  margin: {
    top: number | string;
    bottom: number | string;
    left: number | string;
    right: number | string;
  };
  spacing?: number;
  exports: ExportItem[];
  scale?: number;
  showOutline?: boolean;
  onGenerateExports?: (exports: ExportItem[]) => void;
}) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [printReadyExports, setPrintReadyExports] = useState<ExportItem[]>([]);
  const innerContainer = useRef<HTMLDivElement | null>(null);

  const paperSize = useMemo(() => {
    // convert mm to px (in 300ppi)
    return {
      width: pixels(`${_paperSize.width}mm`) * PRINT_SCALING_FACTOR,
      height: pixels(`${_paperSize.height}mm`) * PRINT_SCALING_FACTOR,
    };
  }, [_paperSize]);

  const spacing = useMemo(() => pixels(`${_spacing}in`), [_spacing]);

  const normalizedMargin = useMemo(() => {
    return {
      top:
        pixels(
          typeof margin.top === "string" ? margin.top : `${margin.top}in`,
        ) * PRINT_SCALING_FACTOR,
      bottom:
        pixels(
          typeof margin.bottom === "string"
            ? margin.bottom
            : `${margin.bottom}in`,
        ) * PRINT_SCALING_FACTOR,
      left:
        pixels(
          typeof margin.left === "string" ? margin.left : `${margin.left}in`,
        ) * PRINT_SCALING_FACTOR,
      right:
        pixels(
          typeof margin.right === "string" ? margin.right : `${margin.right}in`,
        ) * PRINT_SCALING_FACTOR,
    };
  }, [margin]);

  const layoutInfo = useMemo(() => {
    return constructLayoutInfo(exports, paperSize, spacing, _imageScale);
  }, [exports, paperSize, spacing, _imageScale]);

  const handleResize = () => {
    if (!innerContainer.current) return;

    const parent = innerContainer.current.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    setContainerSize({ width, height });
  };

  useEffect(() => {
    setTimeout(() => {
      handleResize();
    }, 200); // it takes 200ms to recompute the full width 💀
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [paperSize]);

  useEffect(() => {
    const { width, height } = containerSize;
    const scale =
      Math.min(width / paperSize.width, height / paperSize.height) *
      DEFAULT_SCALE;

    // console.log(containerSize, paperSize, scale);
    if (!Number.isFinite(scale)) return;
    setScale(scale);
  }, [containerSize, paperSize]);

  useEffect(() => {
    generatePrintReadyExports({
      exports,
      showOutline,
      scale: _imageScale,
      paperSize,
      margin: normalizedMargin,
      spacing,
    }).then(setPrintReadyExports);
  }, [exports, showOutline, _imageScale, paperSize, normalizedMargin, spacing]);

  useEffect(() => {
    if (onGenerateExports) {
      onGenerateExports(printReadyExports);
    }
  }, [printReadyExports]);

  return (
    <div
      ref={innerContainer}
      className={cn(
        className,
        "mx-auto h-full w-full flex flex-col items-center py-8 space-y-4",
      )}
    >
      {[...Array(layoutInfo.pages).keys()].map((page) => (
        <div
          key={`page_${page}`}
          className="bg-white relative shadow-lg"
          style={{
            width: `${paperSize.width * scale}px`,
            height: `${paperSize.height * scale}px`,
          }}
        >
          {printReadyExports[page] && (
            <img
              style={{
                position: "relative",
                left: `${normalizedMargin.left * scale}px`,
                top: `${normalizedMargin.top * scale}px`,
                height: "auto",
                width: "100%",
              }}
              src={URL.createObjectURL(printReadyExports[page].content)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
