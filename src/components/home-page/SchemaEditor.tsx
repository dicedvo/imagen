import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "../ui/button";
import FieldEditorDialog from "../FieldEditorDialog";
import useSchemaStore from "@/stores/schema_store";
import { useShallow } from "zustand/react/shallow";
import TabViewContainer from "./TabViewContainer";

export default function SchemaEditor() {
  const [fields, addFields, updateField] = useSchemaStore(
    useShallow((state) => [
      state.currentSchema.fields,
      state.addFields,
      state.updateField,
    ]),
  );

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
        {fields.length === 0 && (
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

        {fields.map((field) => (
          <div
            key={field.key}
            className="flex items-center justify-between py-4 border-b"
          >
            <div>
              <p className="text-md">{field.name}</p>
              <p className="text-xs text-gray-500">{field.key}</p>
            </div>
            <div className="space-x-2">
              <FieldEditorDialog
                field={field}
                onSave={(updatedField) => {
                  updateField(updatedField);

                  // TODO:
                  // if (updatedField.key !== field.key) {
                  //   records
                  //     .map((record) => {
                  //       if (record[field.key] !== undefined) {
                  //         record[updatedField.key] = record[field.key];
                  //         delete record[field.key];
                  //       }
                  //       return record;
                  //     })
                  //     .forEach(updateRecord);
                  // }
                }}
              >
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
