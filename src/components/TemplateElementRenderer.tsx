import { ControllerRenderProps, FieldValues } from "react-hook-form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import ImageGeneratorSettingsModal from "./ImageGeneratorSettingsModal";
import { TemplateElement } from "@/core/template/types";
import AssetLibraryDialog from "./AssetLibraryDialog";

export default function TemplateElementFieldRenderer<
  T extends FieldValues = FieldValues,
>({
  element,
  ...props
}: {
  element: TemplateElement;
} & ControllerRenderProps<T>) {
  if (element.type === "image") {
    return (
      <AssetLibraryDialog
        value={Array.isArray(props.value) ? props.value : []}
        onSelectURI={(assets) => {
          if (assets.length === 0) return;
          props.onChange(assets[0]);
        }}
      >
        <Button>Choose Image</Button>
      </AssetLibraryDialog>
    );
  }

  if (element.type === "image_generator") {
    return (
      <ImageGeneratorSettingsModal
        generator={element.generator as string}
        element={element}
        value={props.value}
        onChange={(value) => {
          props.onChange(value);
        }}
      >
        <Button className="block w-full">Generate</Button>
      </ImageGeneratorSettingsModal>
    );
  }

  return <Input type="text" {...props} />;
}
