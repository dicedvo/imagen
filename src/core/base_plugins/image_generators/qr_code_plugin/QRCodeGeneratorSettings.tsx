import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImageGeneratorProps } from "@/core/image_generator";
import { z } from "zod";

const qrCodeGeneratorSchema = z.object({
  text: z.string().optional(),
});

const QRCodeGeneratorSettings = ({
  form,
}: ImageGeneratorProps<z.infer<typeof qrCodeGeneratorSchema>>) => {
  return (
    <div>
      <Form {...form}>
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormItem>
                <FormLabel>Text</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormItem>
          )}
        />
      </Form>
    </div>
  );
};

export default QRCodeGeneratorSettings;
