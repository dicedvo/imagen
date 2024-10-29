import { produce } from "immer";
import { useEffect, useMemo, useState } from "react";

export interface UploadProgressMap {
  entries: Record<string, UploadProgress>;
  isDone: boolean;
  get(file: string): UploadProgress;
  update(file: string, progress: number, message: string): void;
  resetAll(): void;
}

export interface UploadProgress {
  progress: number;
  message: string;
  update(progress: number, message: string): void;
}

export function updateProgress(
  onUpdate: (s: UploadProgress) => void,
  progress: number,
  message: string,
) {
  const finalProgress = Math.min(100, Math.max(0, progress));
  onUpdate({
    progress: finalProgress,
    message,
    update: updateProgress.bind(null, onUpdate),
  });
}

export function createUploadProgress(
  onUpdate: (s: UploadProgress) => void,
): UploadProgress {
  return {
    progress: 0,
    message: "",
    update: updateProgress.bind(null, onUpdate),
  };
}

export function useUploadProgressMap(): UploadProgressMap {
  const [entries, setEntries] = useState<Record<string, UploadProgress>>({});
  const isDone = useMemo(() => {
    for (const key in entries) {
      if (entries[key].progress < 100) {
        return false;
      }
    }
    return true;
  }, [entries]);

  const onUpdate = (file: string) => {
    return (e: UploadProgress) => {
      setEntries(
        produce((draftEntries) => {
          draftEntries[file] = e;
        }),
      );
    };
  };

  useEffect(() => {
    console.log("entries", entries);
  }, [entries]);

  return {
    entries,
    isDone,
    update(file: string, progress: number, message: string) {
      setEntries(
        produce((entries) => {
          const updateFn = onUpdate(file);
          if (!entries[file]) {
            entries[file] = createUploadProgress(updateFn);
          }
          updateProgress(updateFn, progress, message);
        }),
      );
    },
    get(file) {
      if (!entries[file]) {
        setEntries(
          produce((entries) => {
            entries[file] = createUploadProgress((p) => {
              console.log("[unhandled]", p.progress, p.message);
            });
          }),
        );
      }
      return entries[file];
    },
    resetAll() {
      for (const key of Object.keys(entries)) {
        entries[key].update(0, "");
      }
    },
  };
}
