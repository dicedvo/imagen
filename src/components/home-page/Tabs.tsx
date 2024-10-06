import { cn } from "@/lib/utils";
import { FC, useEffect, useState } from "react";

interface TabItem {
  title: string;
  icon: FC<{ size?: string | number }>;
  Component: FC;
}

export default function Tabs({ items }: { items: TabItem[] }) {
  const [currentTab, setCurrentTab] = useState("");
  const currentTabItem = items.find(({ title }) => title === currentTab);

  useEffect(() => {
    setCurrentTab(items[0].title);
  }, [items]);

  return (
    <div className="flex w-full h-full">
      <div className="w-20 flex flex-col bg-slate-50 border-r h-full">
        {items.map(({ title, icon: Icon }) => (
          <button
            onClick={() => setCurrentTab(title)}
            className={cn(
              "w-full flex flex-col items-center py-3 space-y-1 text-xs hover:bg-slate-200/40",
              currentTab === title && "text-blue-500",
            )}
          >
            <Icon size={21} />
            <span>{title}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col flex-1">
        {currentTabItem ? (
          <currentTabItem.Component />
        ) : (
          <div className="flex items-center justify-center flex-1 text-lg text-slate-400">
            Select a tab
          </div>
        )}
      </div>
    </div>
  );
}
