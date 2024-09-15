import ExportDialog from "@/components/ExportDialog";
import PrintDialog from "@/components/PrintDialog";
import { Button } from "@/components/ui/button";
import { DownloadIcon, PrinterIcon } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center border-b bg-white">
      <div className="py-3 px-4 border-r flex items-center space-x-2">
        <img src="./icon.png" alt="logo" className="h-6" />
        <p className="font-bold">
          ImaGen{" "}
          <span className="text-xs font-normal bg-blue-500 text-white rounded-full px-1.5 py-0.5">
            Alpha
          </span>
        </p>
      </div>

      <div className="px-2 flex-1">
        <p className="text-muted-foreground text-sm text-center">
          You are using a pre-release version of ImaGen. Please report any bugs.
        </p>
      </div>

      <div className="pr-2 space-x-2 flex items-center">
        <PrintDialog>
          <Button size="sm" variant="link">
            <PrinterIcon size={16} className="mr-2" />
            <span>Print</span>
          </Button>
        </PrintDialog>

        <ExportDialog onSuccess={() => {}}>
          <Button size="sm" variant="secondary">
            <DownloadIcon size={16} className="mr-2" />
            <span>Export</span>
          </Button>
        </ExportDialog>
      </div>
    </header>
  );
}
