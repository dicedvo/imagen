import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { DataRecord } from "@/core/data";
import DataRecordEditor from "./DataRecordEditor";
import { Button } from "./ui/button";

export default function AddEntryDialog({
  children,
  onSuccess,
}: {
  children: ReactNode;
  onSuccess: (data: DataRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<DataRecord>({});

  const handleSubmit = (data: DataRecord) => {
    onSuccess(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Entry</DialogTitle>
        </DialogHeader>

        <div>
          <DataRecordEditor record={record} onChange={setRecord} />
        </div>

        <DialogFooter className="flex justify-end">
          <Button onClick={() => handleSubmit(record)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
