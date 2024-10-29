import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "../ui/button";
import FieldEditorDialog from "../FieldEditorDialog";
import useSchemaStore from "@/stores/schema_store";
import { useShallow } from "zustand/react/shallow";
import TabViewContainer from "./TabViewContainer";
import useDataStore from "@/stores/data_store";
import { Schema } from "@/lib/schema";
import { DataSource } from "@/core/data";
import { useEffect, useState } from "react";
import MapSchemaDialog from "../MapFieldsDialog";
import { showAlertDialog } from "@/lib/utils";

export default function SchemaEditor() {
  const [sourcesToUpdate, setSourcesToUpdate] = useState<DataSource<Schema>[]>(
    [],
  );

  const [sources, conformRecordsToSchema, updateSource] = useDataStore(
    (state) => [
      state.sources,
      state.conformRecordsToSchema,
      state.updateSource,
    ],
  );

  const currentSchema = useSchemaStore((state) => state.currentSchema);
  const [addFields, updateField, removeField] = useSchemaStore(
    useShallow((state) => [
      state.addFields,
      state.updateField,
      state.removeField,
    ]),
  );

  useEffect(() => {
    sources.forEach((s) => {
      conformRecordsToSchema(s.id, currentSchema);
    });
  }, [currentSchema, sources]);

  const handleUpdateSchemaFieldRename = (oldKey: string, newKey: string) => {
    sources.forEach((s) => {
      const newSchemaSystemValues: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(s.systemSchemaValues)) {
        if (key === oldKey) {
          newSchemaSystemValues[newKey] = value;
        } else {
          newSchemaSystemValues[key] = value;
        }
      }

      updateSource({
        ...s,
        systemSchemaValues: newSchemaSystemValues,
      });
    });
  };

  return (
    <>
      <TabViewContainer
        title="Schema"
        actions={() => (
          <div>
            <FieldEditorDialog
              onSave={(newField) => {
                addFields(newField);
                setSourcesToUpdate(sources);
              }}
            >
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
                <FieldEditorDialog
                  field={field}
                  onSave={(updatedField) => {
                    updateField(updatedField);
                    if (updatedField.key !== field.key) {
                      handleUpdateSchemaFieldRename(
                        field.key,
                        updatedField.key,
                      );
                    }
                  }}
                >
                  <Button size="sm" variant="secondary">
                    <EditIcon className="mr-1.5" size={14} />
                    <span>Edit</span>
                  </Button>
                </FieldEditorDialog>

                <Button
                  onClick={() => {
                    showAlertDialog({
                      title: "Delete Field",
                      description: `Are you sure you want to delete the field "${field.name}"?`,
                      actions: {
                        confirm: {
                          label: "Delete",
                          onClick: () => {
                            removeField(field.key);
                          },
                        },
                      },
                    });
                  }}
                  size="sm"
                  variant="destructive"
                >
                  <TrashIcon className="mr-1.5" size={14} />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </TabViewContainer>

      <MapSchemaDialog
        source={sourcesToUpdate[sourcesToUpdate.length - 1] ?? null}
        currentSchema={currentSchema}
        onClose={() => setSourcesToUpdate((prev) => prev.slice(-1))} // pop the last element
        onSuccess={(mappings) => {
          const sourceToUpdate = sourcesToUpdate[sourcesToUpdate.length - 1];
          if (!sourceToUpdate) return;

          // setTimeout to 200ms, pop the columnsToMapStack, and then set the mappings
          updateSource({
            ...sourceToUpdate,
            systemSchemaValues: mappings as Record<string, unknown>,
          });

          conformRecordsToSchema(sourceToUpdate.id, currentSchema);
          setSourcesToUpdate((prev) => prev.slice(-1)); // pop the last element
        }}
      />
    </>
  );
}
