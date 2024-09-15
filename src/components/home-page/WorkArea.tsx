import InstalledPluginsDialog from "@/components/InstalledPluginsDialog";
import Preview from "@/components/Preview";
import TemplateEditor from "@/components/TemplateEditor";
import TemplateImportDialog from "@/components/TemplateImportDialog";
import { Button } from "@/components/ui/button";
import {
  compileTemplateValues,
  valuesFromTemplate,
} from "@/core/template/values";
import emitter from "@/lib/event-bus";
import useRecordsStore from "@/stores/records_store";
import { useImageGeneratorsStore } from "@/stores/registry_store";
import useTemplateStore from "@/stores/template_store";
import { PlugIcon, UploadIcon } from "lucide-react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

export default function WorkArea() {
  const [template, setTemplate] = useTemplateStore(
    useShallow((state) => [state.template, state.setTemplate]),
  );
  const templateInstanceValues = useTemplateStore(
    useShallow((state) => state.templateInstanceValues),
  );
  const [updateTemplateInstanceValue, getTemplateInstanceValues] =
    useTemplateStore(
      useShallow((state) => [
        state.updateTemplateInstanceValue,
        state.getTemplateInstanceValues,
      ]),
    );

  const currentRecord = useRecordsStore(
    useShallow((state) => state.currentRecord()),
  );

  const imageGenerators = useImageGeneratorsStore();

  const editableTemplateInstanceValues = useMemo(() => {
    if (!template) {
      return null;
    } else if (currentRecord && currentRecord.__id) {
      const gotValues = getTemplateInstanceValues(
        template.name,
        currentRecord.__id,
      );

      if (gotValues) {
        return gotValues;
      }
    }
    return valuesFromTemplate(template, imageGenerators);
  }, [template, currentRecord, imageGenerators]);

  const previewTemplateInstanceValues = useMemo(() => {
    if (
      template &&
      currentRecord &&
      currentRecord.__id &&
      editableTemplateInstanceValues
    ) {
      const values = getTemplateInstanceValues(
        template.name,
        currentRecord.__id,
      );

      return compileTemplateValues(
        values ?? editableTemplateInstanceValues,
        currentRecord,
      );
    }
    return editableTemplateInstanceValues;
  }, [template, templateInstanceValues, currentRecord]);

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
              <InstalledPluginsDialog>
                <Button size="sm" variant="ghost">
                  <PlugIcon className="mr-2" />
                  <span>Plugins</span>
                </Button>
              </InstalledPluginsDialog>

              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  emitter.emit("openImporter", { id: "template-import" })
                }
              >
                <UploadIcon className="mr-2" />
                <span>Import Template</span>
              </Button>
            </div>
          </div>

          <div className="px-4 text-sm flex-1">
            <TemplateEditor
              template={template}
              values={editableTemplateInstanceValues}
              onChange={(newValues) => {
                if (!template || !currentRecord || !currentRecord.__id) return;

                updateTemplateInstanceValue(
                  currentRecord.__id,
                  template.name,
                  newValues,
                );
              }}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
      <TemplateImportDialog onUpload={setTemplate} />
    </>
  );
}
