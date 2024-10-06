import { FC, ReactNode } from "react";
import { ScrollArea } from "../ui/scroll-area";

export default function TabViewContainer({
  title,
  actions: Actions,
  afterTitle: AfterTitle,
  children,
}: {
  title: string;
  actions: FC;
  afterTitle?: FC;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="px-4 py-1 flex items-center justify-between">
          <p className="font-semibold text-sm">{title}</p>
          <div>
            <Actions />
          </div>
        </div>

        {AfterTitle && <AfterTitle />}
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full overflow-hidden">
          {children}
        </ScrollArea>
      </div>
    </div>
  );
}
