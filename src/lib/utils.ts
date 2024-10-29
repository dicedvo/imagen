import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import emitter, { Events } from "./event-bus";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function showAlertDialog(details: Events["onTriggerAlertDialog"]) {
  emitter.emit("onTriggerAlertDialog", details);
}
