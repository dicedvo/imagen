import { IRegistry } from "@/core/registries";
import { AssetURIHandler } from "@/core/template/assets";
import { loadAsyncImage } from "@/core/template/konva-helpers";
import URIHandler from "@/core/uri_handler";
import { useUriHandlersStore } from "@/stores/registry_store";
import Konva from "konva";
import { ClassAttributes } from "react";
import { Image as KImage, KonvaNodeEvents } from "react-konva";
import useSWR from "swr";
import { isPromise } from "is-actual-promise";

async function _resolveUri(
  uriRegistry: IRegistry<URIHandler>,
  rawSrc: string,
): Promise<string> {
  const handler = AssetURIHandler.test(rawSrc)
    ? AssetURIHandler
    : (uriRegistry?.find((h) => h.test(rawSrc)) ?? null);

  if (!handler)
    throw new Error(`No asset locator handler found for uri "${rawSrc}"`);

  return handler.transform(rawSrc);
}

export default function KRemoteImage(
  props: Konva.ShapeConfig &
    KonvaNodeEvents &
    ClassAttributes<Konva.Image> & {
      src: string | Promise<string | Blob>;
    },
) {
  const uriRegistry = useUriHandlersStore();
  const { data: img } = useSWR(
    ["KRemoteImage", props.src],
    async ([_, src]) => {
      const finalSrc = isPromise(src) ? src : _resolveUri(uriRegistry, src);
      return loadAsyncImage(finalSrc, () => {});
    },
    {
      fallbackData: new Image(),
    },
  );

  return <KImage {...props} image={img} />;
}
