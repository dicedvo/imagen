import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import emitter, { Events } from "@/lib/event-bus";

export default function EBAlertDialog() {
  const [open, setOpen] = useState(false);
  const [dialogDetails, setDialogDetails] = useState<
    Events["onTriggerAlertDialog"] | null
  >(null);

  const handleDialogDetails = (details: Events["onTriggerAlertDialog"]) => {
    setTimeout(() => {
      setDialogDetails(details);
    }, 100); // 100ms delay to avoid flickering
  };

  useEffect(() => {
    emitter.on("onTriggerAlertDialog", handleDialogDetails);
    return () => {
      emitter.off("onTriggerAlertDialog", handleDialogDetails);
    };
  });

  useEffect(() => {
    if (dialogDetails) {
      setOpen(true);
    }
  }, [dialogDetails]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setDialogDetails(null);
      }, 210); // 210ms delay to allow the dialog to close
    }
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dialogDetails?.title ?? "Are you absolutely sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDetails?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={dialogDetails?.actions.cancel?.onClick}>
            {dialogDetails?.actions.cancel?.label ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              dialogDetails?.actions.confirm.onClick();
              setOpen(false);
            }}
          >
            {dialogDetails?.actions.confirm.label ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
