import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { ReactNode, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import FieldEditorDialog from "./FieldEditorDialog";
import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import useFieldsStore from "@/stores/fields_store";
import useRecordsStore from "@/stores/records_store";

export default function ManageFieldsDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [fields, addFields, updateField] = useFieldsStore(
    useShallow(state => [state.fields, state.addFields, state.updateField]),
  );

  const [records, updateRecord] = useRecordsStore(
    useShallow(state => [state.records, state.updateRecord]),
  );
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Fields</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {fields.length === 0 && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <p className="text-xl text-gray-600">No fields have been added yet.</p>

              <FieldEditorDialog onSave={addFields}>
                <Button variant="secondary">
                  <PlusIcon className="mr-2" size={18} />
                  <span>Add Field</span>
                </Button>
              </FieldEditorDialog>
            </div>
          )}

          {fields.map(field => (
            <div key={field.key} className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="text-md">{field.name}</p>
                <p className="text-xs text-gray-500">{field.key}</p>
              </div>
              <div className="space-x-2">
                <FieldEditorDialog field={field} onSave={(updatedField) => {
                  updateField(updatedField);

                  if (updatedField.key !== field.key) {
                    records.map(record => {
                      if (record[field.key] !== undefined) {
                        record[updatedField.key] = record[field.key];
                        delete record[field.key];
                      }
                      return record;
                    }).forEach(updateRecord);
                  }
                }}>
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

          {fields.length !== 0 && (
            <FieldEditorDialog onSave={addFields}>
              <Button variant="secondary">
                <PlusIcon className="mr-2" size={18} />
                <span>Add Field</span>
              </Button>
            </FieldEditorDialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}