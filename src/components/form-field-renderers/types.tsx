import { Field } from "@/schemas/FieldSchema";
import { ControllerRenderProps, FieldValues } from "react-hook-form";

export type FormFieldRendererProps<T extends FieldValues = FieldValues> = {
    field: Field;
} & Omit<ControllerRenderProps<T>, "ref">;