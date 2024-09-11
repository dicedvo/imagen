import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FileUploadDropZone, {
  FileUploadDropZoneProps,
} from "./FileUploadDropZone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { UploadProgressMap, useUploadProgressMap } from "@/lib/progress";
import { cn } from "@/lib/utils";
import fs from "@/core/template/fs";
import { AssetURIHandler } from "@/core/template/assets";

interface Asset {
  filename: string;
  file: Blob;
}

export default function AssetLibraryDialog({
  value,
  onSelect,
  onSelectURI,
  children,
  ...fileUploadProps
}: {
  title?: string;
  children: ReactNode;
  value: string[]; // asset URIs
  onSelect?: (selectAssets: Asset[], progress: UploadProgressMap) => void;
  onSelectURI?: (selectAssets: string[], progress: UploadProgressMap) => void;
} & Omit<FileUploadDropZoneProps, "onUpload">) {
  const [tabName, setTabName] = useState("library");
  const [open, setOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [selectedAssetsMap, setSelectAssetsMap] = useState<
    Record<string, boolean>
  >({});
  const assets = useMemo<Record<string, Asset>>(() => {
    return Array.from(fs.files).reduce<Record<string, Asset>>(
      (acc, [filename, file]) => {
        acc[filename] = {
          filename,
          file,
        };
        return acc;
      },
      {},
    );
  }, []);
  const progress = useUploadProgressMap();
  const uriHandler = AssetURIHandler;
  const addAsset = async (filename: string, file: File) => {
    fs.writeFile(filename, file);
  };

  useEffect(() => {
    return () => {
      setSelectedAssets([]);
      setSelectAssetsMap({});
    };
  }, []);

  useEffect(() => {
    setSelectedAssets(
      value
        .map(uriHandler.transform)
        .filter(Boolean)
        .map((filename) => assets[filename]),
    );
  }, [uriHandler, assets, value]);

  useEffect(() => {
    console.log(assets);
  }, [assets]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asset Upload</DialogTitle>
        </DialogHeader>

        <Tabs value={tabName} onValueChange={setTabName}>
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <div className="flex flex-wrap -m-2">
              {Object.entries(assets).map(([assetName, asset]) => (
                <div className="p-2 w-1/4" key={`asset_${assetName}`}>
                  <div
                    onClick={() => {
                      setSelectAssetsMap((map) => {
                        map[assetName] = !map[assetName];
                        return { ...map };
                      });

                      setSelectedAssets((assets) => {
                        if (selectedAssetsMap[assetName]) {
                          return assets.filter((a) => a.filename !== assetName);
                        } else {
                          return [...assets, asset];
                        }
                      });
                    }}
                    className={cn(
                      selectedAssetsMap[assetName] &&
                        "border-blue-500 bg-blue-100",
                      "border p-4 rounded",
                    )}
                  >
                    <p>{assetName}</p>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="justify-end space-x-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button
                disabled={selectedAssets.length === 0}
                onClick={() => {
                  if (onSelect) onSelect(selectedAssets, progress);
                  if (onSelectURI && uriHandler)
                    onSelectURI(
                      selectedAssets.map(uriHandler.stringify),
                      progress,
                    );
                  setOpen(false);
                }}
              >
                Select
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="upload">
            <FileUploadDropZone
              {...fileUploadProps}
              onUpload={(files) => {
                for (const file of files) {
                  addAsset(file.name, file);
                }
                if (onSelect) {
                  onSelect(
                    files.map((file) => assets[file.name]),
                    progress,
                  );
                }
                setOpen(false);
              }}
              footerChildren={({
                uploadState,
                files,
                setUploadState,
                openDialog,
              }) => (
                <DialogFooter className="justify-end space-x-2">
                  <Button
                    variant="secondary"
                    disabled={uploadState === "uploading"}
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={() => {
                      if (files.length === 0) {
                        openDialog();
                      } else {
                        setUploadState(
                          uploadState === "idle" ? "uploading" : "idle",
                        );
                      }
                    }}
                  >
                    {uploadState === "idle" ? "Upload" : "Stop"}
                  </Button>
                </DialogFooter>
              )}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
