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
