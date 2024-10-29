import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "../ui/button";
import FieldEditorDialog from "../FieldEditorDialog";
import useSchemaStore from "@/stores/schema_store";
import { useShallow } from "zustand/react/shallow";
import TabViewContainer from "./TabViewContainer";
import useDataStore from "@/stores/data_store";
import { useEffect } from "react";

export default function SchemaEditor() {
  const [sources, conformRecordsToSchema] = useDataStore((state) => [
    state.sources,
    state.conformRecordsToSchema,
  ]);

  const [currentSchema, addFields, updateField] = useSchemaStore(
    useShallow((state) => [
      state.currentSchema,
      state.addFields,
      state.updateField,
    ]),
  );

  useEffect(() => {
    sources.forEach((s) => {
      conformRecordsToSchema(s.id, currentSchema);
    });
  }, [sources, currentSchema]);

  return (
    <TabViewContainer
      title="Schema"
      actions={() => (
        <div>
          <FieldEditorDialog onSave={addFields}>
            <Button size="sm" variant="ghost">
              <PlusIcon className="mr-2" size={16} />
              <span>Add Field</span>
            </Button>
          </FieldEditorDialog>
        </div>
      )}
    >
      <div className="flex flex-col px-4">
        {currentSchema.fields.length === 0 && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <p className="text-xl text-gray-600">
              No fields have been added yet.
            </p>

            <FieldEditorDialog onSave={addFields}>
              <Button variant="secondary">
                <PlusIcon className="mr-2" size={18} />
                <span>Add Field</span>
              </Button>
            </FieldEditorDialog>
          </div>
        )}

        {currentSchema.fields.map((field) => (
          <div
            key={field.key}
            className="flex items-center justify-between py-4 border-b"
          >
            <div>
              <p className="text-md">{field.name}</p>
              <p className="text-xs text-gray-500">{field.key}</p>
            </div>
            <div className="space-x-2">
              <FieldEditorDialog field={field} onSave={updateField}>
                <Button size="sm" variant="secondary">
                  <EditIcon className="mr-1.5" size={14} />
                  <span>Edit</span>
                </Button>
              </FieldEditorDialog>

              <Button size="sm" variant="destructive">
                <TrashIcon className="mr-1.5" size={14} />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </TabViewContainer>
  );
}
