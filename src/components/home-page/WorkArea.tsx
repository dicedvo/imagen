import Preview from "@/components/Preview";
import TemplateEditor from "@/components/TemplateEditor";
import TemplateImportDialog from "@/components/TemplateImportDialog";
import { Button } from "@/components/ui/button";
import {
  compileDataRecordForTemplate,
  compileTemplateValues,
  valuesFromTemplate,
} from "@/core/template/values";
import useDataStore from "@/stores/data_store";
import { useImageGeneratorsStore } from "@/stores/registry_store";
import useTemplateStore from "@/stores/template_store";
import { UploadIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export default function WorkArea() {
  const [isTemplateImportOpen, setTemplateImportOpen] = useState(false);
  const [template, setTemplate] = useTemplateStore(
    useShallow((state) => [state.template, state.setTemplate]),
  );

  const imageGenerators = useImageGeneratorsStore();
  const currentRecord = useDataStore(
    useShallow((state) => state.currentRecord()),
  );
  const updateRecord = useDataStore(useShallow((state) => state.updateRecord));

  const previewTemplateInstanceValues = useMemo(() => {
    if (!template || !currentRecord || !currentRecord.id) {
      return {};
    }

    return (
      compileDataRecordForTemplate(currentRecord, template) ??
      compileTemplateValues(
        valuesFromTemplate(template, imageGenerators),
        currentRecord.data,
      )
    );
  }, [template, imageGenerators, currentRecord]);

  useEffect(() => {
    console.log(previewTemplateInstanceValues);
  }, [previewTemplateInstanceValues]);

  return (
    <>
      <div className="h-full w-full">
        {/* canvas area */}
        <div className="bg-slate-200 w-full h-1/2">
          <Preview
            className="shadow"
            template={template}
            values={previewTemplateInstanceValues}
          />
        </div>

        {/* control options */}
        <div className="bg-white border-t h-1/2 flex flex-col">
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="font-semibold text-sm">Editor</p>

            <div className="space-x flex items-center">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTemplateImportOpen(true)}
              >
                <UploadIcon className="mr-2" />
                <span>Import Template</span>
              </Button>
            </div>
          </div>

          <div className="px-4 text-sm flex-1">
            <TemplateEditor
              template={template}
              values={
                template && currentRecord
                  ? (currentRecord.templateValues[template.name] ??
                    valuesFromTemplate(template, imageGenerators))
                  : {}
              }
              onChange={(newValues) => {
                if (!template || !currentRecord || !currentRecord.id) return;
                updateRecord({
                  ...currentRecord,
                  templateValues: {
                    ...currentRecord.templateValues,
                    [template.name]: newValues,
                  },
                });
              }}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>

      {/* template import dialog */}
      <TemplateImportDialog
        open={isTemplateImportOpen}
        onOpenChange={setTemplateImportOpen}
        onUpload={setTemplate}
      />
    </>
  );
}
