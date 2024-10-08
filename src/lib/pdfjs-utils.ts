import { OPS } from "pdfjs-dist";

export function opsToString(ops: number) {
  switch (ops) {
    case OPS.dependency: return "dependency";
    case OPS.setLineWidth: return "setLineWidth";
    case OPS.setLineCap: return "setLineCap";
    case OPS.setLineJoin: return "setLineJoin";
    case OPS.setMiterLimit: return "setMiterLimit";
    case OPS.setDash: return "setDash";
    case OPS.setRenderingIntent: return "setRenderingIntent";
    case OPS.setFlatness: return "setFlatness";
    case OPS.setGState: return "setGState";
    case OPS.save: return "save";
    case OPS.restore: return "restore";
    case OPS.transform: return "transform";
    case OPS.moveTo: return "moveTo";
    case OPS.lineTo: return "lineTo";
    case OPS.curveTo: return "curveTo";
    case OPS.curveTo2: return "curveTo2";
    case OPS.curveTo3: return "curveTo3";
    case OPS.closePath: return "closePath";
    case OPS.rectangle: return "rectangle";
    case OPS.stroke: return "stroke";
    case OPS.closeStroke: return "closeStroke";
    case OPS.fill: return "fill";
    case OPS.eoFill: return "eoFill";
    case OPS.fillStroke: return "fillStroke";
    case OPS.eoFillStroke: return "eoFillStroke";
    case OPS.closeFillStroke: return "closeFillStroke";
    case OPS.closeEOFillStroke: return "closeEOFillStroke";
    case OPS.endPath: return "endPath";
    case OPS.clip: return "clip";
    case OPS.eoClip: return "eoClip";
    case OPS.beginText: return "beginText";
    case OPS.endText: return "endText";
    case OPS.setCharSpacing: return "setCharSpacing";
    case OPS.setWordSpacing: return "setWordSpacing";
    case OPS.setHScale: return "setHScale";
    case OPS.setLeading: return "setLeading";
    case OPS.setFont: return "setFont";
    case OPS.setTextRenderingMode: return "setTextRenderingMode";
    case OPS.setTextRise: return "setTextRise";
    case OPS.moveText: return "moveText";
    case OPS.setLeadingMoveText: return "setLeadingMoveText";
    case OPS.nextLine: return "nextLine";
    case OPS.showText: return "showText";
    case OPS.showSpacedText: return "showSpacedText";
    case OPS.nextLineShowText: return "nextLineShowText";
    case OPS.nextLineSetSpacingShowText: return "nextLineSetSpacingShowText";
    case OPS.setCharWidth: return "setCharWidth";
    case OPS.setCharWidthAndBounds: return "setCharWidthAndBounds";
    case OPS.setStrokeColorSpace: return "setStrokeColorSpace";
    case OPS.setFillColorSpace: return "setFillColorSpace";
    case OPS.setStrokeColor: return "setStrokeColor";
    case OPS.setStrokeColorN: return "setStrokeColorN";
    case OPS.setFillColor: return "setFillColor";
    case OPS.setFillColorN: return "setFillColorN";
    case OPS.setStrokeGray: return "setStrokeGray";
    case OPS.setFillGray: return "setFillGray";
    case OPS.setStrokeRGBColor: return "setStrokeRGBColor";
    case OPS.setFillRGBColor: return "setFillRGBColor";
    case OPS.setStrokeCMYKColor: return "setStrokeCMYKColor";
    case OPS.setFillCMYKColor: return "setFillCMYKColor";
    case OPS.shadingFill: return "shadingFill";
    case OPS.beginInlineImage: return "beginInlineImage";
    case OPS.beginImageData: return "beginImageData";
    case OPS.paintXObject: return "paintXObject";
    case OPS.markPoint: return "markPoint";
    case OPS.markPointProps: return "markPointProps";
    case OPS.beginMarkedContent: return "beginMarkedContent";
    case OPS.beginMarkedContentProps: return "beginMarkedContentProps";
    case OPS.endMarkedContent: return "endMarkedContent";
    case OPS.beginCompat: return "beginCompat";
    case OPS.endCompat: return "endCompat";
    case OPS.paintFormXObjectBegin: return "paintFormXObjectBegin";
    case OPS.paintFormXObjectEnd: return "paintFormXObjectEnd";
    case OPS.beginGroup: return "beginGroup";
    case OPS.endGroup: return "endGroup";
    case OPS.beginAnnotation: return "beginAnnotation";
    case OPS.endAnnotation: return "endAnnotation";
    case OPS.paintImageMaskXObject: return "paintImageMaskXObject";
    case OPS.paintImageMaskXObjectGroup: return "paintImageMaskXObjectGroup";
    case OPS.paintImageXObject: return "paintImageXObject";
    case OPS.paintInlineImageXObject: return "paintInlineImageXObject";
    case OPS.paintInlineImageXObjectGroup: return "paintInlineImageXObjectGroup";
    case OPS.paintImageXObjectRepeat: return "paintImageXObjectRepeat";
    case OPS.paintImageMaskXObjectRepeat: return "paintImageMaskXObjectRepeat";
    case OPS.paintSolidColorImageMask: return "paintSolidColorImageMask";
    case OPS.constructPath: return "constructPath";
  }
}