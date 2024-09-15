import { useEffect, useMemo, useRef, useState } from "react";
import { any, Filter } from "@nedpals/pbf";
import {
  stringify as stringifyFilter,
  parse as parseFilter,
} from "@nedpals/pbf";
import { SearchIcon, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import useTagsStore, { useTagsSearchIndex } from "@/stores/tags_store";
import { useShallow } from "zustand/react/shallow";
import TagDisplay from "./TagDisplay";

export interface SearchBoxValue {
  filters: Filter[];
  query: string;
}

export default function SearchBox({
  className,
  onChange,
  value,
}: {
  className?: string;
  value: SearchBoxValue;
  onChange: (value: SearchBoxValue) => void;
}) {
  const { filters, query } = value;
  const [openSuggestions, setOpenSuggestions] = useState(true);
  const searchbarContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const tags = useTagsStore(useShallow((state) => state.tags));
  const tagsSearch = useTagsSearchIndex();

  const searchResults = useMemo(() => {
    if (!query) {
      return null;
    }

    const existingFilters = filters
      .filter((f) => "field" in f)
      .map((f) => f.value);
    const results = tagsSearch.search(query).map((r) => r.id);
    const foundTags = tags.filter(
      (t) => results.includes(t.name) && !existingFilters.includes(t.name),
    );

    return {
      tags: foundTags,
    };
  }, [query]);

  const produce = (newFilters: Filter[] | null, newQuery: string | null) => {
    onChange({
      filters: newFilters !== null ? newFilters : filters,
      query: newQuery !== null ? newQuery : query,
    });
  };

  const processQuery = (query: string) => {
    if (
      query.length === 0 ||
      (query[query.length - 1] !== " " && query[query.length - 1] !== ",")
    ) {
      produce(null, query);
      return;
    }

    const textBeforeSpecial = query.slice(0, -1);
    try {
      const filter = parseFilter(textBeforeSpecial);
      if ("field" in filter && filter.field === "tags") {
        const tag = tags.find((t) => t.name === filter.value);
        if (tag) {
          filter.meta = {
            color: tag.color,
          };
        }
      }

      produce([...filters, filter], "");
    } catch (e) {
      // console.error(e);
      produce(null, query);
    }
  };

  const handleResizeSearchbarContainer = () => {
    setContainerWidth(searchbarContainerRef.current?.offsetWidth ?? 0);
  };

  useEffect(() => {
    handleResizeSearchbarContainer();
    window.addEventListener("resize", handleResizeSearchbarContainer);
    return () => {
      window.removeEventListener("resize", handleResizeSearchbarContainer);
    };
  }, []);

  return (
    <>
      <Popover open={openSuggestions} onOpenChange={setOpenSuggestions}>
        <PopoverTrigger asChild>
          <div
            ref={searchbarContainerRef}
            className={cn(className, "w-full flex items-stretch bg-white")}
          >
            <div className="pl-4 pr-2 py-3">
              <SearchIcon className="text-gray-500" size={20} />
            </div>
            <div className="flex-1 flex overflow-scroll no-scrollbar">
              <div className="h-full flex-shrink-0 flex-grow flex items-stretch flex-nowrap">
                {filters.map((f, idx) => (
                  <div
                    key={`filter_${idx}`}
                    className="w-auto self-center pr-2"
                  >
                    <div
                      className={cn(
                        "px-2 py-1 rounded-md flex space-x-2 items-center text-sm",
                        {
                          "bg-gray-200":
                            !f.meta ||
                            !f.meta.color ||
                            typeof f.meta.color !== "string",
                        },
                      )}
                      style={
                        f.meta &&
                        f.meta.color &&
                        typeof f.meta.color === "string"
                          ? {
                              backgroundColor: f.meta.color,
                              color: "white",
                            }
                          : {}
                      }
                    >
                      <span className="flex-1 block">{stringifyFilter(f)}</span>
                      <button
                        className="rounded-full hover:bg-black/60 hover:text-white"
                        onClick={() => {
                          const newFilters = [...filters];
                          newFilters.splice(idx, 1);
                          produce(newFilters, null);
                        }}
                      >
                        <XIcon size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <input
                  type="text"
                  className="outline-none w-full h-full flex-1 bg-transparent"
                  placeholder="Search for records..."
                  onKeyDown={(ev) => {
                    if (
                      ev.currentTarget.value.length === 0 &&
                      ev.key === "Backspace"
                    ) {
                      const newFilters = [...filters];
                      newFilters.pop();
                      produce(newFilters, null);
                    }
                  }}
                  value={query}
                  onChange={(ev) => {
                    const text = ev.currentTarget.value;
                    setOpenSuggestions(text.length !== 0);
                    processQuery(text);
                  }}
                />
              </div>
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="rounded-none p-0"
          onOpenAutoFocus={(ev) => {
            ev.preventDefault();
          }}
          sideOffset={-0.5}
          style={{
            width: `${containerWidth}px`,
          }}
        >
          {query.length === 0 ? (
            <div className="text-muted-foreground px-4 py-2">
              <p>Enter your query to search for records.</p>
            </div>
          ) : searchResults ? (
            <div>
              <button
                className="flex space-x-2 items-center hover:bg-gray-100 w-full px-4 py-2"
                onClick={() => {
                  produce(null, query);
                  setOpenSuggestions(false);
                }}
              >
                <SearchIcon className="text-gray-500" size={16} />
                <span>Search records for "{query}"</span>
              </button>

              {searchResults.tags.length > 0 && (
                <div className="text-muted-foreground border-t">
                  <p className="text-sm font-semibold px-4 py-2">Tags</p>
                  <ul>
                    {searchResults.tags.map((tag) => (
                      <li key={`tag_result_${tag.name}`} className="py-1">
                        <button
                          className="text-left w-full px-4 py-2 hover:bg-gray-100"
                          onClick={() => {
                            const anyFilter = any("tags", tag.name);
                            anyFilter.meta = {
                              color: tag.color,
                            };

                            produce([...filters, anyFilter], "");
                          }}
                        >
                          <TagDisplay tag={tag} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">
              <p>No results found.</p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
