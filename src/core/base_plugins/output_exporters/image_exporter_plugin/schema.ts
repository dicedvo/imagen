import { z } from "zod";

const imageExportOptionsSchema = z.object({
  quality: z.number().int().min(0).max(100),
});

export default imageExportOptionsSchema;
