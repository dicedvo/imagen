import { UploadProgressMap, useUploadProgressMap } from "@/lib/progress";
import React, { useEffect, useMemo, useState } from "react";
import { Accept, useDropzone } from "react-dropzone";
import mime from "mime";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { FileIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react";
import { Progress } from "@radix-ui/react-progress";

export interface FileUploadDropZoneProps {
  accept?: string[] | Accept;
  maxFiles?: number;
  onUpload: (files: File[], progress: UploadProgressMap) => void;
}

export default function FileUploadDropZone({
  accept,
  maxFiles,
  onUpload,
  footerChildren: FooterChildren,
}: FileUploadDropZoneProps & {
  footerChildren?: React.FC<{
    uploadState: "idle" | "uploading";
    files: File[];
    setUploadState: (state: "idle" | "uploading") => void;
    openDialog: () => void;
  }>;
}) {
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");
  const [files, setFiles] = useState<File[]>([]);

  const acceptMap = useMemo(() => {
    if (!accept) {
      return {};
    } else if (typeof accept == "object" && !Array.isArray(accept)) {
      return accept;
    }

    return accept.reduce<Accept>((acc, type) => {
      acc[type] = Array.from(mime.getAllExtensions(type) ?? []).map(
        (ext) => `.${ext}`,
      );
      return acc;
    }, {});
  }, [accept]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openDialog,
  } = useDropzone({
    accept: acceptMap,
    onDropAccepted(files) {
      setFiles((f) => [...f, ...files]);
    },
  });

  // const progress = useUploadProgressMap();

  useEffect(() => {
    return () => {
      setUploadState("idle");
      setFiles([]);
      // progress.resetAll();
    };
  }, []);

  useEffect(() => {
    if (uploadState === "uploading") {
      // for (const file of files) {
      //   progress.update(file.name, 0, "Uploading...");
      // }
      onUpload(files, {
        entries: {},
        isDone: true,
        get(file) {
          return {
            message: "Uploading...",
            progress: 100,
            update(progress, message) {},
          };
        },
        resetAll() {},
        update(file, progress, message) {},
      });

      setUploadState("idle");
    } else {
      // progress.resetAll();
    }
  }, [files, uploadState]);

  // useEffect(() => {
  //   if (progress.isDone) {
  //     setUploadState("idle");
  //   }
  // }, [progress.isDone]);

  return (
    <>
      <div className="relative outline-0" {...getRootProps()}>
        <div
          className={cn(
            "transition-opacity opacity-0 w-full h-full absolute inset-0 bg-gray-100 border-dashed border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center",
            isDragActive && "opacity-1",
          )}
        >
          <input {...getInputProps({ className: "hidden" })} />
          <p className="text-gray-400">Drag and drop files here</p>
        </div>

        <div className="relative flex flex-col space-y">
          {files.length === 0 && (
            <div className="flex flex-col text-center items-center py-8">
              <UploadIcon size={96} className="mb-4" />
              <p className="text-2xl mb-2">Upload or drag files here</p>
              {accept && (
                <p>
                  Accepted files: {Object.values(acceptMap).flat().join(", ")}
                </p>
              )}
            </div>
          )}

          {files.map((file, idx) => (
            <div
              key={`file_${file.name}`}
              className="flex justify-between items-center py-2"
            >
              <div className="space-x-2 flex items-center">
                <FileIcon />
                <p>{file.name}</p>
              </div>

              <div className="flex items-center justify-end space-x-2">
                {uploadState === "uploading" && (
                  <Progress
                    className="w-32"
                    // value={progress.entries[file.name]?.progress || 0}
                    value={100}
                  />
                )}

                {uploadState !== "uploading" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFiles((files) => {
                        const newFiles = [...files];
                        newFiles.splice(idx, 1);
                        return newFiles;
                      });
                    }}
                  >
                    <XIcon />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {files.length !== 0 && (!maxFiles || files.length < maxFiles) && (
            <Button onClick={openDialog} className="w-full mt-4">
              <PlusIcon className="mr-2" />
              <span>Add files</span>
            </Button>
          )}
        </div>
      </div>

      {FooterChildren && (
        <FooterChildren
          setUploadState={setUploadState}
          files={files}
          uploadState={uploadState}
          openDialog={openDialog}
        />
      )}
    </>
  );
}
