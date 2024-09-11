import mitt from "mitt";
import FontFaceObserver from "fontfaceobserver";

type FontEvent = {
  onFontLoaded: { fontName: string; fontStyle: string; fontWeight: number };
};

export const emitter = mitt<FontEvent>();

interface FontCacheState {
  name: string;
  // Variant key examples: "500", "400-italic"
  variants: Record<string, boolean>;
}

// a map of font names to their cache state
const fontCache: Record<string, FontCacheState> = {};

// const observers = new Map<string, FontFaceObserver>();

// Using the Canvas API to check if a font is available
// instead of document.fonts.check() because it's weird.
function isFontAvailable(
  fontName: string,
  fontStyle: string,
  fontWeight: number,
) {
  if (fontCache[fontName]) {
    const { variants } = fontCache[fontName];
    const variantKey = `${fontWeight}${isItalic(fontStyle) ? "-italic" : ""}`;
    if (variants[variantKey]) {
      return true;
    }
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return false;

  const text = "abcdefghijklmnopqrstuvwxyz0123456789";
  const _isItalic = isItalic(fontStyle);

  context.font = [
    _isItalic ? "italic" : "",
    fontWeight !== 400 ? `${fontWeight}` : "",
    "72px",
    "monospace",
  ]
    .filter(Boolean)
    .join(" ");
  const baselineWidth = context.measureText(text).width;

  // console.log("baseline", context.font, baselineWidth);

  context.font = [
    _isItalic ? "italic" : "",
    fontWeight !== 400 ? `${fontWeight}` : "",
    "72px",
    `${fontName}, monospace`,
  ]
    .filter(Boolean)
    .join(" ");
  const newWidth = context.measureText(text).width;

  // console.log("new", context.font, newWidth);
  return newWidth !== baselineWidth;
}

function constructGoogleFontURL(
  fontName: string,
  fontStyle: string,
  fontWeight: number,
) {
  let base = "https://fonts.googleapis.com/css?family=";
  base += fontName.replace(/ /g, "+");
  base += `:${fontWeight}`;

  if (isItalic(fontStyle)) {
    base += "italic";
  }

  return base;
}

export async function loadFont(
  fontName: string,
  fontStyle: string,
  fontWeight: number,
) {
  if (isFontAvailable(fontName, fontStyle, fontWeight)) {
    return;
  }

  // If the font is not available, load it using Google Fonts API
  const link = document.createElement("link");
  link.href = constructGoogleFontURL(fontName, fontStyle, fontWeight);
  link.rel = "stylesheet";
  document.head.appendChild(link);

  const observer = new FontFaceObserver(fontName, {
    style: isItalic(fontStyle) ? "italic" : "",
    weight: fontWeight.toString(),
  });

  if (!fontCache[fontName]) {
    fontCache[fontName] = {
      name: fontName,
      variants: {},
    };
  }

  const fontVariantKey = `${fontWeight}${isItalic(fontStyle) ? "-italic" : ""}`;
  fontCache[fontName].variants[fontVariantKey] = false;

  try {
    await observer.load();
    fontCache[fontName].variants[fontVariantKey] = true;
    emitter.emit("onFontLoaded", { fontName, fontStyle, fontWeight });
  } catch (error) {
    console.error(
      "Failed to load font",
      fontName,
      fontStyle,
      fontWeight,
      error,
    );
  }
}

export function isItalic(fontStyle: string): boolean {
  const lowFStyle = fontStyle.toLowerCase();
  return lowFStyle === "italic" || lowFStyle.includes("italic");
}
