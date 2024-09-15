import { ReactNode, useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useTagsStore, { Tag } from "@/stores/tags_store";
import { Button } from "@/components/ui/button";
import { EditIcon, PlusIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ColorPicker from "@/components/ColorPicker";
import { useShallow } from "zustand/react/shallow";
import TagDisplay from "./TagDisplay";

const tagSchema = z.object({
  name: z.string(),
  color: z.string(),
});

function TagEditorDialog({
  tag,
  children,
  onSave,
}: {
  tag?: Tag;
  children: ReactNode;
  onSave: (name: string | null, tag: Tag) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof tagSchema>>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "name",
      color: "#E5E7EB",
    },
  });

  useEffect(() => {
    if (tag) {
      form.reset(tag);
    }
  }, [tag]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogTitle>{tag ? "Edit" : "Add new"} tag</DialogTitle>

        <Form {...form}>
          <form
            id="tag-form"
            onSubmit={form.handleSubmit((newTag) => {
              if (tag) {
                onSave(tag.name, newTag);
              } else {
                onSave(null, newTag);
              }
              setOpen(false);
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <ColorPicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>

          <DialogFooter className="flex items-center justify-end space-x-2">
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>

            <Button type="submit" form="tag-form">
              Save
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function TagsDialog({ children }: { children: ReactNode }) {
  const tags = useTagsStore((state) => state.tags);
  const [updateTag, addTags] = useTagsStore(
    useShallow((state) => [state.updateTag, state.addTags]),
  );

  const handleOnSave = (tagName: string | null, tag: Tag) => {
    if (tagName) {
      updateTag(tagName, tag);
    } else {
      addTags(tag);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogTitle>Tags</DialogTitle>

        <div className="flex flex-col">
          {tags.length === 0 ? (
            <div className="py-24 flex flex-col items-center space-y-2">
              <p>There are no tags yet.</p>
              <TagEditorDialog onSave={handleOnSave}>
                <Button className="flex items-center space-x-2">
                  <PlusIcon />
                  Create tag
                </Button>
              </TagEditorDialog>
            </div>
          ) : (
            <>
              {tags.map((tag) => (
                <div
                  key={`tag_${tag.name}`}
                  className="flex items-center justify-between"
                >
                  <TagDisplay tag={tag} />

                  <TagEditorDialog tag={tag} onSave={handleOnSave}>
                    <Button size="sm" className="flex items-center space-x-2">
                      <EditIcon size={12} />
                      <span>Edit</span>
                    </Button>
                  </TagEditorDialog>
                </div>
              ))}

              <TagEditorDialog onSave={handleOnSave}>
                <Button className="w-full flex items-center justify-center mt-4">
                  <PlusIcon className="mr-2" />
                  <span>Add tag</span>
                </Button>
              </TagEditorDialog>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
