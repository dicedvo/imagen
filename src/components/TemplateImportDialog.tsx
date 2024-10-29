import FileUploadDialog from "./FileUploadDialog";
import TemplateFileParser from "@/core/template/parser";
import { Template } from "@/core/template/types";

export default function TemplateImportDialog({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (template: Template) => void;
}) {
  return (
    <FileUploadDialog
      open={open}
      maxFiles={1}
      onOpenChange={onOpenChange}
      title="Import Template"
      accept={{
        "application/x-dice-template": [".dicetemplate"],
      }}
      onUpload={(files) => {
        if (files.length === 0) return;
        const templateParser = new TemplateFileParser();
        templateParser.parse(files[0]).then((template) => {
          onUpload(template);
          onOpenChange(false);
        });
      }}
    />
  );
}
