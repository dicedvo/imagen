import Konva from "konva";

/**
 * Returns an array of all non-whitespace character "tokens" / "chunks" / words
 * @param {string} text The source text
 * @returns {string[]} Non whitespace tokens in string
 */
export function getTokensInString(text: string): string[] {
  if (typeof text === "string") {
    const result = [];
    const tokens = text.split(" ");
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].length > 0) {
        result.push(tokens[i]);
      }
    }
    return result;
  }
  return [];
}

/**
 * Detect whether Konva.Text rendered any words that were broken across lines
 *
 * @param {string[]} sourceTokens An array of string tokens from original text passed to Konva.Text()
 * @param {Object[]} renderLines The contents of Konva.Text.textArr
 */
export function hasBrokenWords(
  sourceTokens: string[],
  renderLines: Konva.Text["textArr"],
) {
  let combined = "";
  for (let i = 0; i < renderLines.length; i++) {
    combined += (i === 0 ? "" : " ") + renderLines[i].text;
  }

  const a = sourceTokens;
  const b = getTokensInString(combined);

  if (a.length !== b.length) {
    return true;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return true;
    }
  }

  return false;
}

export function autoFitText(textElement: Konva.Text) {
  const sourceTokens = getTokensInString(textElement.text());
  const boxHeight = textElement.parent?.height() || 0;

  for (
    let brokenWords = hasBrokenWords(sourceTokens, textElement.textArr);
    brokenWords && textElement.height() < boxHeight;
    brokenWords = hasBrokenWords(sourceTokens, textElement.textArr)
  ) {
    // TODO: add setting in element that determines if text should be resized
    // or the text element should be resized
    textElement.height(textElement.height() + 1);
  }
}

const crossOriginImageCache = new Map<string, string>();

export async function loadAsyncImage(
  promise: Promise<string | Blob>,
  onload: (el: HTMLImageElement) => void,
): Promise<HTMLImageElement> {
  const src = await promise;
  let shouldDownloadImage = false;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (shouldDownloadImage) {
        try {
          if (typeof src !== "string") {
            throw new Error("Should not happen. src is not a string");
          }

          const imgCanvas = document.createElement("canvas");
          const imgCanvasCtx = imgCanvas.getContext("2d");
          if (!imgCanvasCtx) {
            throw new Error("Failed to create canvas 2d context");
          }

          imgCanvas.width = img.width;
          imgCanvas.height = img.height;
          imgCanvasCtx.drawImage(img, 0, 0);

          const dataUrl = imgCanvas.toDataURL("image/png");
          shouldDownloadImage = false;

          crossOriginImageCache.set(src, dataUrl);
          img.src = dataUrl;
        } catch (e) {
          if (typeof src === "string") {
            reject(e);
          } else {
            resolve(img);
            onload(img);
          }
        }
      } else {
        resolve(img);
        onload(img);
      }
    };

    img.onerror = reject;

    // Determine if image is from a foreign origin
    // If it is, we need to set the crossorigin attribute
    if (typeof src === "string") {
      const url = new URL(src);
      if (
        ["blob:", "data:"].every((prefix) => url.protocol !== prefix) &&
        url.origin !== window.location.origin
      ) {
        if (crossOriginImageCache.has(src)) {
          img.src = crossOriginImageCache.get(src)!;
        } else {
          // if (window.location.hostname !== "localhost") {
          console.log("Setting crossorigin attribute for image", src);
          img.crossOrigin = "anonymous";
          img.referrerPolicy = "no-referrer";
          // }
          shouldDownloadImage = true;
        }
      }
    }

    if (img.src.length === 0) {
      if (typeof src === "string") {
        img.src = src;
      } else {
        img.src = URL.createObjectURL(src);
      }
    }
  });
}
