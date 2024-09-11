import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImageGeneratorProps } from "@/core/image_generator";
import { z } from "zod";

const dynamicImageGeneratorSchema = z.object({
  src: z.string().optional(),
  fallback: z.string().optional(),
});

const DynamicImageGeneratorSettings = ({
  form,
}: ImageGeneratorProps<z.infer<typeof dynamicImageGeneratorSchema>>) => {
  return (
    <div>
      <Form {...form}>
        <FormField
          control={form.control}
          name="src"
          render={({ field }) => (
            <FormItem>
              <FormItem>
                <FormLabel>Source</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  The source image to be displayed. You may use URLs or template
                  variables to reference image URLs from data records.
                </FormDescription>
              </FormItem>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fallback"
          render={({ field }) => (
            <FormItem>
              <FormItem>
                <FormLabel>Fallback Image</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  If the source image fails to load, the fallback image will be
                  displayed.
                </FormDescription>
              </FormItem>
            </FormItem>
          )}
        />
      </Form>
    </div>
  );
};

export default DynamicImageGeneratorSettings;
