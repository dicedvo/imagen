import { useEffect, useState } from "react";
import FileUploadDialog from "./FileUploadDialog";
import emitter from "@/lib/event-bus";
import TemplateFileParser from "@/core/template/parser";
import { Template } from "@/core/template/types";

export default function TemplateImportDialog({
  onUpload,
}: {
  onUpload: (template: Template) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleOpenImporter = ({ id }: { id: string }) => {
    setOpen(id === "template-import");
  };

  useEffect(() => {
    emitter.on("openImporter", handleOpenImporter);
    return () => {
      emitter.off("openImporter", handleOpenImporter);
    };
  }, []);

  return (
    <FileUploadDialog
      open={open}
      maxFiles={1}
      onOpenChange={setOpen}
      title="Import Template"
      accept={{
        "application/x-dice-template": [".dicetemplate"],
      }}
      onUpload={(files) => {
        if (files.length === 0) return;
        const templateParser = new TemplateFileParser();
        templateParser.parse(files[0]).then((template) => {
          onUpload(template);
          setOpen(false);
        });
      }}
    />
  );
}
