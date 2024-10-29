import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { DataSourceRecord, defaultIdGenerator } from "@/core/data";
import DataSourceRecordEditor from "./DataSourceRecordEditor";
import { Button } from "./ui/button";
import { Schema } from "@/lib/schema";

export default function AddEntryDialog({
  schema,
  children,
  onSuccess,
}: {
  schema: Schema | null;
  children: ReactNode;
  onSuccess: (data: Omit<DataSourceRecord, "sourceId">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<Pick<DataSourceRecord, "data">>({
    data: {},
  });

  const handleSubmit = (data: Pick<DataSourceRecord, "data">) => {
    onSuccess({
      id: defaultIdGenerator(),
      ...data,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger disabled={!schema || schema.fields.length === 0} asChild>
        {children}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Entry</DialogTitle>
        </DialogHeader>

        <div>
          <DataSourceRecordEditor
            schema={schema!}
            record={record}
            onChange={setRecord}
          />
        </div>

        <DialogFooter className="flex justify-end">
          <Button onClick={() => handleSubmit(record)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
