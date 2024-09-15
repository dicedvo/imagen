import { Plugin } from "@/core/plugin_system";
import { Encoder, Byte, Encoded } from "@nuintun/qrcode";
import QRCodeGeneratorSettings from "./QRCodeGeneratorSettings";

const qrEncoder = new Encoder();

function setPixel(
  imageData: ImageData,
  pixelData: {
    s: number;
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    a: number;
  },
) {
  // write pixels based on provided width (w) and height (h)
  for (let wi = 0; wi < pixelData.s; wi++) {
    for (let hi = 0; hi < pixelData.s; hi++) {
      const index =
        (pixelData.x + wi + (pixelData.y + hi) * imageData.width) * 4;
      imageData.data[index + 0] = pixelData.r;
      imageData.data[index + 1] = pixelData.g;
      imageData.data[index + 2] = pixelData.b;
      imageData.data[index + 3] = pixelData.a;
    }
  }
}

async function _encodePng(matrix: Encoded, qrSize: number) {
  const margin = 4;

  // create a canvas image that generates the QR and outputs it as a PNG blob
  const qrCanvas = document.createElement("canvas");
  qrCanvas.width = qrSize;
  qrCanvas.height = qrSize;

  const qrCtx = qrCanvas.getContext("2d");
  if (!qrCtx) {
    throw new Error("Could not get 2d context for canvas");
  }

  const size = matrix.size;
  const marginTimes2 = margin > 0 ? margin * 2 : margin;
  let qrSizeMinusMargin = qrSize - marginTimes2;
  if (qrSizeMinusMargin % 4 !== 0) {
    // make sure the size is divisible by 4
    qrSizeMinusMargin += 4 - (qrSizeMinusMargin % 4);
  }

  const qrImageData = qrCtx.createImageData(qrSize, qrSize);

  // draw the QR code
  const blockWidth = (qrSize / size) | 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = matrix.get(x, y);
      if (value) {
        setPixel(qrImageData, {
          s: blockWidth,
          x: x * blockWidth,
          y: y * blockWidth,
          r: 0 | 0,
          g: 0 | 0,
          b: (0 * 256) | 0,
          a: 255, // 255 opaque
        });
      }
    }
  }

  // Resize image data
  qrCtx.putImageData(qrImageData, 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = qrSize;
  canvas.height = qrSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2d context for canvas");
  }

  // draw a white background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, qrSize, qrSize);

  // draw the QR code on the canvas
  ctx.drawImage(
    qrCanvas,
    blockWidth - margin / 2,
    blockWidth - margin / 2,
    qrSizeMinusMargin,
    qrSizeMinusMargin,
  );
  return canvas.toDataURL("image/jpeg");
}

const qrCodePlugin: Plugin = {
  meta: {
    id: "qr_code",
    publisher: "imagen",
    version: "0.0.1",
    description: "Plugin for generating QR code images.",
    name: "QR Code",
    author: {
      name: "Ned Palacios",
    },
  },
  activate(ctx) {
    ctx.registerImageGenerator({
      id: "qr_code",
      generate: async ({ options: opts, element }) => {
        const text = opts["text"] as string;
        const size = element.width;
        const encoded = qrEncoder.encode(new Byte(text));
        return _encodePng(encoded, size);
      },
      defaultOptions: () => {
        return {
          text: "qr code",
        };
      },
      Component: QRCodeGeneratorSettings,
    });
  },
};

export default qrCodePlugin;
